import { useMemo } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
  color: string
}

export default function ParticleBackground() {
  const particles = useMemo<Particle[]>(() => {
    const colors = ['#00e5ff', '#8b5cf6', '#39ff14', '#00e5ff', '#00e5ff']
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.05,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Radial gradients */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 15% 20%, rgba(0,229,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 85% 70%, rgba(139,92,246,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 50% 50%, rgba(0,229,255,0.02) 0%, transparent 70%)
          `,
        }}
      />

      {/* Particles */}
      <svg className="absolute inset-0 h-full w-full">
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill={p.color}
            opacity={p.opacity}
            style={{
              animation: `dotPulse ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Horizontal scan lines (very subtle) */}
      {[20, 40, 60, 80].map((pct) => (
        <div
          key={pct}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${pct}%`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.04) 50%, transparent 100%)',
          }}
        />
      ))}
    </div>
  )
}
