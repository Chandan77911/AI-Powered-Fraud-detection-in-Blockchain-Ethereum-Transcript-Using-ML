// ── API types ──────────────────────────────────────────────────────────────

export interface PredictionRequest {
  avg_min_between_sent_tnx: number
  avg_min_between_received_tnx: number
  time_diff_first_last_mins: number
  unique_received_from_addresses: number
  min_value_received: number
  max_value_received: number
  avg_val_received: number
  min_val_sent: number
  avg_val_sent: number
  total_transactions: number
  total_ether_received: number
  total_ether_balance: number
  abs_sum_of_changes: number
  mean_abs_change: number
  energy_ratio: number
  sum_values: number
  abs_energy: number
  ratio_value_number: number
  quantile_01: number
  count_below_0: number
  count_above_0: number
  median: number
}

export interface PredictionResponse {
  is_fraud: boolean
  fraud_probability: number
  confidence: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ── UI types ───────────────────────────────────────────────────────────────

export type AppState = 'idle' | 'loading' | 'result' | 'error'

export interface FeatureField {
  key: keyof PredictionRequest
  label: string
  description: string
  min: number
  max: number
  step: number
  unit?: string
  group: 'timing' | 'value' | 'timeseries'
}

// ── Example address data ───────────────────────────────────────────────────

export const FRAUD_EXAMPLE: PredictionRequest = {
  avg_min_between_sent_tnx: 870.12,
  avg_min_between_received_tnx: 190.91,
  time_diff_first_last_mins: 10224.47,
  unique_received_from_addresses: 36,
  min_value_received: 0.0,
  max_value_received: 1.7,
  avg_val_received: 0.28,
  min_val_sent: 13.4,
  avg_val_sent: 18.9,
  total_transactions: 250,
  total_ether_received: 14.06,
  total_ether_balance: 0.33,
  abs_sum_of_changes: 37.72,
  mean_abs_change: 0.77,
  energy_ratio: 0.0017,
  sum_values: 0.33,
  abs_energy: 188.25,
  ratio_value_number: 0.16,
  quantile_01: 0.17,
  count_below_0: 0.04,
  count_above_0: 0.98,
  median: 0.17,
}

export const SAFE_EXAMPLE: PredictionRequest = {
  // Real legitimate address (FLAG=0) from training data — Row 4115
  avg_min_between_sent_tnx: 3716.41,
  avg_min_between_received_tnx: 1448.09,
  time_diff_first_last_mins: 385961.98,
  unique_received_from_addresses: 4,
  min_value_received: 0.118061,
  max_value_received: 81.386,
  avg_val_received: 3.381313,
  min_val_sent: 0.01,
  avg_val_sent: 103.974875,
  total_transactions: 254,
  total_ether_received: 831.803,
  total_ether_balance: 0.004048,
  abs_sum_of_changes: 1775.083,
  mean_abs_change: 7.016138,
  energy_ratio: 0.013685,
  sum_values: 0.004048,
  abs_energy: 208951.21,
  ratio_value_number: 0.992126,
  quantile_01: 0.580175,
  count_below_0: 0.031496,
  count_above_0: 0.968504,
  median: 1.187981,
}

// ── Feature field definitions ──────────────────────────────────────────────

export const FEATURE_FIELDS: FeatureField[] = [
  // TIMING GROUP
  {
    key: 'avg_min_between_sent_tnx',
    label: 'Avg Min Between Sent Txns',
    description: 'Average minutes between outgoing transactions',
    min: 0, max: 50000, step: 1, unit: 'min',
    group: 'timing',
  },
  {
    key: 'avg_min_between_received_tnx',
    label: 'Avg Min Between Received Txns',
    description: 'Average minutes between incoming transactions',
    min: 0, max: 50000, step: 1, unit: 'min',
    group: 'timing',
  },
  {
    key: 'time_diff_first_last_mins',
    label: 'Time Diff First → Last',
    description: 'Total active lifespan in minutes',
    min: 0, max: 500000, step: 10, unit: 'min',
    group: 'timing',
  },
  {
    key: 'unique_received_from_addresses',
    label: 'Unique Sender Addresses',
    description: 'Number of distinct addresses that sent ETH',
    min: 0, max: 1000, step: 1,
    group: 'timing',
  },
  // VALUE GROUP
  {
    key: 'min_value_received',
    label: 'Min Value Received',
    description: 'Smallest incoming transaction value',
    min: 0, max: 100, step: 0.001, unit: 'ETH',
    group: 'value',
  },
  {
    key: 'max_value_received',
    label: 'Max Value Received',
    description: 'Largest incoming transaction value',
    min: 0, max: 10000, step: 0.01, unit: 'ETH',
    group: 'value',
  },
  {
    key: 'avg_val_received',
    label: 'Avg Value Received',
    description: 'Mean incoming transaction value',
    min: 0, max: 1000, step: 0.001, unit: 'ETH',
    group: 'value',
  },
  {
    key: 'min_val_sent',
    label: 'Min Value Sent',
    description: 'Smallest outgoing transaction value',
    min: 0, max: 100, step: 0.001, unit: 'ETH',
    group: 'value',
  },
  {
    key: 'avg_val_sent',
    label: 'Avg Value Sent',
    description: 'Mean outgoing transaction value',
    min: 0, max: 1000, step: 0.001, unit: 'ETH',
    group: 'value',
  },
  {
    key: 'total_transactions',
    label: 'Total Transactions',
    description: 'Including contract creation transactions',
    min: 0, max: 20000, step: 1,
    group: 'value',
  },
  {
    key: 'total_ether_received',
    label: 'Total Ether Received',
    description: 'Cumulative ETH received',
    min: 0, max: 100000, step: 0.01, unit: 'ETH',
    group: 'value',
  },
  {
    key: 'total_ether_balance',
    label: 'Total Ether Balance',
    description: 'Current ETH balance',
    min: -1000, max: 100000, step: 0.01, unit: 'ETH',
    group: 'value',
  },
  // TIMESERIES GROUP
  {
    key: 'abs_sum_of_changes',
    label: 'Absolute Sum of Changes',
    description: 'Total absolute ETH value fluctuation',
    min: 0, max: 500000, step: 0.01,
    group: 'timeseries',
  },
  {
    key: 'mean_abs_change',
    label: 'Mean Abs Change',
    description: 'Average absolute change per step',
    min: 0, max: 1000, step: 0.001,
    group: 'timeseries',
  },
  {
    key: 'energy_ratio',
    label: 'Energy Ratio (Segment 0)',
    description: 'Energy ratio of first time-series chunk',
    min: 0, max: 1, step: 0.0001,
    group: 'timeseries',
  },
  {
    key: 'sum_values',
    label: 'Sum Values',
    description: 'Sum of adjusted ETH time-series values',
    min: -10000, max: 50000, step: 0.01,
    group: 'timeseries',
  },
  {
    key: 'abs_energy',
    label: 'Absolute Energy',
    description: 'Sum of squared adjusted values',
    min: 0, max: 1000000, step: 0.01,
    group: 'timeseries',
  },
  {
    key: 'ratio_value_number',
    label: 'Value/Length Ratio',
    description: 'Ratio of value count to series length',
    min: 0, max: 1, step: 0.001,
    group: 'timeseries',
  },
  {
    key: 'quantile_01',
    label: 'Quantile (10th)',
    description: '10th percentile of adjusted ETH series',
    min: -1000, max: 1000, step: 0.001,
    group: 'timeseries',
  },
  {
    key: 'count_below_0',
    label: 'Count Below Zero',
    description: 'Proportion of values below zero',
    min: 0, max: 1, step: 0.001,
    group: 'timeseries',
  },
  {
    key: 'count_above_0',
    label: 'Count Above Zero',
    description: 'Proportion of values above zero',
    min: 0, max: 1, step: 0.001,
    group: 'timeseries',
  },
  {
    key: 'median',
    label: 'Median Value',
    description: 'Median of adjusted ETH time-series',
    min: -1000, max: 10000, step: 0.001, unit: 'ETH',
    group: 'timeseries',
  },
]
