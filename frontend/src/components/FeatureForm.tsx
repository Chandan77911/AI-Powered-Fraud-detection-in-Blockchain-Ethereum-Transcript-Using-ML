import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, Coins, BarChart3 } from 'lucide-react'
import { FEATURE_FIELDS } from '../types'
import type { PredictionRequest, FeatureField } from '../types'

interface Props {
  values: PredictionRequest
  onChange: (key: keyof PredictionRequest, value: number) => void
}

const GROUP_META = {
  timing: {
    label: 'Transaction Timing',
    icon: Clock,
    accent: '#4FC3F7',
    accentDim: 'rgba(79,195,247,0.08)',
    accentBorder: 'rgba(79,195,247,0.2)',
    desc: 'Temporal patterns of address activity',
  },
  value: {
    label: 'Value Metrics',
    icon: Coins,
    accent: '#627EEA',
    accentDim: 'rgba(98,126,234,0.08)',
    accentBorder: 'rgba(98,126,234,0.2)',
    desc: 'ETH value flow and balance data',
  },
  timeseries: {
    label: 'Time-Series Features',
    icon: BarChart3,
    accent: '#FFD166',
    accentDim: 'rgba(255,209,102,0.08)',
    accentBorder: 'rgba(255,209,102,0.2)',
    desc: 'Statistical features from ETH value time-series',
  },
}

function FeatureInput({ field, value, onChange }: {
  field: FeatureField; value: number; onChange: (v: number) => void
}) {
  const [focused, setFocused] = useState(false)
  const clamped = Math.min(Math.max((value - field.min) / (field.max - field.min), 0), 1)
  const pct = `${clamped * 100}%`

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-mono transition-colors"
          style={{ fontSize: 11, letterSpacing: '0.06em',
            color: focused ? '#CBD5E1' : '#64748B' }}>
          {field.label}
          {field.unit && <span style={{ color: 'rgba(98,126,234,0.6)', marginLeft: 4 }}>({field.unit})</span>}
        </label>
        <input
          type="number"
          value={value}
          step={field.step}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="font-mono text-right outline-none transition-all rounded"
          style={{
            width: 88, padding: '3px 8px', fontSize: 12,
            background: focused ? 'rgba(98,126,234,0.08)' : 'rgba(8,8,16,0.8)',
            border: `1px solid ${focused ? 'rgba(98,126,234,0.5)' : 'rgba(37,37,56,0.8)'}`,
            color: focused ? '#8B9FEF' : '#CBD5E1',
            boxShadow: focused ? '0 0 12px rgba(98,126,234,0.15)' : 'none',
          }}
        />
      </div>

      <input type="range"
        min={field.min} max={field.max} step={field.step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--range-progress': pct } as React.CSSProperties}
        className="w-full"
      />

      <div className="flex justify-between">
        <span className="font-mono" style={{ fontSize: 9, color: 'rgba(100,116,139,0.4)' }}>{field.min}</span>
        <span className="font-mono" style={{ fontSize: 9, color: 'rgba(100,116,139,0.4)' }}>{field.max}</span>
      </div>
    </div>
  )
}

export default function FeatureForm({ values, onChange }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    timing: true, value: true, timeseries: false,
  })

  const groups = ['timing', 'value', 'timeseries'] as const

  return (
    <div className="space-y-3">
      {groups.map((groupKey, gIdx) => {
        const meta = GROUP_META[groupKey]
        const Icon = meta.icon
        const fields = FEATURE_FIELDS.filter((f) => f.group === groupKey)
        const isOpen = openGroups[groupKey]

        return (
          <motion.div key={groupKey}
            className="overflow-hidden rounded-xl"
            style={{
              background: 'rgba(19,19,31,0.9)',
              border: `1px solid ${isOpen ? meta.accentBorder : 'rgba(37,37,56,0.7)'}`,
              boxShadow: isOpen ? `0 0 30px ${meta.accentDim}, inset 0 1px 0 rgba(255,255,255,0.04)` : 'none',
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gIdx * 0.08, duration: 0.4 }}
          >
            {/* Header */}
            <button
              onClick={() => setOpenGroups(p => ({ ...p, [groupKey]: !p[groupKey] }))}
              className="flex w-full items-center justify-between px-5 py-4 transition-colors"
              style={{ background: isOpen ? meta.accentDim : 'transparent' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: meta.accentDim, border: `1px solid ${meta.accentBorder}` }}>
                  <Icon size={15} style={{ color: meta.accent }} />
                </div>
                <div className="text-left">
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600,
                    fontSize: 14, color: meta.accent, letterSpacing: '0.04em' }}>
                    {meta.label}
                  </div>
                  <div className="font-mono" style={{ fontSize: 10, color: '#64748B' }}>
                    {meta.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono" style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)' }}>
                  {fields.length} FEATURES
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={14} style={{ color: '#64748B' }} />
                </motion.div>
              </div>
            </button>

            {/* Fields */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ borderTop: '1px solid rgba(37,37,56,0.6)' }}
                    className="px-5 py-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {fields.map((field) => (
                        <FeatureInput key={field.key} field={field}
                          value={values[field.key]}
                          onChange={(v) => onChange(field.key, v)}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
