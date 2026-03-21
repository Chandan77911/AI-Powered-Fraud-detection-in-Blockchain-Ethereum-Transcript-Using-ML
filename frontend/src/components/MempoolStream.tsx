import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 120
const COLORS = {
  normal:    0x627EEA,  // ethereum purple
  smart:     0x4FC3F7,  // cyan — smart contract
  suspicious:0xFF6B6B,  // coral — suspicious
}

interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  type: 'normal' | 'smart' | 'suspicious'
  age: number
  maxAge: number
}

export default function MempoolStream() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current

    /* ── Renderer ─────────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    /* ── Scene & Camera ───────────────────────────────────────────────── */
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 200)
    camera.position.set(0, 0, 40)

    /* ── Lights ───────────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    const pLight = new THREE.PointLight(0x627EEA, 2, 60)
    pLight.position.set(0, 0, 20)
    scene.add(pLight)

    /* ── Geometry helpers ─────────────────────────────────────────────── */
    const geoBox    = new THREE.BoxGeometry(0.4, 0.4, 0.4)
    const geoSphere = new THREE.SphereGeometry(0.22, 8, 8)
    const geoDiamond = new THREE.OctahedronGeometry(0.28)

    const matCache: Record<string, THREE.MeshPhongMaterial> = {}
    function getMat(color: number, emissive: number) {
      const key = `${color}-${emissive}`
      if (!matCache[key]) {
        matCache[key] = new THREE.MeshPhongMaterial({
          color, emissive, emissiveIntensity: 0.6,
          transparent: true, opacity: 0.85,
          shininess: 80,
        })
      }
      return matCache[key]
    }

    /* ── Spawn a transaction particle ────────────────────────────────── */
    const particles: Particle[] = []

    function spawnParticle(): Particle {
      const rand = Math.random()
      let type: Particle['type'] = 'normal'
      let geo: THREE.BufferGeometry = geoBox
      let color = COLORS.normal
      let emissive = 0x2244aa

      if (rand > 0.85) {
        type = 'suspicious'
        geo = geoDiamond
        color = COLORS.suspicious
        emissive = 0x880000
      } else if (rand > 0.65) {
        type = 'smart'
        geo = geoSphere
        color = COLORS.smart
        emissive = 0x004466
      }

      const mesh = new THREE.Mesh(geo, getMat(color, emissive))

      // Spawn at left edge, random Y/Z spread
      mesh.position.set(
        -55 + Math.random() * 10,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
      )
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )

      const speed = 0.06 + Math.random() * 0.08
      const p: Particle = {
        mesh,
        velocity: new THREE.Vector3(speed, (Math.random() - 0.5) * 0.008, 0),
        type,
        age: 0,
        maxAge: 300 + Math.random() * 200,
      }
      scene.add(mesh)
      particles.push(p)
      return p
    }

    // Pre-spawn
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = spawnParticle()
      // Distribute across x axis initially
      p.mesh.position.x = -55 + Math.random() * 110
      p.age = Math.random() * p.maxAge
    }

    /* ── Subtle grid plane ────────────────────────────────────────────── */
    const gridHelper = new THREE.GridHelper(120, 30, 0x627EEA, 0x1a1a2e)
    gridHelper.position.y = -18
    gridHelper.material = new THREE.LineBasicMaterial({ color: 0x252540, transparent: true, opacity: 0.3 })
    scene.add(gridHelper)

    /* ── Animation ────────────────────────────────────────────────────── */
    let frameId: number
    let frame = 0

    function animate() {
      frameId = requestAnimationFrame(animate)
      frame++

      // Spawn new particles periodically
      if (frame % 8 === 0 && particles.length < PARTICLE_COUNT) {
        spawnParticle()
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.age++
        p.mesh.position.add(p.velocity)

        // Gentle rotation
        p.mesh.rotation.x += 0.008
        p.mesh.rotation.y += 0.012

        // Fade in/out
        const mat = p.mesh.material as THREE.MeshPhongMaterial
        if (p.age < 30) {
          mat.opacity = (p.age / 30) * 0.85
        } else if (p.age > p.maxAge - 40) {
          mat.opacity = ((p.maxAge - p.age) / 40) * 0.85
        } else {
          mat.opacity = 0.85
        }

        // Remove and respawn when off screen
        if (p.mesh.position.x > 60 || p.age >= p.maxAge) {
          scene.remove(p.mesh)
          particles.splice(i, 1)
        }
      }

      // Subtle camera drift
      camera.position.y = Math.sin(frame * 0.003) * 2
      camera.lookAt(0, 0, 0)

      pLight.intensity = 1.5 + Math.sin(frame * 0.02) * 0.5

      renderer.render(scene, camera)
    }
    animate()

    /* ── Resize ───────────────────────────────────────────────────────── */
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.55,
      }}
    />
  )
}
