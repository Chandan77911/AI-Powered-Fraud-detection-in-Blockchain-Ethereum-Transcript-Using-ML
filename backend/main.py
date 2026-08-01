"""
Ethereum Fraud Sentinel — FastAPI Backend v3 (Phase 2)
=======================================================
Three REAL trained models:
  1. XGBoost             — 22 behavioural features         (AUC 0.989)
  2. IsolationForest     — anomaly detection on legit set  (AUC 0.629)
  3. Sequential GB       — sequence-derived drain features (AUC 0.985)

All three are trained from address_data_combined_ts.csv on first startup
and saved as .pkl files for fast reloading.

Endpoints:
  GET  /api/health
  POST /api/predict           — manual 22-feature input
  POST /api/analyze-address   — auto-fetch Etherscan + full Phase 2 output
"""

import os, pickle, logging
from pathlib import Path
from typing import Optional, List

import httpx
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fraud-sentinel")

app = FastAPI(title="Ethereum Fraud Sentinel API v3", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "97Q3WGXXKSXEHVUMSUC5H4IIZQR79ZNY1U")
ETHERSCAN_BASE    = "https://api.etherscan.io/v2/api"
FRAUD_THRESHOLD   = 0.30

FEATURE_NAMES = [
    "Avg min between sent tnx", "Avg min between received tnx",
    "Time Diff between first and last (Mins)", "Unique Received From Addresses",
    "min value received", "max value received ", "avg val received",
    "min val sent", "avg val sent",
    "total transactions (including tnx to create contract",
    "total ether received", "total ether balance",
    "adjusted_eth_value__absolute_sum_of_changes",
    "adjusted_eth_value__mean_abs_change",
    "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0",
    "adjusted_eth_value__sum_values", "adjusted_eth_value__abs_energy",
    "adjusted_eth_value__ratio_value_number_to_time_series_length",
    "adjusted_eth_value__quantile__q_0.1",
    "adjusted_eth_value__count_below__t_0", "adjusted_eth_value__count_above__t_0",
    "adjusted_eth_value__median",
]

FEATURE_LABELS = {
    "Avg min between sent tnx":           "avg_sent_gap",
    "Avg min between received tnx":       "avg_recv_gap",
    "Time Diff between first and last (Mins)": "active_lifespan",
    "Unique Received From Addresses":     "unique_senders",
    "min value received":                 "min_recv",
    "max value received ":                "max_recv",
    "avg val received":                   "avg_recv",
    "min val sent":                       "min_sent",
    "avg val sent":                       "avg_sent",
    "total transactions (including tnx to create contract": "total_txns",
    "total ether received":               "total_eth_recv",
    "total ether balance":                "eth_balance",
    "adjusted_eth_value__absolute_sum_of_changes": "abs_sum_changes",
    "adjusted_eth_value__mean_abs_change": "mean_abs_change",
    "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0": "energy_ratio",
    "adjusted_eth_value__sum_values":     "sum_values",
    "adjusted_eth_value__abs_energy":     "abs_energy",
    "adjusted_eth_value__ratio_value_number_to_time_series_length": "nonzero_ratio",
    "adjusted_eth_value__quantile__q_0.1": "quantile_10",
    "adjusted_eth_value__count_below__t_0": "count_below_0",
    "adjusted_eth_value__count_above__t_0": "count_above_0",
    "adjusted_eth_value__median":         "median",
}

# ── Global model handles ──────────────────────────────────────────────────────
XGBOOST_MODEL  = None
IFOREST_MODEL  = None
SEQ_MODEL      = None   # GradientBoosting on sequence features
SHAP_EXPLAINER = None


