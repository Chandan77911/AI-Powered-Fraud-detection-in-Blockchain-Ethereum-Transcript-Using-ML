import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import type { PredictionResponse } from '../types'

interface Props { result: PredictionResponse }

const RISK_CONFIG = {
  LOW:      { color: 0x06D6A0, hex: '#06D6A0', label: 'SAFE',       glowHex: 'rgba(6,214,160,0.5)'   },
  MEDIUM:   { color: 0x4FC3F7, hex: '#4FC3F7', label: 'SUSPICIOUS', glowHex: 'rgba(79,195,247,0.5)'  },
  HIGH:     { color: 0xFFD166, hex: '#FFD166', label: 'HIGH RISK',  glowHex: 'rgba(255,209,102,0.5)' },
  CRITICAL: { color: 0xFF6B6B, hex: '#FF6B6B', label: 'CRITICAL',   glowHex: 'rgba(255,107,107,0.55)'},
}

export default function RiskGauge3D({ result }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [displayPct, setDisplayPct] = useState(0)
  const cfg = RISK_CONFIG[result.risk_level]

  // Animate percentage counter
  useEffect(() => {
    const target = Math.round(result.fraud_probability * 100)
    let current = 0
    const step = target / 60
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setDisplayPct(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [result.fraud_probability])

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current
    const W = el.clientWidth, H = el.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 0, 8)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pLight = new THREE.PointLight(cfg.color, 3, 20)
    pLight.position.set(0, 0, 5)
    scene.add(pLight)

    // ── Arc track (background ring) ──────────────────────────────────
    const trackCurve = new THREE.TorusGeometry(2.8, 0.06, 8, 100, Math.PI * 1.6)
    const trackMat = new THREE.MeshBasicMaterial({ color: 0x252538, transparent: true, opacity: 0.6 })
    const track = new THREE.Mesh(trackCurve, trackMat)
    track.rotation.z = Math.PI * 0.7
    scene.add(track)

    // ── Progress arc ─────────────────────────────────────────────────
    const progressAngle = Math.PI * 1.6 * result.fraud_probability
    const progressCurve = new THREE.TorusGeometry(2.8, 0.1, 12, 100, progressAngle)
    const progressMat = new THREE.MeshPhongMaterial({
      color: cfg.color, emissive: cfg.color,
      emissiveIntensity: 0.5, shininess: 100,
    })
    const progressArc = new THREE.Mesh(progressCurve, progressMat)
    progressArc.rotation.z = Math.PI * 0.7
    scene.add(progressArc)

    // ── Tip sphere (glowing endpoint) ─────────────────────────────────
    const tipGeo = new THREE.SphereGeometry(0.18, 16, 16)
    const tipMat = new THREE.MeshPhongMaterial({
      color: cfg.color, emissive: cfg.color, emissiveIntensity: 1,
    })
    const tipSphere = new THREE.Mesh(tipGeo, tipMat)
    const tipAngle = Math.PI * 0.7 + progressAngle
    tipSphere.position.set(
      2.8 * Math.cos(tipAngle),
      2.8 * Math.sin(tipAngle),
      0,
    )
    scene.add(tipSphere)

    // ── Outer ring glow ───────────────────────────────────────────────
    const outerRing = new THREE.TorusGeometry(3.0, 0.02, 6, 100)
    const outerMat = new THREE.MeshBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.15,
    })
    scene.add(new THREE.Mesh(outerRing, outerMat))

    // ── Inner decorative rings ────────────────────────────────────────
    ;[2.2, 1.6].forEach((r, i) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.015, 6, 80)
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x627EEA : 0x252538,
        transparent: true, opacity: i === 0 ? 0.2 : 0.3,
      })
      scene.add(new THREE.Mesh(ringGeo, ringMat))
    })

    // ── Tick marks ───────────────────────────────────────────────────
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI * 0.7 + (Math.PI * 1.6 * i / 10)
      const isMain = i % 5 === 0
      const tickLen = isMain ? 0.25 : 0.12
      const points = [
        new THREE.Vector3(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0),
        new THREE.Vector3(Math.cos(angle) * (2.5 + tickLen), Math.sin(angle) * (2.5 + tickLen), 0),
      ]
      const tickGeo = new THREE.BufferGeometry().setFromPoints(points)
      const tickMat = new THREE.LineBasicMaterial({
        color: isMain ? 0x627EEA : 0x252538, transparent: true, opacity: isMain ? 0.6 : 0.3,
      })
      scene.add(new THREE.Line(tickGeo, tickMat))
    }

    // ── Floating data particles ────────────────────────────────────────
    const dotGeo = new THREE.SphereGeometry(0.04, 6, 6)
    const dots: THREE.Mesh[] = []
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 1.0 + Math.random() * 1.2
      const dot = new THREE.Mesh(
        dotGeo,
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: Math.random() * 0.5 + 0.2 })
      )
      dot.position.set(Math.cos(angle) * r, Math.sin(angle) * r, (Math.random() - 0.5) * 0.5)
      scene.add(dot)
      dots.push(dot)
    }

    // ── Animate ───────────────────────────────────────────────────────
    let frameId: number
    let frame = 0
    const startScale = 0.01

    // Animate progress arc scale in
    progressArc.scale.set(startScale, startScale, startScale)
    tipSphere.scale.set(startScale, startScale, startScale)

    function animate() {
      frameId = requestAnimationFrame(animate)
      frame++

      // Scale in animation
      const scaleTarget = 1.0
      if (progressArc.scale.x < scaleTarget) {
        const s = Math.min(progressArc.scale.x + 0.04, scaleTarget)
        progressArc.scale.set(s, s, s)
        tipSphere.scale.set(s, s, s)
      }

      // Gentle scene rotation
      scene.rotation.z = Math.sin(frame * 0.005) * 0.04

      // Pulsing glow
      pLight.intensity = 2.5 + Math.sin(frame * 0.04) * 1
      progressMat.emissiveIntensity = 0.4 + Math.sin(frame * 0.04) * 0.2

      // Animate dots
      dots.forEach((dot, i) => {
        const angle = frame * 0.008 + i * (Math.PI * 2 / dots.length)
        const r = 1.0 + (i % 3) * 0.4
        dot.position.set(Math.cos(angle) * r, Math.sin(angle) * r, dot.position.z)
        ;(dot.material as THREE.MeshBasicMaterial).opacity =
          0.2 + Math.sin(frame * 0.05 + i) * 0.2
      })

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [result])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D canvas */}
      <div className="relative" style={{ width: 260, height: 260 }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {/* Overlay text — center of the gauge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            className="font-mono leading-none"
            style={{ fontSize: 48, fontWeight: 700, color: cfg.hex,
              textShadow: `0 0 20px ${cfg.glowHex}, 0 0 40px ${cfg.glowHex}` }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {displayPct}<span style={{ fontSize: 22, opacity: 0.7 }}>%</span>
          </motion.div>
          <motion.div
            className="font-mono tracking-widest"
            style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            FRAUD PROB.
          </motion.div>
        </div>
      </div>

      {/* Risk badge */}
      <motion.div
        className="flex items-center gap-2.5 rounded-full px-6 py-2.5 border"
        style={{
          borderColor: cfg.hex + '55',
          background: cfg.hex + '12',
          boxShadow: `0 0 24px ${cfg.glowHex}`,
        }}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ background: cfg.hex }}
          animate={{ opacity: [1, 0.3, 1], boxShadow: [`0 0 6px ${cfg.hex}`, `0 0 16px ${cfg.hex}`, `0 0 6px ${cfg.hex}`] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 14, letterSpacing: '0.15em', color: cfg.hex,
        }}>
          {cfg.label}
        </span>
      </motion.div>

      {/* Confidence bar */}
      <motion.div
        className="w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex justify-between mb-1.5">
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: '#64748B' }}>
            MODEL CONFIDENCE
          </span>
          <span className="font-mono" style={{ fontSize: 10, color: cfg.hex }}>
            {Math.round(result.confidence * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(37,37,56,0.8)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${cfg.hex}99, ${cfg.hex})`,
              boxShadow: `0 0 10px ${cfg.glowHex}` }}
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence * 100}%` }}
            transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>
    </div>
  )
}
