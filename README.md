# Ethereum Fraud Sentinel 🛡️

<<<<<<< HEAD
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
=======
> XGBoost-powered Ethereum address fraud detection dashboard  
> 94.7% accuracy · ROC-AUC 0.989 · 22 behavioral features
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651

---

## Project Structure

```
<<<<<<< HEAD
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
=======
ethereum-fraud-detector/
├── backend/
│   ├── main.py           # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── FeatureForm.tsx
│   │       ├── RiskRing.tsx
│   │       ├── ResultCard.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ParticleBackground.tsx
│   ├── package.json
│   └── vite.config.ts
├── xgboost_fraud_ts.pkl  ← place your trained model here
├── address_data_combined_ts.csv  ← (optional fallback for auto-training)
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
└── README.md
```

---

## Quick Start

<<<<<<< HEAD
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
=======
### 1. Place your model file

Copy `xgboost_fraud_ts.pkl` into the project root:
```
ethereum-fraud-detector/xgboost_fraud_ts.pkl
```

If the `.pkl` is missing, the backend will **auto-train** from `address_data_combined_ts.csv`  
(also placed in the project root). This takes ~30 seconds.

---

### 2. Start the Backend

```bash
cd ethereum-fraud-detector/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

Test with curl:
```bash
# Health check
curl http://localhost:8000/api/health

# Quick prediction test (should return HIGH/CRITICAL risk)
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Avg min between sent tnx": 870.12,
    "Avg min between received tnx": 190.91,
    "Time Diff between first and last (Mins)": 10224.47,
    "Unique Received From Addresses": 36,
    "min value received": 0.0,
    "max value received ": 1.7,
    "avg val received": 0.28,
    "min val sent": 13.4,
    "avg val sent": 18.9,
    "total transactions (including tnx to create contract": 250,
    "total ether received": 14.06,
    "total ether balance": 0.33,
    "adjusted_eth_value__absolute_sum_of_changes": 37.72,
    "adjusted_eth_value__mean_abs_change": 0.77,
    "adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0": 0.0017,
    "adjusted_eth_value__sum_values": 0.33,
    "adjusted_eth_value__abs_energy": 188.25,
    "adjusted_eth_value__ratio_value_number_to_time_series_length": 0.16,
    "adjusted_eth_value__quantile__q_0.1": 0.17,
    "adjusted_eth_value__count_below__t_0": 0.04,
    "adjusted_eth_value__count_above__t_0": 0.98,
    "adjusted_eth_value__median": 0.17
  }'
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
```

---

<<<<<<< HEAD
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
=======
### 3. Start the Frontend

```bash
cd ethereum-fraud-detector/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

The Vite dev server proxies `/api/*` to `http://localhost:8000` automatically.

---

## API Reference

### `GET /api/health`
```json
{ "status": "ok", "model_loaded": true }
```

### `POST /api/predict`
**Request body**: JSON object with all 22 feature fields (see `backend/main.py` for aliases)

**Response**:
```json
{
  "is_fraud": true,
  "fraud_probability": 0.8234,
  "confidence": 0.762,
  "risk_level": "CRITICAL"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `is_fraud` | bool | True if `fraud_probability >= 0.30` |
| `fraud_probability` | float | Raw model probability [0–1] |
| `confidence` | float | Distance from threshold, scaled [0–1] |
| `risk_level` | string | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |

---

## Model Details

| Property | Value |
|----------|-------|
| Algorithm | XGBoost (binary:logistic) |
| Training samples | 13,920 |
| Features | 22 behavioral + time-series |
| Accuracy | 94.75% |
| ROC-AUC | 0.9894 |
| Threshold | 0.30 (optimized for recall) |
| Class balance | 45% fraud / 55% normal |

---

## Troubleshooting

**"Model not loaded" error**  
→ Ensure `xgboost_fraud_ts.pkl` is in the project root (one level above `backend/`)

**CORS errors in browser**  
→ Ensure backend is running on port 8000 and Vite proxy is configured (it is by default)

**Frontend can't connect**  
→ Check that `vite.config.ts` proxy target matches your backend port
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