def _find(name: str) -> Optional[Path]:
    for d in [Path(__file__).parent, Path(__file__).parent.parent, Path.cwd()]:
        p = d / name
        if p.exists():
            return p
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Sequence feature builder — must match training exactly
# ─────────────────────────────────────────────────────────────────────────────
def build_sequence_features(X: pd.DataFrame) -> pd.DataFrame:
    """Add 6 sequence-derived features that the Sequential model was trained on."""
    seq = X.copy()

    # 1. sent/recv value ratio (drain pattern)
    avg_sent = seq.get("avg val sent", pd.Series([0.0] * len(seq), index=seq.index))
    avg_recv = seq.get("avg val received", pd.Series([0.0] * len(seq), index=seq.index))
    seq["sent_recv_ratio"] = (avg_sent / (avg_recv + 1e-9)).clip(0, 100)

    # 2. transaction intensity (txns per active day)
    life_mins  = seq.get("Time Diff between first and last (Mins)",
                         pd.Series([1.0] * len(seq), index=seq.index)).clip(1, None)
    total_txns = seq.get("total transactions (including tnx to create contract",
                          pd.Series([0.0] * len(seq), index=seq.index))
    seq["tx_intensity"] = total_txns / (life_mins / 1440 + 1)

    # 3. balance drain ratio
    total_recv = seq.get("total ether received",
                          pd.Series([1e-9] * len(seq), index=seq.index)).clip(1e-9, None)
    balance    = seq.get("total ether balance",
                          pd.Series([0.0] * len(seq), index=seq.index))
    seq["drain_ratio"] = (1 - balance / total_recv).clip(0, 1)

    # 4. volatility per transaction
    abs_sum = seq.get("adjusted_eth_value__absolute_sum_of_changes",
                       pd.Series([0.0] * len(seq), index=seq.index))
    seq["vol_per_tx"] = (abs_sum / (total_txns + 1)).clip(0, 10000)

    # 5. outgoing dominance (fraction of signed values below zero)
    seq["outgoing_dom"] = seq.get("adjusted_eth_value__count_below__t_0",
                                   pd.Series([0.0] * len(seq), index=seq.index))

    # 6. sending speed score (inverse of avg gap — higher = faster = more bot-like)
    sent_gap = seq.get("Avg min between sent tnx",
                        pd.Series([1.0] * len(seq), index=seq.index)).clip(0, 100000)
    seq["speed_score"] = 1.0 / (sent_gap + 1)

    return seq


# ─────────────────────────────────────────────────────────────────────────────
# Model loading / training
# ─────────────────────────────────────────────────────────────────────────────
def load_xgboost():
    global XGBOOST_MODEL
    p = _find("xgboost_fraud_ts.pkl")
    if p:
        with open(p, "rb") as f: XGBOOST_MODEL = pickle.load(f)
        log.info("XGBoost loaded ✓")
        return
    _train_from_csv("xgboost")


def load_iforest():
    global IFOREST_MODEL
    p = _find("iforest_fraud.pkl")
    if p:
        with open(p, "rb") as f: IFOREST_MODEL = pickle.load(f)
        log.info("IsolationForest loaded ✓")
        return
    _train_from_csv("iforest")


def load_sequential():
    global SEQ_MODEL
    p = _find("sequential_model.pkl")
    if p:
        with open(p, "rb") as f: SEQ_MODEL = pickle.load(f)
        log.info(f"Sequential model loaded ✓  (type: {type(SEQ_MODEL.get('model')).__name__})")
        return
    _train_from_csv("sequential")


