import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';

export default function ThreeBackground() {
  const mountRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const mount = mountRef.current;
    if (!mount) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Read accent color from CSS variable (HSL channels)
    const accentHsl = window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const color = new THREE.Color(accentHsl ? `hsl(${accentHsl})` : '#4ade80');

    // Particle field
    const count = 320;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size: 0.7,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    const onMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let frameId;
    let rotY = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      rotY += 0.0006;
      points.rotation.y += (rotY - points.rotation.y) * 0.06;
      points.rotation.x += (mouseY * 0.12 - points.rotation.x) * 0.04;
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />;
}