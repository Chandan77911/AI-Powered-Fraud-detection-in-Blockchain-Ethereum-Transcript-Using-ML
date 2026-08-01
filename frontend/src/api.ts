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
