import { motion } from 'framer-motion'
<<<<<<< HEAD
import { AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Zap, Brain } from 'lucide-react'
import RiskGauge3D from './RiskGauge3D'
import CyberOrb from './CyberOrb'
import ShapWaterfall from './ShapWaterfall'
import EnsembleVote from './EnsembleVote'
import NetworkGraph from './NetworkGraph'
import type { AddressAnalysisResponse } from '../types'

interface Props {
  result: AddressAnalysisResponse
  onReset: () => void
  txCount?: number | null
}

const RISK_CONFIG = {
  LOW:      { icon: CheckCircle,   color: '#06D6A0', bg: 'rgba(6,214,160,0.06)',    border: 'rgba(6,214,160,0.2)',
    title: 'Address Appears Legitimate',
    text: 'Transaction patterns are consistent with normal user behavior. No significant fraud indicators detected.' },
  MEDIUM:   { icon: TrendingUp,    color: '#4FC3F7', bg: 'rgba(79,195,247,0.06)',   border: 'rgba(79,195,247,0.2)',
    title: 'Anomalies Detected',
    text: 'A few behavioral patterns deviate from baseline. Proceed with caution and consider additional verification.' },
  HIGH:     { icon: AlertTriangle, color: '#FFD166', bg: 'rgba(255,209,102,0.06)',  border: 'rgba(255,209,102,0.2)',
    title: 'High Fraud Indicators',
    text: 'Multiple suspicious patterns detected. This address exhibits behavior commonly associated with fraudulent activity.' },
  CRITICAL: { icon: AlertTriangle, color: '#FF6B6B', bg: 'rgba(255,107,107,0.07)', border: 'rgba(255,107,107,0.28)',
    title: 'Critical Fraud Alert',
    text: 'Strong fraud signals detected across multiple feature dimensions. Exercise extreme caution with this address.' },
}

