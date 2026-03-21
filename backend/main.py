"""
Ethereum Fraud Sentinel — FastAPI Backend
==========================================
Loads xgboost_fraud_ts.pkl (or auto-trains from CSV if pkl not found).
POST /api/predict  →  {"is_fraud": bool, "fraud_probability": float, "confidence": float}
GET  /api/health   →  {"status": "ok", "model_loaded": bool}
"""

import os
import pickle
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fraud-sentinel")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Ethereum Fraud Sentinel API",
    description="XGBoost-powered Ethereum address fraud detection",
    version="1.0.0",
)

# ── CORS Configuration (Updated for Production) ──────────────────────────────
origins = [
    "https://ethereum-fraud-sentinel.netlify.app", # Aapka Netlify link
    "https://eth-fraud-backend.onrender.com",      # Aapka Render link
    "http://localhost:5173",                       # Local development (Vite)
    "http://localhost:8000",                       # Local development (FastAPI)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Ab ye sirf list waale URLs allow karega
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exact 22 feature names (order matters — must match training) ──────────────
FEATURE_NAMES = [
    "Avg min between sent tnx",
    "Avg min between received tnx",
    "Time Diff between first and last (Mins)",
    "Unique Received From Addresses",
    "min value received",
    "max value received ",          # NOTE: trailing space — matches dataset column
    "avg val received",
    "min val sent",
    "avg val sent",
    "total transactions (including tnx to create contract",
    "total ether received",
    "total ether balance",
    "adjusted_eth_value__absolute_sum_of_changes",
    "adjusted_eth_value__mean_abs_change",
    "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0",
    "adjusted_eth_value__sum_values",
    "adjusted_eth_value__abs_energy",
    "adjusted_eth_value__ratio_value_number_to_time_series_length",
    "adjusted_eth_value__quantile__q_0.1",
    "adjusted_eth_value__count_below__t_0",
    "adjusted_eth_value__count_above__t_0",
    "adjusted_eth_value__median",
]

FRAUD_THRESHOLD = 0.3   # matches notebook best threshold

# ── Global model handle ───────────────────────────────────────────────────────
MODEL = None


def load_or_train_model():
    """Load pkl if present, otherwise train from CSV and save pkl."""
    global MODEL

    # Search paths: same dir as main.py, parent dir, cwd
    search_dirs = [
        Path(__file__).parent,
        Path(__file__).parent.parent,
        Path.cwd(),
    ]
    pkl_path: Optional[Path] = None
    for d in search_dirs:
        candidate = d / "xgboost_fraud_ts.pkl"
        if candidate.exists():
            pkl_path = candidate
            break

    if pkl_path:
        log.info(f"Loading model from {pkl_path}")
        with open(pkl_path, "rb") as f:
            MODEL = pickle.load(f)
        log.info("Model loaded ✓")
        return

    # ── Auto-train fallback ───────────────────────────────────────────────────
    csv_path: Optional[Path] = None
    for d in search_dirs:
        candidate = d / "address_data_combined_ts.csv"
        if candidate.exists():
            csv_path = candidate
            break

    if csv_path is None:
        log.warning("Neither pkl nor CSV found — model will be None until you place the files.")
        return

    log.info(f"pkl not found — auto-training from {csv_path}")
    from sklearn.model_selection import train_test_split
    from xgboost import XGBClassifier

    df = pd.read_csv(csv_path)
    TARGET = "FLAG"
    X = df.drop(columns=[TARGET]).select_dtypes(include=["number"])
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    y = df[TARGET]

    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    neg, pos = np.bincount(y_train)

    MODEL = XGBClassifier(
        n_estimators=500, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        objective="binary:logistic", eval_metric="auc",
        scale_pos_weight=neg / pos, random_state=42, n_jobs=-1,
    )
    MODEL.fit(X_train, y_train)

    # Save for next run
    save_path = Path(__file__).parent.parent / "xgboost_fraud_ts.pkl"
    with open(save_path, "wb") as f:
        pickle.dump(MODEL, f)
    log.info(f"Model trained and saved to {save_path} ✓")


@app.on_event("startup")
async def startup_event():
    load_or_train_model()


# ── Pydantic input schema ─────────────────────────────────────────────────────
# Field aliases map clean Python names → exact column names with spaces/parens

class InputFeatures(BaseModel):
    avg_min_between_sent_tnx: float = Field(0.0, alias="Avg min between sent tnx")
    avg_min_between_received_tnx: float = Field(0.0, alias="Avg min between received tnx")
    time_diff_first_last_mins: float = Field(0.0, alias="Time Diff between first and last (Mins)")
    unique_received_from_addresses: float = Field(0.0, alias="Unique Received From Addresses")
    min_value_received: float = Field(0.0, alias="min value received")
    max_value_received: float = Field(0.0, alias="max value received ")   # trailing space
    avg_val_received: float = Field(0.0, alias="avg val received")
    min_val_sent: float = Field(0.0, alias="min val sent")
    avg_val_sent: float = Field(0.0, alias="avg val sent")
    total_transactions: float = Field(0.0, alias="total transactions (including tnx to create contract")
    total_ether_received: float = Field(0.0, alias="total ether received")
    total_ether_balance: float = Field(0.0, alias="total ether balance")
    abs_sum_of_changes: float = Field(0.0, alias="adjusted_eth_value__absolute_sum_of_changes")
    mean_abs_change: float = Field(0.0, alias="adjusted_eth_value__mean_abs_change")
    energy_ratio: float = Field(0.0, alias="adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0")
    sum_values: float = Field(0.0, alias="adjusted_eth_value__sum_values")
    abs_energy: float = Field(0.0, alias="adjusted_eth_value__abs_energy")
    ratio_value_number: float = Field(0.0, alias="adjusted_eth_value__ratio_value_number_to_time_series_length")
    quantile_01: float = Field(0.0, alias="adjusted_eth_value__quantile__q_0.1")
    count_below_0: float = Field(0.0, alias="adjusted_eth_value__count_below__t_0")
    count_above_0: float = Field(0.0, alias="adjusted_eth_value__count_above__t_0")
    median: float = Field(0.0, alias="adjusted_eth_value__median")

    model_config = {"populate_by_name": True}


class PredictionResponse(BaseModel):
    is_fraud: bool
    fraud_probability: float
    confidence: float
    risk_level: str   # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


@app.post("/api/predict", response_model=PredictionResponse)
def predict(features: InputFeatures):
    if MODEL is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Place xgboost_fraud_ts.pkl or address_data_combined_ts.csv next to the backend."
        )

    # Build DataFrame with EXACT column names matching training
    row = {
        "Avg min between sent tnx": features.avg_min_between_sent_tnx,
        "Avg min between received tnx": features.avg_min_between_received_tnx,
        "Time Diff between first and last (Mins)": features.time_diff_first_last_mins,
        "Unique Received From Addresses": features.unique_received_from_addresses,
        "min value received": features.min_value_received,
        "max value received ": features.max_value_received,        # trailing space
        "avg val received": features.avg_val_received,
        "min val sent": features.min_val_sent,
        "avg val sent": features.avg_val_sent,
        "total transactions (including tnx to create contract": features.total_transactions,
        "total ether received": features.total_ether_received,
        "total ether balance": features.total_ether_balance,
        "adjusted_eth_value__absolute_sum_of_changes": features.abs_sum_of_changes,
        "adjusted_eth_value__mean_abs_change": features.mean_abs_change,
        "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0": features.energy_ratio,
        "adjusted_eth_value__sum_values": features.sum_values,
        "adjusted_eth_value__abs_energy": features.abs_energy,
        "adjusted_eth_value__ratio_value_number_to_time_series_length": features.ratio_value_number,
        "adjusted_eth_value__quantile__q_0.1": features.quantile_01,
        "adjusted_eth_value__count_below__t_0": features.count_below_0,
        "adjusted_eth_value__count_above__t_0": features.count_above_0,
        "adjusted_eth_value__median": features.median,
    }

    X = pd.DataFrame([row])
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

    prob = float(MODEL.predict_proba(X)[0][1])
    is_fraud = prob >= FRAUD_THRESHOLD

    # Confidence: how far from threshold (0.5 = right on edge → 0%, 1.0 or 0.0 = 100%)
    confidence = abs(prob - FRAUD_THRESHOLD) / max(FRAUD_THRESHOLD, 1 - FRAUD_THRESHOLD)
    confidence = round(min(confidence, 1.0), 4)

    # Risk level
    if prob < 0.2:
        risk_level = "LOW"
    elif prob < 0.4:
        risk_level = "MEDIUM"
    elif prob < 0.65:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    return PredictionResponse(
        is_fraud=is_fraud,
        fraud_probability=round(prob, 4),
        confidence=confidence,
        risk_level=risk_level,
    )