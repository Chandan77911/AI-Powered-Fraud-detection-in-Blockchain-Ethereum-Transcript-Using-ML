import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ShapEntry } from '../types'

interface Props {
  shapValues: ShapEntry[]
  riskColor: string
}

export default function ShapWaterfall({ shapValues, riskColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !shapValues.length) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = canvas.parentElement!.clientWidth
    const H = Math.max(shapValues.length * 38 + 60, 200)
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const maxAbs = Math.max(...shapValues.map(s => Math.abs(s.shap_value)), 0.01)
    const PAD_LEFT = 148, PAD_RIGHT = 80, BAR_H = 22, GAP = 16
    const BAR_AREA = W - PAD_LEFT - PAD_RIGHT
    const ZERO_X = PAD_LEFT + BAR_AREA * 0.5

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const textPrimary   = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'
    const textSecondary = isDark ? 'rgba(255,255,255,0.4)'  : 'rgba(0,0,0,0.4)'
    const gridColor     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    // Zero line
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(ZERO_X, 20); ctx.lineTo(ZERO_X, H - 20); ctx.stroke()
    ctx.setLineDash([])

    shapValues.forEach((entry, i) => {
      const y = 30 + i * (BAR_H + GAP)
      const isPos = entry.shap_value > 0
      const barW = Math.abs(entry.shap_value) / maxAbs * (BAR_AREA * 0.45)
      const barX = isPos ? ZERO_X : ZERO_X - barW

      // Bar fill
      const color = isPos ? '#FF6B6B' : '#06D6A0'
      ctx.fillStyle = color + '25'
      ctx.beginPath()
      ctx.roundRect(barX, y, barW, BAR_H, 3)
      ctx.fill()

      // Bar border
      ctx.strokeStyle = color + '80'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(barX, y, barW, BAR_H, 3)
      ctx.stroke()

      // Feature label
      ctx.fillStyle = textPrimary
      ctx.font = `500 11px "JetBrains Mono", monospace`
      ctx.textAlign = 'right'
      ctx.fillText(entry.feature, PAD_LEFT - 8, y + BAR_H / 2 + 4)

      // SHAP value label
      const valStr = (entry.shap_value >= 0 ? '+' : '') + entry.shap_value.toFixed(3)
      ctx.fillStyle = color
      ctx.font = `600 11px "JetBrains Mono", monospace`
      ctx.textAlign = isPos ? 'left' : 'right'
      ctx.fillText(valStr, isPos ? barX + barW + 6 : barX - 6, y + BAR_H / 2 + 4)

      // Feature value (small, right side)
      ctx.fillStyle = textSecondary
      ctx.font = `400 10px "JetBrains Mono", monospace`
      ctx.textAlign = 'right'
      ctx.fillText(`val: ${entry.feature_value.toFixed(3)}`, W - 4, y + BAR_H / 2 + 4)

      // Grid line
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(PAD_LEFT, y + BAR_H + GAP / 2)
      ctx.lineTo(W - PAD_RIGHT, y + BAR_H + GAP / 2)
      ctx.stroke()
    })

    // Axis labels
    ctx.fillStyle = textSecondary
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('← SAFE', ZERO_X - BAR_AREA * 0.2, H - 6)
    ctx.fillText('FRAUD →', ZERO_X + BAR_AREA * 0.2, H - 6)
    ctx.fillText('0', ZERO_X, H - 6)
  }, [shapValues])

  if (!shapValues.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: riskColor }} />
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#64748B' }}>
            SHAP EXPLAINABILITY — WHY THIS VERDICT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FF6B6B33', border: '1px solid #FF6B6B60' }} />
            <span className="font-mono" style={{ fontSize: 9, color: '#FF6B6B', letterSpacing: '0.08em' }}>FRAUD SIGNAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#06D6A033', border: '1px solid #06D6A060' }} />
            <span className="font-mono" style={{ fontSize: 9, color: '#06D6A0', letterSpacing: '0.08em' }}>SAFE SIGNAL</span>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(8,8,16,0.5)', borderRadius: 12, padding: '16px 8px 8px', border: '1px solid rgba(37,37,56,0.6)' }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
      <p className="font-mono mt-2" style={{ fontSize: 9, color: '#374151', letterSpacing: '0.08em' }}>
        Each bar shows how much a feature pushed the score toward FRAUD (red) or SAFE (green). Larger bar = stronger influence.
      </p>
    </motion.div>
  )
}