export default function ResultCard({ result, onReset, txCount }: Props) {
  const { risk_level, fraud_probability, is_fraud } = result
  const cfg  = RISK_CONFIG[risk_level]
  const Icon = cfg.icon

  const hasEnsemble = Array.isArray(result.ensemble_scores) && result.ensemble_scores.length > 0
  const hasShap     = Array.isArray(result.shap_values)     && result.shap_values.length > 0
  const hasGraph    = result.network_graph != null           && Array.isArray(result.network_graph.nodes) && result.network_graph.nodes.length > 0
  const hasPhase2   = hasEnsemble || hasShap || hasGraph

  const stats = [
    { label: 'FRAUD PROBABILITY', value: `${(fraud_probability * 100).toFixed(1)}%`, highlight: true },
    { label: 'CLASSIFICATION',    value: is_fraud ? 'FRAUDULENT' : 'LEGITIMATE',      highlight: false },
    { label: 'RISK LEVEL',        value: risk_level,                                   highlight: false },
    { label: 'THRESHOLD',         value: '0.30',                                       highlight: false },
  ]
  if (txCount != null) stats.push({ label: 'TRANSACTIONS', value: txCount.toLocaleString(), highlight: false })

  return (
    <motion.div className="w-full space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>

      {/* ── Main card ── */}
      <div>
        <div className="h-[2px] w-full rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
            boxShadow: `0 0 20px ${cfg.color}50` }} />
        <div className="rounded-b-2xl overflow-hidden"
          style={{ background: 'rgba(19,19,31,0.95)', border: `1px solid ${cfg.border}`,
            borderTop: 'none', boxShadow: `0 0 40px rgba(0,0,0,0.6), 0 0 80px ${cfg.bg}` }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left: gauge + stats */}
            <div className="p-7 flex flex-col gap-6" style={{ borderRight: '1px solid rgba(37,37,56,0.5)' }}>
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: cfg.color }} />
                <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#64748B' }}>RISK ASSESSMENT</span>
              </div>
              <div className="flex justify-center">
                <RiskGauge3D result={result} />
              </div>
              <motion.div className="rounded-xl p-4"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="flex items-start gap-3">
                  <Icon size={15} style={{ color: cfg.color, marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600,
                      fontSize: 13, color: cfg.color, margin: 0, marginBottom: 4 }}>{cfg.title}</p>
                    <p className="font-mono" style={{ fontSize: 11, lineHeight: 1.6, color: '#64748B', margin: 0 }}>{cfg.text}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div className="grid grid-cols-2 gap-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                {stats.map(s => (
                  <div key={s.label} className="rounded-lg px-3 py-2.5"
                    style={{ background: 'rgba(8,8,16,0.6)',
                      border: `1px solid ${s.highlight ? cfg.border : 'rgba(37,37,56,0.6)'}` }}>
                    <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: '#374151', marginBottom: 4 }}>{s.label}</div>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 600,
                      color: s.highlight ? cfg.color : '#CBD5E1',
                      textShadow: s.highlight ? `0 0 12px ${cfg.color}60` : 'none' }}>{s.value}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: CyberOrb */}
            <div className="p-7 flex flex-col">
              <motion.div className="flex-1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
                <CyberOrb result={result} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Phase 2 panels ── */}
      {hasPhase2 && (
        <>
          <motion.div className="flex items-center gap-3 py-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Brain size={13} style={{ color: '#627EEA' }} />
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#627EEA' }}>
              PHASE 2 — AI INTELLIGENCE
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(98,126,234,0.2)' }} />
          </motion.div>

          {hasEnsemble && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(19,19,31,0.95)', border: '1px solid rgba(37,37,56,0.7)' }}>
              <div className="p-7">
                <EnsembleVote
                  scores={result.ensemble_scores}
                  finalProb={fraud_probability}
                  riskColor={cfg.color}
                />
              </div>
            </div>
          )}

          {hasShap && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(19,19,31,0.95)', border: '1px solid rgba(37,37,56,0.7)' }}>
              <div className="p-7">
                <ShapWaterfall shapValues={result.shap_values} riskColor={cfg.color} />
              </div>
            </div>
          )}

          {hasGraph && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(19,19,31,0.95)', border: '1px solid rgba(37,37,56,0.7)' }}>
              <div className="p-7">
                <NetworkGraph graph={result.network_graph} riskColor={cfg.color} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Reset */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(19,19,31,0.95)', border: '1px solid rgba(37,37,56,0.7)' }}>
        <div className="px-7 py-4">
          <motion.button onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-mono transition-all"
            style={{ fontSize: 13, color: '#64748B', background: 'rgba(8,8,16,0.5)', border: '1px solid rgba(37,37,56,0.7)' }}
            whileHover={{ borderColor: 'rgba(98,126,234,0.4)', color: '#8B9FEF',
              background: 'rgba(98,126,234,0.05)', boxShadow: '0 0 20px rgba(98,126,234,0.1)' }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <RefreshCw size={13} /> ANALYZE ANOTHER ADDRESS
=======
import { AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import RiskGauge3D from './RiskGauge3D'
import CyberOrb from './CyberOrb'
import type { PredictionResponse } from '../types'

interface Props { result: PredictionResponse; onReset: () => void }

const RISK_CONFIG = {
  LOW:      { icon: CheckCircle,  color: '#06D6A0', bg: 'rgba(6,214,160,0.06)',    border: 'rgba(6,214,160,0.2)',
              title: 'Address Appears Legitimate',
              text: 'Transaction patterns are consistent with normal user behavior. No significant fraud indicators detected.' },
  MEDIUM:   { icon: TrendingUp,   color: '#4FC3F7', bg: 'rgba(79,195,247,0.06)',   border: 'rgba(79,195,247,0.2)',
              title: 'Anomalies Detected',
              text: 'A few behavioral patterns deviate from baseline. Proceed with caution and consider additional verification.' },
  HIGH:     { icon: AlertTriangle,color: '#FFD166', bg: 'rgba(255,209,102,0.06)',  border: 'rgba(255,209,102,0.2)',
              title: 'High Fraud Indicators',
              text: 'Multiple suspicious patterns detected. This address exhibits behavior commonly associated with fraudulent activity.' },
  CRITICAL: { icon: AlertTriangle,color: '#FF6B6B', bg: 'rgba(255,107,107,0.07)', border: 'rgba(255,107,107,0.28)',
              title: 'Critical Fraud Alert',
              text: 'Strong fraud signals detected across multiple feature dimensions. Exercise extreme caution with this address.' },
}

export default function ResultCard({ result, onReset }: Props) {
  const { risk_level, fraud_probability, is_fraud } = result
  const cfg = RISK_CONFIG[risk_level]
  const Icon = cfg.icon

  const stats = [
    { label: 'FRAUD PROBABILITY', value: `${(fraud_probability * 100).toFixed(1)}%`, highlight: true },
    { label: 'CLASSIFICATION',    value: is_fraud ? 'FRAUDULENT' : 'LEGITIMATE',     highlight: false },
    { label: 'RISK LEVEL',        value: risk_level,                                  highlight: false },
    { label: 'THRESHOLD',         value: '0.30',                                      highlight: false },
  ]

  return (
    <motion.div className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top accent */}
      <div className="h-[2px] w-full rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
          boxShadow: `0 0 20px ${cfg.color}50` }}
      />

      <div className="rounded-b-2xl overflow-hidden"
        style={{ background: 'rgba(19,19,31,0.95)', border: `1px solid ${cfg.border}`,
          borderTop: 'none', boxShadow: `0 0 40px rgba(0,0,0,0.6), 0 0 80px ${cfg.bg}` }}
      >
        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

          {/* Left: gauge + stats */}
          <div className="p-7 flex flex-col gap-6"
            style={{ borderRight: '1px solid rgba(37,37,56,0.5)' }}>

            {/* Section label */}
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: cfg.color }} />
              <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#64748B' }}>
                RISK ASSESSMENT
              </span>
            </div>

            {/* 3D Gauge */}
            <div className="flex justify-center">
              <RiskGauge3D result={result} />
            </div>

            {/* Advisory */}
            <motion.div className="rounded-xl p-4"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <Icon size={15} style={{ color: cfg.color, marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600,
                    fontSize: 13, color: cfg.color, margin: 0, marginBottom: 4 }}>
                    {cfg.title}
                  </p>
                  <p className="font-mono" style={{ fontSize: 11, lineHeight: 1.6, color: '#64748B', margin: 0 }}>
                    {cfg.text}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div className="grid grid-cols-2 gap-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}>
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(8,8,16,0.6)',
                    border: `1px solid ${s.highlight ? cfg.border : 'rgba(37,37,56,0.6)'}` }}>
                  <div className="font-mono" style={{ fontSize: 9, letterSpacing: '0.1em',
                    color: '#374151', marginBottom: 4 }}>{s.label}</div>
                  <div className="font-mono" style={{ fontSize: 13, fontWeight: 600,
                    color: s.highlight ? cfg.color : '#CBD5E1',
                    textShadow: s.highlight ? `0 0 12px ${cfg.color}60` : 'none' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: CyberOrb */}
          <div className="p-7 flex flex-col">
            <motion.div className="flex-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <CyberOrb result={result} />
            </motion.div>
          </div>
        </div>

        {/* Reset button */}
        <div style={{ borderTop: '1px solid rgba(37,37,56,0.5)' }} className="px-7 py-4">
          <motion.button onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-mono transition-all"
            style={{ fontSize: 13, color: '#64748B',
              background: 'rgba(8,8,16,0.5)',
              border: '1px solid rgba(37,37,56,0.7)' }}
            whileHover={{ borderColor: 'rgba(98,126,234,0.4)', color: '#8B9FEF',
              background: 'rgba(98,126,234,0.05)',
              boxShadow: '0 0 20px rgba(98,126,234,0.1)' }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <RefreshCw size={13} />
            ANALYZE ANOTHER ADDRESS
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
