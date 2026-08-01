import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RotateCcw, AlertCircle, Cpu, Wallet, SlidersHorizontal } from 'lucide-react'

import Header from './components/Header'
import AddressInput from './components/AddressInput'
import FeatureForm from './components/FeatureForm'
import ResultCard from './components/ResultCard'
import LoadingSpinner from './components/LoadingSpinner'
import MempoolStream from './components/MempoolStream'

import { predict, analyzeAddress } from './api'
import type {
  PredictionRequest, PredictionResponse, AddressAnalysisResponse,
  AppState, InputMode,
} from './types'
import { FRAUD_EXAMPLE, SAFE_EXAMPLE } from './types'

// Union type so result can hold either basic response or full Phase-2 response
type AnyResult = PredictionResponse | AddressAnalysisResponse

const BLANK: PredictionRequest = {
  avg_min_between_sent_tnx: 0, avg_min_between_received_tnx: 0,
  time_diff_first_last_mins: 0, unique_received_from_addresses: 0,
  min_value_received: 0, max_value_received: 0, avg_val_received: 0,
  min_val_sent: 0, avg_val_sent: 0, total_transactions: 0,
  total_ether_received: 0, total_ether_balance: 0,
  abs_sum_of_changes: 0, mean_abs_change: 0, energy_ratio: 0,
  sum_values: 0, abs_energy: 0, ratio_value_number: 0,
  quantile_01: 0, count_below_0: 0, count_above_0: 0, median: 0,
}

