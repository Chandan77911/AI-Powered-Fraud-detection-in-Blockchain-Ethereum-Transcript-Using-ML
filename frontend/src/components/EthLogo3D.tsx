import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function EthLogo3D({ size = 44 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
    camera.position.set(0, 0, 4)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pLight = new THREE.PointLight(0x627EEA, 3, 15)
    pLight.position.set(2, 2, 3)
    scene.add(pLight)
    const pLight2 = new THREE.PointLight(0x4FC3F7, 1.5, 15)
    pLight2.position.set(-2, -1, 2)
    scene.add(pLight2)

    // Ethereum diamond shape using OctahedronGeometry
    const ethGeo = new THREE.OctahedronGeometry(1.0, 0)

    // Scale to Ethereum proportions (taller)
    const positions = ethGeo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      positions.setY(i, y * 1.4)
    }
    positions.needsUpdate = true
    ethGeo.computeVertexNormals()

    const ethMat = new THREE.MeshPhongMaterial({
      color: 0x627EEA,
      emissive: 0x3C3C7D,
      emissiveIntensity: 0.4,
      shininess: 150,
      transparent: true,
      opacity: 0.95,
    })
    const ethMesh = new THREE.Mesh(ethGeo, ethMat)
    scene.add(ethMesh)

    // Wireframe overlay
    const wireGeo = new THREE.OctahedronGeometry(1.05, 0)
    const wPositions = wireGeo.attributes.position
    for (let i = 0; i < wPositions.count; i++) {
      wPositions.setY(i, wPositions.getY(i) * 1.4)
    }
    wPositions.needsUpdate = true
    wireGeo.computeVertexNormals()

    scene.add(new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({
      color: 0x8B9FEF, wireframe: true, transparent: true, opacity: 0.25,
    })))

    let frameId: number
    let frame = 0

    function animate() {
      frameId = requestAnimationFrame(animate)
      frame++
      ethMesh.rotation.y += 0.018
      ethMesh.rotation.x = Math.sin(frame * 0.01) * 0.2
      pLight.intensity = 2.5 + Math.sin(frame * 0.05) * 0.8
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [size])

  return <div ref={mountRef} style={{ width: size, height: size, flexShrink: 0 }} />
}
