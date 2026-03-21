import type { PredictionRequest, PredictionResponse } from './types'

const BASE = "https://eth-fraud-backend.onrender.com";

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

  const res = await fetch(`${BASE}/predict`, {
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
  const res = await fetch(`${BASE}/health`)
  return res.json()
}
