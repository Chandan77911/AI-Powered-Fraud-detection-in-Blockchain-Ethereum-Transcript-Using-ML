# Ethereum Fraud Sentinel 🛡️

> XGBoost + Ensemble + SHAP + Network Graph — Ethereum fraud detection
> Phase 2: Explainable AI, multi-model consensus, wallet network visualisation

---

## What's New in Phase 2

### 🧠 Explainable AI (SHAP)
- Every prediction now shows a **SHAP waterfall chart** — exactly which features caused the verdict and by how much
- Red bars = pushed toward FRAUD, green bars = pushed toward SAFE
- Uses `TreeExplainer` with background dataset for accurate Shapley values

### 🗳️ Ensemble of 3 Models
| Model | Strength | Weight |
|---|---|---|
| XGBoost | Behavioural tabular features | 60% |
| IsolationForest | Anomaly detection (trained on legit wallets) | 20% |
| LSTM (sequential heuristic) | Temporal drain/burst patterns | 20% |

Final verdict = weighted vote. Much harder to fool than a single model.

### 🕸️ Wallet Network Graph
- Force-directed D3-style graph shows all counterparty wallets
- Node size = ETH volume traded. Edge colour = direction (red=out, green=in)
- Risk propagation: high-value peers of a flagged wallet get MEDIUM risk

---

## Project Structure

```
ethereum-fraud-sentinel/
├── backend/
│   ├── main.py              # FastAPI v3 — ensemble + SHAP + network graph
│   └── requirements.txt     # + shap, networkx
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── types.ts
│       └── components/
│           ├── ResultCard.tsx        # Updated: shows all Phase 2 panels
│           ├── ShapWaterfall.tsx     # NEW: SHAP canvas chart
│           ├── EnsembleVote.tsx      # NEW: 3-model vote display
│           ├── NetworkGraph.tsx      # NEW: force-directed wallet graph
│           ├── RiskGauge3D.tsx
│           ├── CyberOrb.tsx
│           ├── MempoolStream.tsx
│           └── ...
├── xgboost_fraud_ts.pkl
└── README.md
```

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

First startup trains IsolationForest from CSV (~10s) and builds SHAP explainer (~5s).

### Frontend
```bash
cd frontend
npm install && npm run dev
```

---

## API (v3)

### `GET /api/health`
```json
{
  "status": "ok",
  "models": {
    "xgboost": true,
    "isolation_forest": true,
    "shap": true,
    "lstm_heuristic": true
  }
}
```

### `POST /api/analyze-address`
Response now includes:
```json
{
  "fraud_probability": 0.82,
  "risk_level": "CRITICAL",
  "ensemble_scores": [
    {"model": "XGBoost", "prob": 0.87, "weight": 0.6},
    {"model": "IsolationForest", "prob": 0.71, "weight": 0.2},
    {"model": "LSTM (sequential)", "prob": 0.64, "weight": 0.2}
  ],
  "shap_values": [
    {"feature": "avg_sent_gap", "shap_value": 0.42, "feature_value": 0.5},
    {"feature": "count_below_0", "shap_value": 0.38, "feature_value": 0.9}
  ],
  "network_graph": {
    "nodes": [...],
    "edges": [...],
    "center": "0xbb6e..."
  }
}
```
