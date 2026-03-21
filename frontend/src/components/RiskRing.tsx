import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import type { PredictionResponse } from '../types'

interface Props {
  result: PredictionResponse
}

const RISK_COLORS = {
  LOW:      { stroke: '#39ff14', glow: 'rgba(57,255,20,0.4)',   bg: 'rgba(57,255,20,0.06)'  },
  MEDIUM:   { stroke: '#00e5ff', glow: 'rgba(0,229,255,0.4)',   bg: 'rgba(0,229,255,0.06)'  },
  HIGH:     { stroke: '#ffb800', glow: 'rgba(255,184,0,0.4)',   bg: 'rgba(255,184,0,0.06)'  },
  CRITICAL: { stroke: '#ff2d55', glow: 'rgba(255,45,85,0.45)',  bg: 'rgba(255,45,85,0.07)'  },
}

const RISK_LABELS = {
  LOW:      'SAFE',
  MEDIUM:   'SUSPICIOUS',
  HIGH:     'HIGH RISK',
  CRITICAL: 'CRITICAL',
}

export default function RiskRing({ result }: Props) {
  const { fraud_probability, risk_level, confidence } = result
  const colors = RISK_COLORS[risk_level]

  // SVG arc params
  const size = 240
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // Arc spans 270° (from 135° to 405° = bottom-left to bottom-right)
  const arcLength = circumference * 0.75

  const progress = useMotionValue(0)
  const dashOffset = useTransform(progress, (v) => arcLength - v * arcLength)

  useEffect(() => {
    const ctrl = animate(progress, fraud_probability, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    })
    return ctrl.stop
  }, [fraud_probability, progress])

  const displayPct = useTransform(progress, (v) => Math.round(v * 100))

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: colors.bg }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(135deg)' }}
        >
          {/* Track (background arc) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e1e30"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Animated progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${colors.glow}) drop-shadow(0 0 20px ${colors.glow})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="font-mono font-700 leading-none"
            style={{
              fontSize: '52px',
              color: colors.stroke,
              textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
              fontWeight: 700,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span>{displayPct}</motion.span>
            <span style={{ fontSize: '24px', opacity: 0.7 }}>%</span>
          </motion.div>

          <motion.div
            className="mt-1 font-mono text-[11px] tracking-widest text-cyber-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            FRAUD PROB.
          </motion.div>
        </div>

        {/* Corner tick marks */}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              background: '#1e1e30',
              bottom: i === 0 ? '14px' : undefined,
              left: i === 0 ? '14px' : undefined,
              right: i === 1 ? '14px' : undefined,
            }}
          />
        ))}
      </div>

      {/* Risk badge */}
      <motion.div
        className="flex items-center gap-3 rounded-full border px-6 py-2.5"
        style={{
          borderColor: colors.stroke + '60',
          background: colors.bg,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ background: colors.stroke }}
          animate={{
            opacity: [1, 0.3, 1],
            boxShadow: [`0 0 6px ${colors.stroke}`, `0 0 14px ${colors.stroke}`, `0 0 6px ${colors.stroke}`],
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span
          className="font-display font-700 tracking-widest"
          style={{ color: colors.stroke, fontSize: '15px', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}
        >
          {RISK_LABELS[risk_level]}
        </span>
      </motion.div>

      {/* Confidence bar */}
      <motion.div
        className="w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-wider text-cyber-muted">MODEL CONFIDENCE</span>
          <span className="font-mono text-[11px]" style={{ color: colors.stroke }}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-cyber-border/60">
          <motion.div
            className="h-full rounded-full"
            style={{ background: colors.stroke, boxShadow: `0 0 8px ${colors.glow}` }}
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>
    </div>
  )
}
