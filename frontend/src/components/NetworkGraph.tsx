import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { NetworkGraph as NetworkGraphType } from '../types'

interface Props {
  graph: NetworkGraphType
  riskColor: string
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#FF6B6B',
  HIGH:     '#FFD166',
  MEDIUM:   '#4FC3F7',
  LOW:      '#06D6A0',
}

export default function NetworkGraph({ graph, riskColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !graph.nodes.length) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = canvas.parentElement!.clientWidth
    const H = 280
    canvas.width = W * dpr; canvas.height = H * dpr
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // ── Force-directed simulation ─────────────────────────────────────────
    interface SimNode {
      id: string; x: number; y: number; vx: number; vy: number
      type: string; eth: number; tx_count: number; risk: string | null
      label: string
    }

    const nodes: SimNode[] = graph.nodes.map((n, i) => ({
      ...n,
      x: n.type === 'target' ? W / 2 : W / 2 + Math.cos(i / graph.nodes.length * Math.PI * 2) * 100,
      y: n.type === 'target' ? H / 2 : H / 2 + Math.sin(i / graph.nodes.length * Math.PI * 2) * 80,
      vx: 0, vy: 0,
    }))

    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const maxEth = Math.max(...graph.edges.map(e => e.eth), 0.01)

    let frame = 0
    const ALPHA = 0.3

    function tick() {
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx*dx + dy*dy) || 1
          const force = 2000 / (dist * dist)
          a.vx += dx / dist * force * 0.01
          a.vy += dy / dist * force * 0.01
          b.vx -= dx / dist * force * 0.01
          b.vy -= dy / dist * force * 0.01
        }
      }
      // Attraction along edges
      graph.edges.forEach(edge => {
        const a = nodeMap.get(edge.source), b = nodeMap.get(edge.target)
        if (!a || !b) return
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx*dx + dy*dy) || 1
        const target = 80 + (edge.eth / maxEth) * 40
        const force = (dist - target) * 0.04
        a.vx += dx / dist * force
        a.vy += dy / dist * force
        b.vx -= dx / dist * force
        b.vy -= dy / dist * force
      })
      // Centre gravity + damping + boundary
      nodes.forEach(n => {
        if (n.type === 'target') { n.x = W / 2; n.y = H / 2; return }
        n.vx += (W / 2 - n.x) * 0.003
        n.vy += (H / 2 - n.y) * 0.003
        n.vx *= 0.85; n.vy *= 0.85
        n.x = Math.max(24, Math.min(W - 24, n.x + n.vx))
        n.y = Math.max(24, Math.min(H - 24, n.y + n.vy))
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++
      if (frame < 120) tick()

      // Edges
      graph.edges.forEach(edge => {
        const a = nodeMap.get(edge.source), b = nodeMap.get(edge.target)
        if (!a || !b) return
        const alpha = Math.min(0.6, 0.15 + (edge.eth / maxEth) * 0.45)
        const edgeColor = edge.direction === 'out' ? '#FF6B6B' : '#06D6A0'
        ctx.strokeStyle = edgeColor + Math.floor(alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = Math.max(0.5, Math.min(3, edge.eth / maxEth * 3))
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        ctx.setLineDash([])

        // Arrow
        const angle = Math.atan2(b.y - a.y, b.x - a.x)
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        ctx.save()
        ctx.translate(mx, my); ctx.rotate(angle)
        ctx.fillStyle = edgeColor + 'cc'
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill()
        ctx.restore()

        // Edge ETH label
        if (edge.eth > 0.001) {
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
          ctx.font = '9px monospace'; ctx.textAlign = 'center'
          ctx.fillText(`${edge.eth.toFixed(3)}Ξ`, mx, my - 8)
        }
      })

      // Nodes
      nodes.forEach(n => {
        const isCenter = n.type === 'target'
        const r = isCenter ? 22 : Math.max(10, Math.min(18, 8 + (n.eth / maxEth) * 10))
        const nodeColor = n.risk ? (RISK_COLORS[n.risk] ?? riskColor) : (isCenter ? riskColor : '#627EEA')

        // Glow
        if (isCenter || n.risk) {
          ctx.shadowColor = nodeColor; ctx.shadowBlur = isCenter ? 20 : 10
        }

        // Circle
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor + (isCenter ? '40' : '25')
        ctx.fill()
        ctx.strokeStyle = nodeColor + (isCenter ? 'cc' : '80')
        ctx.lineWidth = isCenter ? 2 : 1
        ctx.stroke()
        ctx.shadowBlur = 0

        // Centre pulse ring
        if (isCenter) {
          const pulse = 0.5 + Math.sin(frame * 0.05) * 0.5
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 6 + pulse * 4, 0, Math.PI * 2)
          ctx.strokeStyle = nodeColor + Math.floor(pulse * 80).toString(16).padStart(2, '0')
          ctx.lineWidth = 1; ctx.stroke()
        }

        // Label
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)'
        ctx.font = `${isCenter ? '600 ' : ''}9px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y + r + 12)

        // Risk badge
        if (n.risk && !isCenter) {
          ctx.fillStyle = nodeColor + 'dd'
          ctx.font = '8px monospace'; ctx.textAlign = 'center'
          ctx.fillText(n.risk, n.x, n.y + r + 22)
        }
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [graph])

  if (!graph.nodes.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: riskColor }} />
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#64748B' }}>
            WALLET NETWORK GRAPH — {graph.nodes.length} NODES · {graph.edges.length} CONNECTIONS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div style={{ width:8,height:2,background:'#FF6B6B',borderRadius:1 }}/>
            <span className="font-mono" style={{fontSize:9,color:'#FF6B6B'}}>OUTFLOW</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width:8,height:2,background:'#06D6A0',borderRadius:1 }}/>
            <span className="font-mono" style={{fontSize:9,color:'#06D6A0'}}>INFLOW</span>
          </div>
        </div>
      </div>
      <div style={{ background:'rgba(8,8,16,0.5)',borderRadius:12,border:'1px solid rgba(37,37,56,0.6)',overflow:'hidden' }}>
        <canvas ref={canvasRef} style={{ display:'block' }} />
      </div>
      <p className="font-mono mt-2" style={{ fontSize:9,color:'#374151',letterSpacing:'0.08em' }}>
        Node size = ETH volume. Red dashes = outgoing funds. Green dashes = incoming. Risk propagation: high-value counterparties of a fraud wallet are flagged MEDIUM.
      </p>
    </motion.div>
  )
}
