import { motion } from 'framer-motion'
import type { ModelScore } from '../types'

interface Props {
  scores: ModelScore[]
  finalProb: number
  riskColor: string
}

const MODEL_META: Record<string, { icon: string; color: string; auc: string }> = {
  'XGBoost':           { icon: '🌲', color: '#627EEA', auc: '0.989' },
  'IsolationForest':   { icon: '🔍', color: '#4FC3F7', auc: '0.629' },
  'Sequential (GBM)':  { icon: '📈', color: '#FFD166', auc: '0.985' },
}

export default function EnsembleVote({ scores, finalProb, riskColor }: Props) {
  const available = scores.filter(s => !s.unavailable)
  const fraudCount = available.filter(s => s.prob >= 0.3 && (finalProb >= 0.3) === (s.prob >= 0.3)).length

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: riskColor }} />
        <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#64748B' }}>
          ENSEMBLE VOTE — 3 TRAINED MODELS
        </span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(37,37,56,0.6)', background: 'rgba(8,8,16,0.5)' }}>
        {scores.map((score, i) => {
          const meta = MODEL_META[score.model] ?? { icon: '⚙', color: '#627EEA', auc: 'N/A' }
          const pct  = Math.round(score.prob * 100)
          const barColor = score.prob >= 0.65 ? '#FF6B6B' : score.prob >= 0.4 ? '#FFD166' : score.prob >= 0.2 ? '#4FC3F7' : '#06D6A0'
          const riskLabel = score.prob >= 0.65 ? 'CRITICAL' : score.prob >= 0.4 ? 'HIGH' : score.prob >= 0.2 ? 'MEDIUM' : 'LOW'

          return (
            <motion.div key={score.model}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              style={{
                padding: '14px 16px',
                borderBottom: i < scores.length - 1 ? '1px solid rgba(37,37,56,0.5)' : 'none',
                opacity: score.unavailable ? 0.4 : 1,
              }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <div>
                    <div className="font-mono" style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
                      {score.model}
                      {score.unavailable && (
                        <span className="font-mono" style={{ fontSize: 9, color: '#FF6B6B', marginLeft: 8 }}>
                          UNAVAILABLE — add CSV
                        </span>
                      )}
                    </div>
                    <div className="font-mono" style={{ fontSize: 9, color: '#374151', marginTop: 1 }}>
                      {score.description || `AUC ${meta.auc}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono" style={{ fontSize: 9, color: '#374151' }}>
                    weight {Math.round(score.weight * 100)}%
                  </span>
                  <span className="font-mono" style={{
                    fontSize: 10, color: barColor, letterSpacing: '0.08em',
                    background: barColor + '15', border: `1px solid ${barColor}40`,
                    borderRadius: 4, padding: '2px 7px',
                  }}>{riskLabel}</span>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: barColor, minWidth: 42, textAlign: 'right' }}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div style={{ height: 4, background: 'rgba(37,37,56,0.8)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 2, background: barColor, boxShadow: `0 0 8px ${barColor}60` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          )
        })}

        {/* Final consensus row */}
        <div style={{ padding: '14px 16px', background: 'rgba(37,37,56,0.3)', borderTop: '1px solid rgba(37,37,56,0.6)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono" style={{ fontSize: 9, color: '#374151', letterSpacing: '0.1em', marginBottom: 4 }}>
                WEIGHTED ENSEMBLE VERDICT
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: riskColor }}>
                  {Math.round(finalProb * 100)}%
                </span>
                <span className="font-mono" style={{
                  fontSize: 12, color: riskColor, letterSpacing: '0.08em',
                  background: riskColor + '15', border: `1px solid ${riskColor}40`,
                  borderRadius: 4, padding: '4px 10px',
                }}>
                  {finalProb >= 0.65 ? 'CRITICAL' : finalProb >= 0.4 ? 'HIGH' : finalProb >= 0.2 ? 'MEDIUM' : 'LOW'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono" style={{ fontSize: 9, color: '#374151', marginBottom: 4 }}>MODELS AGREED</div>
              <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: '#CBD5E1' }}>
                {fraudCount}/{available.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