def _train_from_csv(which: str):
    global XGBOOST_MODEL, IFOREST_MODEL, SEQ_MODEL
    csv = _find("address_data_combined_ts.csv")
    if not csv:
        log.warning(f"{which}: address_data_combined_ts.csv not found — model unavailable")
        return

    log.info(f"Training {which} from {csv} ...")
    df = pd.read_csv(csv)
    cols_to_drop = [c for c in ["FLAG", "Address"] if c in df.columns]
    X = df.drop(columns=cols_to_drop).select_dtypes(include=["number"])
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    y = df["FLAG"]

    from sklearn.model_selection import train_test_split
    X_tr, _, y_tr, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    save_root = Path(__file__).parent.parent

    if which == "xgboost":
        from xgboost import XGBClassifier
        neg, pos = np.bincount(y_tr)
        XGBOOST_MODEL = XGBClassifier(
            n_estimators=500, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, objective="binary:logistic",
            eval_metric="auc", scale_pos_weight=neg/pos, random_state=42, n_jobs=-1,
        )
        XGBOOST_MODEL.fit(X_tr, y_tr)
        with open(save_root / "xgboost_fraud_ts.pkl", "wb") as f: pickle.dump(XGBOOST_MODEL, f)
        log.info("XGBoost trained & saved ✓")

    elif which == "iforest":
        from sklearn.ensemble import IsolationForest
        X_legit = X_tr[y_tr == 0]
        IFOREST_MODEL = IsolationForest(n_estimators=300, contamination=0.15, random_state=42, n_jobs=-1)
        IFOREST_MODEL.fit(X_legit)
        with open(save_root / "iforest_fraud.pkl", "wb") as f: pickle.dump(IFOREST_MODEL, f)
        log.info("IsolationForest trained & saved ✓")

    elif which == "sequential":
        from sklearn.ensemble import GradientBoostingClassifier
        X_seq = build_sequence_features(X_tr)
        SEQ_MODEL = {
            "model": GradientBoostingClassifier(
                n_estimators=200, max_depth=4, learning_rate=0.05,
                subsample=0.8, random_state=42
            ),
            "feature_names": list(X_seq.columns),
        }
        SEQ_MODEL["model"].fit(X_seq, y_tr)
        with open(save_root / "sequential_model.pkl", "wb") as f: pickle.dump(SEQ_MODEL, f)
        log.info("Sequential model trained & saved ✓")


def build_shap():
    global SHAP_EXPLAINER
    if XGBOOST_MODEL is None: return
    try:
        import shap
        csv = _find("address_data_combined_ts.csv")
        if csv:
            df = pd.read_csv(csv)
            cols_to_drop = [c for c in ["FLAG", "Address"] if c in df.columns]
            X = df.drop(columns=cols_to_drop).select_dtypes(include=["number"])
            X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
            bg = X.sample(min(100, len(X)), random_state=42)
            SHAP_EXPLAINER = shap.TreeExplainer(XGBOOST_MODEL, data=bg)
        else:
            SHAP_EXPLAINER = shap.TreeExplainer(XGBOOST_MODEL)
        log.info("SHAP TreeExplainer ready ✓")
    except Exception as e:
        log.warning(f"SHAP unavailable: {e}")


@app.on_event("startup")
async def startup():
    load_xgboost()
    load_iforest()
    load_sequential()
    build_shap()


