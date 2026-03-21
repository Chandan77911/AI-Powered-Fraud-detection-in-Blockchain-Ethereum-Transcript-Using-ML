import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import type { PredictionResponse } from '../types'

interface Props { result: PredictionResponse }

const RISK_COLOR = {
  LOW:      { main: 0x06D6A0, hex: '#06D6A0', orb: 0x06D6A0 },
  MEDIUM:   { main: 0x4FC3F7, hex: '#4FC3F7', orb: 0x4FC3F7 },
  HIGH:     { main: 0xFFD166, hex: '#FFD166', orb: 0xFFD166 },
  CRITICAL: { main: 0xFF6B6B, hex: '#FF6B6B', orb: 0xFF6B6B },
}

const NODE_LABELS = [
  'Token Transfer', 'Contract Call', 'Internal Txn',
  'Approval', 'Swap', 'Bridge',
]

export default function CyberOrb({ result }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const cfg = RISK_COLOR[result.risk_level]

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
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 0, 9)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    const pLight = new THREE.PointLight(cfg.main, 3, 25)
    scene.add(pLight)

    // ── Central Orb ───────────────────────────────────────────────────
    const orbGeo = new THREE.IcosahedronGeometry(1.0, 2)
    const orbMat = new THREE.MeshPhongMaterial({
      color: cfg.main, emissive: cfg.main,
      emissiveIntensity: 0.3, transparent: true, opacity: 0.85,
      wireframe: false, shininess: 120,
    })
    const orb = new THREE.Mesh(orbGeo, orbMat)
    scene.add(orb)

    // Wireframe overlay on orb
    const wireGeo = new THREE.IcosahedronGeometry(1.05, 2)
    const wireMat = new THREE.MeshBasicMaterial({
      color: cfg.main, wireframe: true, transparent: true, opacity: 0.15,
    })
    scene.add(new THREE.Mesh(wireGeo, wireMat))

    // Outer glow ring
    const glowRing = new THREE.TorusGeometry(1.35, 0.03, 8, 80)
    const glowMat = new THREE.MeshBasicMaterial({
      color: cfg.main, transparent: true, opacity: 0.3,
    })
    scene.add(new THREE.Mesh(glowRing, glowMat))

    // Second ring tilted
    const glowRing2 = new THREE.TorusGeometry(1.35, 0.02, 8, 80)
    const ring2 = new THREE.Mesh(glowRing2,
      new THREE.MeshBasicMaterial({ color: 0x627EEA, transparent: true, opacity: 0.2 })
    )
    ring2.rotation.x = Math.PI / 3
    scene.add(ring2)

    // ── Orbit paths (visual rings) ─────────────────────────────────────
    const orbitRadii = [2.4, 3.2]
    orbitRadii.forEach((r, i) => {
      const orbitGeo = new THREE.TorusGeometry(r, 0.015, 6, 100)
      const orbitMat = new THREE.MeshBasicMaterial({
        color: 0x252538, transparent: true, opacity: 0.4,
      })
      const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat)
      orbitMesh.rotation.x = i === 0 ? Math.PI / 6 : -Math.PI / 5
      scene.add(orbitMesh)
    })

    // ── Satellite nodes ────────────────────────────────────────────────
    const satellites: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; tiltX: number }[] = []
    const satCount = 6

    for (let i = 0; i < satCount; i++) {
      const isSuspect = result.is_fraud && i < 2
      const satColor = isSuspect ? 0xFF6B6B : 0x627EEA
      const satGeo = i % 2 === 0
        ? new THREE.BoxGeometry(0.22, 0.22, 0.22)
        : new THREE.SphereGeometry(0.13, 8, 8)
      const satMat = new THREE.MeshPhongMaterial({
        color: satColor, emissive: satColor, emissiveIntensity: 0.5,
        transparent: true, opacity: 0.9,
      })
      const sat = new THREE.Mesh(satGeo, satMat)
      const radius = i < 3 ? 2.4 : 3.2
      const angle = (i / satCount) * Math.PI * 2
      const tiltX = i < 3 ? Math.PI / 6 : -Math.PI / 5
      sat.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * Math.cos(tiltX),
        Math.sin(angle) * radius * Math.sin(tiltX),
      )
      scene.add(sat)
      satellites.push({ mesh: sat, angle, radius, speed: 0.006 + i * 0.001, tiltX })

      // Connecting line from center to satellite
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        sat.position.clone(),
      ])
      const lineMat = new THREE.LineBasicMaterial({
        color: satColor, transparent: true, opacity: 0.15,
      })
      scene.add(new THREE.Line(lineGeo, lineMat))
    }

    // ── Data stream dots along orbit ────────────────────────────────────
    const streamDots: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; tiltX: number }[] = []
    for (let i = 0; i < 12; i++) {
      const dotGeo = new THREE.SphereGeometry(0.04, 6, 6)
      const dotMat = new THREE.MeshBasicMaterial({
        color: cfg.main, transparent: true, opacity: 0.5,
      })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      const radius = 2.4 + (i % 2) * 0.8
      const tiltX = i % 2 === 0 ? Math.PI / 6 : -Math.PI / 5
      const angle = (i / 12) * Math.PI * 2
      dot.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * Math.cos(tiltX),
        Math.sin(angle) * radius * Math.sin(tiltX),
      )
      scene.add(dot)
      streamDots.push({ mesh: dot, angle, speed: 0.02 + (i % 3) * 0.005, radius, tiltX })
    }

    // ── Animate ────────────────────────────────────────────────────────
    let frameId: number
    let frame = 0

    function animate() {
      frameId = requestAnimationFrame(animate)
      frame++

      // Orb slow spin
      orb.rotation.y += 0.008
      orb.rotation.x += 0.003

      // Satellite orbits
      satellites.forEach((s) => {
        s.angle += s.speed
        s.mesh.position.set(
          Math.cos(s.angle) * s.radius,
          Math.sin(s.angle) * s.radius * Math.cos(s.tiltX),
          Math.sin(s.angle) * s.radius * Math.sin(s.tiltX),
        )
        s.mesh.rotation.x += 0.02
        s.mesh.rotation.y += 0.015
      })

      // Stream dots
      streamDots.forEach((d) => {
        d.angle += d.speed
        d.mesh.position.set(
          Math.cos(d.angle) * d.radius,
          Math.sin(d.angle) * d.radius * Math.cos(d.tiltX),
          Math.sin(d.angle) * d.radius * Math.sin(d.tiltX),
        )
        ;(d.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.3 + Math.sin(frame * 0.1 + d.angle) * 0.3
      })

      // Breathing glow
      pLight.intensity = 2.5 + Math.sin(frame * 0.04) * 1
      orbMat.emissiveIntensity = 0.25 + Math.sin(frame * 0.03) * 0.15

      // Scene slow rotation
      scene.rotation.y = Math.sin(frame * 0.004) * 0.15

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
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-eth-purple animate-pulse" />
        <span className="font-mono text-[11px] tracking-widest text-eth-textDim">
          CONTRACT INTERACTION MAP
        </span>
      </div>

      {/* 3D canvas */}
      <div ref={mountRef} style={{ width: '100%', height: 240 }} className="rounded-xl overflow-hidden" />

      {/* Node legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {NODE_LABELS.map((label, i) => {
          const isSuspect = result.is_fraud && i < 2
          return (
            <motion.div
              key={label}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5"
              style={{
                background: isSuspect ? 'rgba(255,107,107,0.08)' : 'rgba(37,37,56,0.5)',
                border: `1px solid ${isSuspect ? 'rgba(255,107,107,0.25)' : 'rgba(37,37,56,0.8)'}`,
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
            >
              <div
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: isSuspect ? '#FF6B6B' : '#627EEA' }}
              />
              <span className="font-mono text-[9px] truncate"
                style={{ color: isSuspect ? '#FF6B6B' : '#64748B' }}>
                {label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