export default function App() {
  const [appState, setAppState]   = useState<AppState>('idle')
  const [inputMode, setInputMode] = useState<InputMode>('address')
  const [values, setValues]       = useState<PredictionRequest>(BLANK)
  const [result, setResult]       = useState<AnyResult | null>(null)
  const [txCount, setTxCount]     = useState<number | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')

  const handleChange = useCallback((key: keyof PredictionRequest, value: number) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleAddressScan = async (address: string) => {
    setAppState('loading')
    setErrorMsg('')
    try {
      const res: AddressAnalysisResponse = await analyzeAddress(address)
      setResult(res)
      setTxCount(res.transaction_count)
      setAppState('result')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to backend')
      setAppState('error')
    }
  }

  const handleManualSubmit = async () => {
    setAppState('loading')
    setErrorMsg('')
    try {
      const res: PredictionResponse = await predict(values)
      setResult(res)
      setTxCount(null)
      setAppState('result')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to backend')
      setAppState('error')
    }
  }

  const handleReset = () => {
    setAppState('idle')
    setResult(null)
    setErrorMsg('')
    setTxCount(null)
  }

  return (
    <div className="relative min-h-screen eth-radial-bg eth-grid-bg"
      style={{ fontFamily: 'Inter, sans-serif', background: '#080810' }}>
      <MempoolStream />
      <div className="relative flex min-h-screen flex-col" style={{ zIndex: 10 }}>
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <AnimatePresence mode="wait">

            {(appState === 'idle' || appState === 'error') && (
              <motion.div key="form"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
                className="space-y-5">

                <div className="text-center space-y-2 pb-2">
                  <motion.div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                    style={{ background: 'rgba(98,126,234,0.08)', border: '1px solid rgba(98,126,234,0.2)' }}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}>
                    <Cpu size={11} style={{ color: '#627EEA' }} />
                    <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: '#8B9FEF' }}>
                      XGBOOST + ENSEMBLE · 13,920 SAMPLES · ROC-AUC 0.989
                    </span>
                  </motion.div>
                  <motion.h2 className="shimmer-text"
                    style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28 }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}>
                    Analyze Ethereum Address
                  </motion.h2>
                  <motion.p className="font-mono" style={{ fontSize: 12, color: '#64748B' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    {inputMode === 'address'
                      ? 'Paste a wallet address — auto-fetch · ensemble · SHAP · network graph'
                      : 'Input 22 behavioral features to detect on-chain fraud patterns'}
                  </motion.p>
                </div>

                {/* Mode toggle */}
                <motion.div className="flex justify-center gap-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  {(['address', 'manual'] as InputMode[]).map(mode => (
                    <button key={mode} onClick={() => setInputMode(mode)}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 font-mono transition-all"
                      style={{
                        fontSize: 11, letterSpacing: '0.08em',
                        color: inputMode === mode ? '#8B9FEF' : '#374151',
                        background: inputMode === mode ? 'rgba(98,126,234,0.1)' : 'transparent',
                        border: `1px solid ${inputMode === mode ? 'rgba(98,126,234,0.35)' : 'rgba(37,37,56,0.6)'}`,
                      }}>
                      {mode === 'address' ? <><Wallet size={12} /> WALLET ADDRESS</> : <><SlidersHorizontal size={12} /> MANUAL INPUT</>}
                    </button>
                  ))}
                </motion.div>

                {appState === 'error' && (
                  <motion.div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.25)' }}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <AlertCircle size={14} style={{ color: '#FF6B6B', flexShrink: 0 }} />
                    <div>
                      <p className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: '#FF6B6B' }}>
                        {inputMode === 'address' ? 'FETCH ERROR' : 'CONNECTION ERROR'}
                      </p>
                      <p className="font-mono" style={{ fontSize: 10, color: '#64748B' }}>{errorMsg}</p>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {inputMode === 'address' && (
                    <motion.div key="addr"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                      <AddressInput
                        onAnalyze={handleAddressScan}
                        onSwitchToManual={() => setInputMode('manual')}
                        isLoading={false}
                        errorMsg={undefined}
                      />
                    </motion.div>
                  )}
                  {inputMode === 'manual' && (
                    <motion.div key="manual"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                      className="space-y-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="font-mono" style={{ fontSize: 10, color: '#374151', letterSpacing: '0.1em' }}>QUICK FILL:</span>
                        <button onClick={() => setValues(FRAUD_EXAMPLE)}
                          className="rounded-lg px-3 py-1.5 font-mono transition-all"
                          style={{ fontSize: 11, color: '#FF6B6B', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.25)' }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,107,107,0.12)' }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,107,107,0.06)' }}>
                          ⚠ High-Risk Example
                        </button>
                        <button onClick={() => setValues(SAFE_EXAMPLE)}
                          className="rounded-lg px-3 py-1.5 font-mono transition-all"
                          style={{ fontSize: 11, color: '#06D6A0', background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)' }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(6,214,160,0.12)' }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(6,214,160,0.06)' }}>
                          ✓ Safe Example
                        </button>
                        <button onClick={() => setValues(BLANK)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono transition-all"
                          style={{ fontSize: 11, color: '#374151', background: 'transparent', border: '1px solid rgba(37,37,56,0.6)' }}>
                          <RotateCcw size={10} /> Clear All
                        </button>
                      </div>
                      <FeatureForm values={values} onChange={handleChange} />
                      <motion.button onClick={handleManualSubmit}
                        className="relative w-full overflow-hidden rounded-xl py-4 font-mono transition-all"
                        style={{
                          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                          letterSpacing: '0.12em', color: '#8B9FEF',
                          background: 'rgba(98,126,234,0.08)', border: '1px solid rgba(98,126,234,0.35)',
                          boxShadow: '0 0 30px rgba(98,126,234,0.1)',
                        }}
                        whileHover={{ boxShadow: '0 0 50px rgba(98,126,234,0.25)', background: 'rgba(98,126,234,0.12)', borderColor: 'rgba(98,126,234,0.6)' }}
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <motion.div className="absolute inset-0"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(98,126,234,0.12), transparent)' }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }} />
                        <span className="relative flex items-center justify-center gap-2.5">
                          <Zap size={16} /> ANALYZE ADDRESS
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {appState === 'loading' && (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingSpinner
                  message={inputMode === 'address' ? 'Fetching on-chain data · computing features · running ensemble...' : undefined}
                />
              </motion.div>
            )}

            {appState === 'result' && result && (
              <motion.div key="result"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResultCard result={result as AddressAnalysisResponse} onReset={handleReset} txCount={txCount} />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        <footer style={{ borderTop: '1px solid rgba(37,37,56,0.4)' }} className="py-4 text-center">
          <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: '#1e293b' }}>
            ETHEREUM FRAUD SENTINEL · XGBOOST + ENSEMBLE + SHAP · THRESHOLD 0.30 · FOR RESEARCH USE
          </p>
        </footer>
      </div>
    </div>
  )
}