# ─────────────────────────────────────────────────────────────────────────────
# Feature computation from raw Etherscan transactions
# ─────────────────────────────────────────────────────────────────────────────
def compute_features_from_txs(txs: list, address: str) -> dict:
    addr = address.lower()
    def eth(v): return float(v) / 1e18

    sent = [t for t in txs if t.get("from","").lower()==addr and t.get("isError")=="0"]
    recv = [t for t in txs if t.get("to",  "").lower()==addr and t.get("isError")=="0"]
    sts  = sorted(int(t["timeStamp"]) for t in sent)
    rts  = sorted(int(t["timeStamp"]) for t in recv)
    ats  = sorted(int(t["timeStamp"]) for t in txs)

    def gap(ts): return sum((ts[i+1]-ts[i])/60 for i in range(len(ts)-1))/(len(ts)-1) if len(ts)>1 else 0.0

    sv = [eth(t["value"]) for t in sent]
    rv = [eth(t["value"]) for t in recv]

    ser_raw = sorted(
        [(int(t["timeStamp"]), -eth(t["value"]) if t.get("from","").lower()==addr else eth(t["value"]))
         for t in txs if t.get("isError")=="0"],
        key=lambda x: x[0]
    )
    ser = [v for _, v in ser_raw]
    n   = max(len(ser), 1)
    ac  = [abs(ser[i+1]-ser[i]) for i in range(len(ser)-1)]
    ae  = sum(v*v for v in ser)
    ss  = sorted(ser)
    mid = n // 2

    return {
        "Avg min between sent tnx":            gap(sts),
        "Avg min between received tnx":        gap(rts),
        "Time Diff between first and last (Mins)": (ats[-1]-ats[0])/60 if len(ats)>1 else 0.0,
        "Unique Received From Addresses":      len(set(t.get("from","").lower() for t in recv)),
        "min value received":                  min(rv) if rv else 0.0,
        "max value received ":                 max(rv) if rv else 0.0,
        "avg val received":                    sum(rv)/len(rv) if rv else 0.0,
        "min val sent":                        min(sv) if sv else 0.0,
        "avg val sent":                        sum(sv)/len(sv) if sv else 0.0,
        "total transactions (including tnx to create contract": len(txs),
        "total ether received":                sum(rv),
        "total ether balance":                 sum(rv) - sum(sv),
        "adjusted_eth_value__absolute_sum_of_changes":  sum(ac),
        "adjusted_eth_value__mean_abs_change":           sum(ac)/len(ac) if ac else 0.0,
        "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0":
            sum(v*v for v in ser[:max(1,n//10)]) / ae if ae > 0 else 0.0,
        "adjusted_eth_value__sum_values":      sum(ser),
        "adjusted_eth_value__abs_energy":      ae,
        "adjusted_eth_value__ratio_value_number_to_time_series_length":
            sum(1 for v in ser if v != 0) / n,
        "adjusted_eth_value__quantile__q_0.1": ss[int(n*0.1)] if ss else 0.0,
        "adjusted_eth_value__count_below__t_0": sum(1 for v in ser if v < 0) / n,
        "adjusted_eth_value__count_above__t_0": sum(1 for v in ser if v > 0) / n,
        "adjusted_eth_value__median":
            (ss[mid-1]+ss[mid])/2 if n%2==0 and len(ss)>=2 else (ss[mid] if ss else 0.0),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Model runners
# ─────────────────────────────────────────────────────────────────────────────
def _to_df(row: dict) -> pd.DataFrame:
    return pd.DataFrame([row]).replace([np.inf, -np.inf], np.nan).fillna(0)


def run_xgboost(row: dict) -> dict:
    if XGBOOST_MODEL is None:
        raise HTTPException(503, "XGBoost model not loaded. Check server logs.")
    prob = float(XGBOOST_MODEL.predict_proba(_to_df(row))[0][1])
    return {"prob": round(prob, 4), "model": "XGBoost", "weight": 0.5,
            "description": "Gradient boosted trees on 22 behavioural features (AUC 0.989)"}


def run_iforest(row: dict) -> dict:
    if IFOREST_MODEL is None:
        log.warning("IsolationForest not loaded — contributing 0 weight")
        return {"prob": 0.0, "model": "IsolationForest", "weight": 0.0, "unavailable": True,
                "description": "Not available — place address_data_combined_ts.csv next to backend"}
    X = _to_df(row)
    raw_score = float(IFOREST_MODEL.score_samples(X)[0])
    # Normalise: ~-0.5 = typical legit, ~-0.9 = strong anomaly → map to [0,1]
    prob = float(np.clip(1.0 - ((raw_score + 0.6) / 0.4), 0.0, 1.0))
    return {"prob": round(prob, 4), "model": "IsolationForest", "weight": 0.2,
            "description": "Anomaly detection trained on 6,110 legitimate wallets (AUC 0.629)"}


def run_sequential(row: dict) -> dict:
    if SEQ_MODEL is None:
        log.warning("Sequential model not loaded — contributing 0 weight")
        return {"prob": 0.0, "model": "Sequential (GBM)", "weight": 0.0, "unavailable": True,
                "description": "Not available — place address_data_combined_ts.csv next to backend"}
    X_base = _to_df(row)
    # Build sequence features using same pipeline as training
    X_seq = build_sequence_features(X_base)
    # Align to training columns
    train_cols = SEQ_MODEL["feature_names"]
    for c in train_cols:
        if c not in X_seq.columns:
            X_seq[c] = 0.0
    X_seq = X_seq[train_cols].replace([np.inf, -np.inf], np.nan).fillna(0)
    prob = float(SEQ_MODEL["model"].predict_proba(X_seq)[0][1])
    return {"prob": round(prob, 4), "model": "Sequential (GBM)", "weight": 0.3,
            "description": "GradientBoosting on drain ratio, TX intensity, speed & volatility (AUC 0.985)"}


def ensemble_vote(xgb: dict, iforest: dict, seq: dict) -> dict:
    models = [xgb, iforest, seq]
    total_w = sum(m["weight"] for m in models if not m.get("unavailable"))
    if total_w == 0: total_w = 1.0
    prob = round(sum(m["prob"] * m["weight"] for m in models if not m.get("unavailable")) / total_w, 4)
    conf = round(min(abs(prob - FRAUD_THRESHOLD) / max(FRAUD_THRESHOLD, 1 - FRAUD_THRESHOLD), 1.0), 4)
    risk = "CRITICAL" if prob >= 0.65 else "HIGH" if prob >= 0.4 else "MEDIUM" if prob >= 0.2 else "LOW"
    return {"is_fraud": prob >= FRAUD_THRESHOLD, "fraud_probability": prob,
            "confidence": conf, "risk_level": risk}


# ─────────────────────────────────────────────────────────────────────────────
# SHAP computation
# ─────────────────────────────────────────────────────────────────────────────
def compute_shap(row: dict) -> list:
    if SHAP_EXPLAINER is not None:
        try:
            import shap
            X = _to_df(row)
            sv = SHAP_EXPLAINER.shap_values(X)
            if isinstance(sv, list): sv = sv[1]
            sv_flat = sv[0] if len(np.array(sv).shape) > 1 else sv
            result = []
            for i, col in enumerate(X.columns):
                if i < len(sv_flat):
                    result.append({
                        "feature": FEATURE_LABELS.get(col, col), "full_name": col,
                        "shap_value": round(float(sv_flat[i]), 4),
                        "feature_value": round(float(X.iloc[0, i]), 4),
                    })
            result.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
            return result[:10]
        except Exception as e:
            log.warning(f"SHAP error: {e}")

    # Fallback: feature importance × deviation from legit baseline
    LEGIT_BASE = {
        "Avg min between sent tnx": 2000.0,
        "Time Diff between first and last (Mins)": 200000.0,
        "adjusted_eth_value__count_below__t_0": 0.08,
        "adjusted_eth_value__absolute_sum_of_changes": 10.0,
        "total transactions (including tnx to create contract": 80.0,
        "adjusted_eth_value__median": 0.8,
        "Unique Received From Addresses": 15.0,
        "adjusted_eth_value__mean_abs_change": 0.4,
        "total ether balance": 0.5,
        "adjusted_eth_value__ratio_value_number_to_time_series_length": 0.85,
    }
    result = []
    for col, base in LEGIT_BASE.items():
        val = row.get(col, 0.0)
        sv  = round(float((val - base) / (abs(base) + 1e-9) * 0.25), 4)
        result.append({"feature": FEATURE_LABELS.get(col, col), "full_name": col,
                        "shap_value": sv, "feature_value": round(float(val), 4)})
    result.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    return result[:10]


# ─────────────────────────────────────────────────────────────────────────────
# Network graph builder
# ─────────────────────────────────────────────────────────────────────────────
def build_graph(txs: list, address: str, risk_level: str) -> dict:
    addr = address.lower()
    def eth(v): return float(v) / 1e18

    em = {}
    for tx in txs:
        if tx.get("isError") == "1": continue
        f, t, v = tx.get("from","").lower(), tx.get("to","").lower(), eth(tx.get("value", 0))
        cp = t if f == addr else f
        if not cp or cp == addr: continue
        d  = "out" if f == addr else "in"
        if cp not in em: em[cp] = {"address": cp, "total_eth": 0.0, "tx_count": 0, "in": 0.0, "out": 0.0}
        em[cp]["total_eth"] += v; em[cp]["tx_count"] += 1; em[cp][d] += v

    peers = sorted(em.values(), key=lambda x: x["total_eth"], reverse=True)[:19]
    nodes = [{"id": addr, "label": addr[:6]+"..."+addr[-4:], "type": "target",
               "eth": round(sum(p["in"] for p in peers), 4), "tx_count": len(txs), "risk": risk_level}]
    edges = []
    for p in peers:
        pa  = p["address"]
        peer_risk = "MEDIUM" if risk_level in ("HIGH","CRITICAL") and p["total_eth"] > 1.0 else None
        nodes.append({"id": pa, "label": pa[:6]+"..."+pa[-4:], "type": "peer",
                       "eth": round(p["total_eth"], 4), "tx_count": p["tx_count"], "risk": peer_risk})
        src = addr if p["out"] >= p["in"] else pa
        tgt = pa   if p["out"] >= p["in"] else addr
        edges.append({"source": src, "target": tgt, "eth": round(p["total_eth"], 4),
                       "tx_count": p["tx_count"], "direction": "out" if p["out"] >= p["in"] else "in"})
    return {"nodes": nodes, "edges": edges, "center": addr}


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────
class InputFeatures(BaseModel):
    avg_min_between_sent_tnx:        float = Field(0.0, alias="Avg min between sent tnx")
    avg_min_between_received_tnx:    float = Field(0.0, alias="Avg min between received tnx")
    time_diff_first_last_mins:       float = Field(0.0, alias="Time Diff between first and last (Mins)")
    unique_received_from_addresses:  float = Field(0.0, alias="Unique Received From Addresses")
    min_value_received:              float = Field(0.0, alias="min value received")
    max_value_received:              float = Field(0.0, alias="max value received ")
    avg_val_received:                float = Field(0.0, alias="avg val received")
    min_val_sent:                    float = Field(0.0, alias="min val sent")
    avg_val_sent:                    float = Field(0.0, alias="avg val sent")
    total_transactions:              float = Field(0.0, alias="total transactions (including tnx to create contract")
    total_ether_received:            float = Field(0.0, alias="total ether received")
    total_ether_balance:             float = Field(0.0, alias="total ether balance")
    abs_sum_of_changes:              float = Field(0.0, alias="adjusted_eth_value__absolute_sum_of_changes")
    mean_abs_change:                 float = Field(0.0, alias="adjusted_eth_value__mean_abs_change")
    energy_ratio:                    float = Field(0.0, alias="adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0")
    sum_values:                      float = Field(0.0, alias="adjusted_eth_value__sum_values")
    abs_energy:                      float = Field(0.0, alias="adjusted_eth_value__abs_energy")
    ratio_value_number:              float = Field(0.0, alias="adjusted_eth_value__ratio_value_number_to_time_series_length")
    quantile_01:                     float = Field(0.0, alias="adjusted_eth_value__quantile__q_0.1")
    count_below_0:                   float = Field(0.0, alias="adjusted_eth_value__count_below__t_0")
    count_above_0:                   float = Field(0.0, alias="adjusted_eth_value__count_above__t_0")
    median:                          float = Field(0.0, alias="adjusted_eth_value__median")
    model_config = {"populate_by_name": True}


class PredictionResponse(BaseModel):
    is_fraud: bool; fraud_probability: float; confidence: float; risk_level: str

class ShapEntry(BaseModel):
    feature: str; full_name: str; shap_value: float; feature_value: float

class ModelScore(BaseModel):
    model: str; prob: float; weight: float
    unavailable: bool = False; description: str = ""

class NetworkNode(BaseModel):
    id: str; label: str; type: str; eth: float; tx_count: int; risk: Optional[str]

class NetworkEdge(BaseModel):
    source: str; target: str; eth: float; tx_count: int; direction: str

class NetworkGraph(BaseModel):
    nodes: List[NetworkNode]; edges: List[NetworkEdge]; center: str

class AddressAnalysisRequest(BaseModel):
    address: str

class AddressAnalysisResponse(BaseModel):
    is_fraud: bool; fraud_probability: float; confidence: float; risk_level: str
    transaction_count: int; features: dict; address: str
    shap_values: List[ShapEntry]; ensemble_scores: List[ModelScore]
    network_graph: NetworkGraph


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models": {
            "xgboost":              {"loaded": XGBOOST_MODEL is not None,  "auc": 0.989},
            "isolation_forest":     {"loaded": IFOREST_MODEL is not None,  "auc": 0.629,
                                     "note": "Anomaly detection on legit wallets"},
            "sequential_gbm":       {"loaded": SEQ_MODEL is not None,      "auc": 0.985,
                                     "note": "GradientBoosting on sequence features"},
            "shap":                 {"loaded": SHAP_EXPLAINER is not None},
        }
    }


@app.post("/api/predict", response_model=PredictionResponse)
def predict(f: InputFeatures):
    row = {
        "Avg min between sent tnx":            f.avg_min_between_sent_tnx,
        "Avg min between received tnx":        f.avg_min_between_received_tnx,
        "Time Diff between first and last (Mins)": f.time_diff_first_last_mins,
        "Unique Received From Addresses":      f.unique_received_from_addresses,
        "min value received":                  f.min_value_received,
        "max value received ":                 f.max_value_received,
        "avg val received":                    f.avg_val_received,
        "min val sent":                        f.min_val_sent,
        "avg val sent":                        f.avg_val_sent,
        "total transactions (including tnx to create contract": f.total_transactions,
        "total ether received":                f.total_ether_received,
        "total ether balance":                 f.total_ether_balance,
        "adjusted_eth_value__absolute_sum_of_changes":  f.abs_sum_of_changes,
        "adjusted_eth_value__mean_abs_change":           f.mean_abs_change,
        "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0": f.energy_ratio,
        "adjusted_eth_value__sum_values":      f.sum_values,
        "adjusted_eth_value__abs_energy":      f.abs_energy,
        "adjusted_eth_value__ratio_value_number_to_time_series_length": f.ratio_value_number,
        "adjusted_eth_value__quantile__q_0.1": f.quantile_01,
        "adjusted_eth_value__count_below__t_0": f.count_below_0,
        "adjusted_eth_value__count_above__t_0": f.count_above_0,
        "adjusted_eth_value__median":          f.median,
    }
    return ensemble_vote(run_xgboost(row), run_iforest(row), run_sequential(row))


@app.post("/api/analyze-address", response_model=AddressAnalysisResponse)
async def analyze_address(req: AddressAnalysisRequest):
    address = req.address.strip()
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(400, "Invalid Ethereum address format")

    url = (f"{ETHERSCAN_BASE}?chainid=1&module=account&action=txlist"
           f"&address={address}&startblock=0&endblock=99999999"
           f"&sort=asc&apikey={ETHERSCAN_API_KEY}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(url); r.raise_for_status(); data = r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Etherscan HTTP {e.response.status_code}")
    except Exception as e:
        raise HTTPException(502, f"Etherscan error: {e}")

    if data.get("status") != "1" and data.get("message") not in ("No transactions found","No records found"):
        raise HTTPException(502, str(data.get("result") or data.get("message") or "Etherscan error"))

    txs = data.get("result") or []
    if not txs:
        empty_graph = NetworkGraph(nodes=[], edges=[], center=address)
        return AddressAnalysisResponse(
            is_fraud=False, fraud_probability=0.0, confidence=1.0, risk_level="LOW",
            transaction_count=0, features={}, address=address,
            shap_values=[], ensemble_scores=[], network_graph=empty_graph)

    feats      = compute_features_from_txs(txs, address)
    xgb_r      = run_xgboost(feats)
    iforest_r  = run_iforest(feats)
    seq_r      = run_sequential(feats)
    prediction = ensemble_vote(xgb_r, iforest_r, seq_r)
    shaps      = compute_shap(feats)
    graph_raw  = build_graph(txs, address, prediction["risk_level"])

    graph = NetworkGraph(
        nodes=[NetworkNode(**n) for n in graph_raw["nodes"]],
        edges=[NetworkEdge(**e) for e in graph_raw["edges"]],
        center=graph_raw["center"],
    )
    scores = [
        ModelScore(model=m["model"], prob=m["prob"], weight=m["weight"],
                   unavailable=m.get("unavailable", False), description=m.get("description",""))
        for m in [xgb_r, iforest_r, seq_r]
    ]
    return AddressAnalysisResponse(
        **prediction, transaction_count=len(txs), features=feats, address=address,
        shap_values=[ShapEntry(**s) for s in shaps],
        ensemble_scores=scores, network_graph=graph,
    )
