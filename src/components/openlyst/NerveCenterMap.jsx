import React, { useEffect, useRef } from 'react';
import { Scene, FogExp2, PerspectiveCamera, WebGLRenderer, BufferGeometry, BufferAttribute, PointsMaterial, AdditiveBlending, Points } from 'three';

export default function NerveCenterMap() {
  const mountRef = useRef(null);

  useEffect(() => {
    let frameId;
    const scene = new Scene();
    scene.fog = new FogExp2(0x000000, 0.001);

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 200;

    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    const mount = mountRef.current;
    
    // Safety check
    if (!mount) return;

    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Geometry + Material
    const geometry = new BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 500;
    }
    
    geometry.setAttribute('position', new BufferAttribute(posArray, 3));
    const material = new PointsMaterial({
      size: 1.5,
      color: 0x4ade80, // emerald-400
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending
    });
    
    const particlesMesh = new Points(geometry, material);
    scene.add(particlesMesh);

    // Animation Loop
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.001;
      particlesMesh.rotation.x += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Zero-Leak Cleanup Protocol
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-[400px] rounded-xl border border-border bg-black/90 overflow-hidden" />;
}
