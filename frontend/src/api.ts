<<<<<<< HEAD
import type { PredictionRequest, PredictionResponse, AddressAnalysisResponse } from './types'
const BASE_URL = import.meta.env.VITE_API_URL ?? ''
function toPayload(r: PredictionRequest): Record<string,number> {
  return {
    'Avg min between sent tnx':r.avg_min_between_sent_tnx,
    'Avg min between received tnx':r.avg_min_between_received_tnx,
    'Time Diff between first and last (Mins)':r.time_diff_first_last_mins,
    'Unique Received From Addresses':r.unique_received_from_addresses,
    'min value received':r.min_value_received,'max value received ':r.max_value_received,
    'avg val received':r.avg_val_received,'min val sent':r.min_val_sent,'avg val sent':r.avg_val_sent,
    'total transactions (including tnx to create contract':r.total_transactions,
    'total ether received':r.total_ether_received,'total ether balance':r.total_ether_balance,
    'adjusted_eth_value__absolute_sum_of_changes':r.abs_sum_of_changes,
    'adjusted_eth_value__mean_abs_change':r.mean_abs_change,
    'adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0':r.energy_ratio,
    'adjusted_eth_value__sum_values':r.sum_values,'adjusted_eth_value__abs_energy':r.abs_energy,
    'adjusted_eth_value__ratio_value_number_to_time_series_length':r.ratio_value_number,
    'adjusted_eth_value__quantile__q_0.1':r.quantile_01,
    'adjusted_eth_value__count_below__t_0':r.count_below_0,
    'adjusted_eth_value__count_above__t_0':r.count_above_0,'adjusted_eth_value__median':r.median,
  }
}
async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  if(!res.ok){const e=await res.json().catch(()=>({detail:'Unknown error'}));throw new Error(e.detail??`HTTP ${res.status}`)}
  return res.json()
}
export const predict = (r:PredictionRequest) => call<PredictionResponse>('/api/predict',toPayload(r))
export const analyzeAddress = (address:string) => call<AddressAnalysisResponse>('/api/analyze-address',{address})
export const healthCheck = () => fetch(`${BASE_URL}/api/health`).then(r=>r.json())
=======
import type { PredictionRequest, PredictionResponse } from './types'

// BASE URL: Isme end mein trailing slash ya /predict mat lagaiye
const BASE_URL = "https://eth-fraud-detection.onrender.com";

// Maps our clean frontend keys → the exact backend aliases
function toBackendPayload(req: PredictionRequest): Record<string, number> {
  return {
    'Avg min between sent tnx': req.avg_min_between_sent_tnx,
    'Avg min between received tnx': req.avg_min_between_received_tnx,
    'Time Diff between first and last (Mins)': req.time_diff_first_last_mins,
    'Unique Received From Addresses': req.unique_received_from_addresses,
    'min value received': req.min_value_received,
    'max value received ': req.max_value_received,   // trailing space!
    'avg val received': req.avg_val_received,
    'min val sent': req.min_val_sent,
    'avg val sent': req.avg_val_sent,
    'total transactions (including tnx to create contract': req.total_transactions,
    'total ether received': req.total_ether_received,
    'total ether balance': req.total_ether_balance,
    'adjusted_eth_value__absolute_sum_of_changes': req.abs_sum_of_changes,
    'adjusted_eth_value__mean_abs_change': req.mean_abs_change,
    'adjusted_eth_value__energy_ratio_by_chunks__num_segments_10__segment_focus_0': req.energy_ratio,
    'adjusted_eth_value__sum_values': req.sum_values,
    'adjusted_eth_value__abs_energy': req.abs_energy,
    'adjusted_eth_value__ratio_value_number_to_time_series_length': req.ratio_value_number,
    'adjusted_eth_value__quantile__q_0.1': req.quantile_01,
    'adjusted_eth_value__count_below__t_0': req.count_below_0,
    'adjusted_eth_value__count_above__t_0': req.count_above_0,
    'adjusted_eth_value__median': req.median,
  }
}

export async function predict(request: PredictionRequest): Promise<PredictionResponse> {
  const payload = toBackendPayload(request)

  // Yahan ab sahi path banega: https://eth-fraud-detection.onrender.com/api/predict
  const res = await fetch(`${BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<PredictionResponse>
}

export async function healthCheck(): Promise<{ status: string; model_loaded: boolean }> {
  // Yahan path banega: https://eth-fraud-detection.onrender.com/api/health
  const res = await fetch(`${BASE_URL}/api/health`)
  return res.json()
}
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
