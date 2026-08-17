import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { getSettings } from '@/lib/settings';

export default function ThreeBackground() {
  const mountRef = useRef(null);
  const { theme } = useTheme();
  const [bgType, setBgType] = useState(getSettings().backgroundType || 'particles');
  const isLight = theme === 'light' || theme === 'creme';

  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail && e.detail.backgroundType) {
        setBgType(e.detail.backgroundType);
      }
    };
    window.addEventListener('settings-changed', handleSettingsChange);
    return () => window.removeEventListener('settings-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (bgType === 'none') return;

    const mount = mountRef.current;
    if (!mount) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 1, 2000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const accentHsl = window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    let formattedHsl = accentHsl;
    if (formattedHsl && !formattedHsl.includes(',')) {
      formattedHsl = formattedHsl.split(/\s+/).join(', ');
    }
    const color = new THREE.Color(formattedHsl ? `hsl(${formattedHsl})` : '#4ade80');
    
    const oMult = isLight ? 3 : 1;
    if (isLight) color.lerp(new THREE.Color('#000000'), 0.15); // slightly darken
    
    let updateFn = () => {};
    const geometries = [];
    const materials = [];

    // Common setup function for points
    const createPoints = (count, posFunc, size = 0.7, opacity = 0.5) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const [x, y, z] = posFunc(i);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ 
        color, 
        size: size * (isLight ? 1.5 : 1), 
        transparent: true, 
        opacity: Math.min(1.0, opacity * oMult), 
        depthWrite: false 
      });
      geometries.push(geometry);
      materials.push(material);
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      return { geometry, points };
    };

    if (bgType === 'particles') {
      const { points } = createPoints(320, () => [
        (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80
      ]);
      let rotY = 0;
      updateFn = (time, mx, my) => {
        rotY += 0.0006;
        points.rotation.y += (rotY - points.rotation.y) * 0.06;
        points.rotation.x += (my * 0.12 - points.rotation.x) * 0.04;
        camera.position.x += (mx * 5 - camera.position.x) * 0.03;
        camera.lookAt(0, 0, 0);
      };
    } 
    else if (bgType === 'network') {
      const count = 150;
      const { geometry, points } = createPoints(count, () => [
        (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60
      ], 1.0, 0.8);
      
      const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.min(1.0, 0.15 * oMult) });
      materials.push(lineMaterial);
      const linesMesh = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
      geometries.push(linesMesh.geometry);
      scene.add(linesMesh);
      
      const velocities = new Float32Array(count * 3);
      for(let i=0; i<count*3; i++) velocities[i] = (Math.random() - 0.5) * 0.1;
      
      updateFn = (time, mx, my) => {
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < count * 3; i++) {
          pos[i] += velocities[i];
          if (pos[i] > 70 || pos[i] < -70) velocities[i] *= -1;
        }
        geometry.attributes.position.needsUpdate = true;
        
        const linePositions = [];
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const dx = pos[i*3] - pos[j*3];
            const dy = pos[i*3+1] - pos[j*3+1];
            const dz = pos[i*3+2] - pos[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq < 400) {
              linePositions.push(pos[i*3], pos[i*3+1], pos[i*3+2]);
              linePositions.push(pos[j*3], pos[j*3+1], pos[j*3+2]);
            }
          }
        }
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        
        points.rotation.y += (mx * 0.2 - points.rotation.y) * 0.05;
        points.rotation.x += (my * 0.2 - points.rotation.x) * 0.05;
        linesMesh.rotation.copy(points.rotation);
      };
    }
    else if (bgType === 'topography') {
      const geometry = new THREE.PlaneGeometry(200, 100, 40, 20);
      const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: Math.min(1.0, 0.15 * oMult) });
      geometries.push(geometry);
      materials.push(material);
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2.5;
      plane.position.y = -20;
      scene.add(plane);
      
      const pos = geometry.attributes.position;
      const initialZ = new Float32Array(pos.count);
      for(let i=0; i<pos.count; i++) {
        initialZ[i] = pos.getZ(i);
      }
      
      updateFn = (time, mx, my) => {
        for(let i=0; i<pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          pos.setZ(i, initialZ[i] + Math.sin(x * 0.1 + time * 2) * 4 + Math.cos(y * 0.1 + time * 2) * 4);
        }
        pos.needsUpdate = true;
        plane.rotation.z = mx * 0.1;
      };
    }
    else if (bgType === 'matrix') {
      const count = 400;
      const { geometry, points } = createPoints(count, () => [
        (Math.random() - 0.5) * 160, Math.random() * 120 - 60, (Math.random() - 0.5) * 80
      ], 1.2, 0.6);
      
      updateFn = (time, mx, my) => {
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
          pos[i*3 + 1] -= 0.5;
          if (pos[i*3 + 1] < -60) pos[i*3 + 1] = 60;
        }
        geometry.attributes.position.needsUpdate = true;
        points.position.x += (mx * 10 - points.position.x) * 0.05;
      };
    }
    else if (bgType === 'galaxy') {
      const count = 1000;
      const { geometry, points } = createPoints(count, (i) => {
        const radius = Math.random() * 60;
        const spinAngle = radius * 0.1;
        const branchAngle = (i % 3) * ((Math.PI * 2) / 3);
        const randomX = (Math.random() - 0.5) * 5;
        const randomY = (Math.random() - 0.5) * 5;
        const randomZ = (Math.random() - 0.5) * 5;
        return [
          Math.cos(branchAngle + spinAngle) * radius + randomX,
          randomY * (1 - radius/60),
          Math.sin(branchAngle + spinAngle) * radius + randomZ
        ];
      }, 0.5, 0.6);
      
      camera.position.set(0, 40, 80);
      camera.lookAt(0,0,0);
      
      updateFn = (time, mx, my) => {
        points.rotation.y = time * 0.2;
        points.rotation.x = mx * 0.2;
        points.rotation.z = my * 0.2;
      };
    }
    else if (bgType === 'cubes') {
      const count = 20;
      const geometry = new THREE.BoxGeometry(4, 4, 4);
      const material = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: Math.min(1.0, 0.3 * oMult) });
      geometries.push(geometry);
      materials.push(material);
      
      const cubes = [];
      for(let i=0; i<count; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40);
        mesh.rotation.set(Math.random(), Math.random(), Math.random());
        cubes.push({ mesh, rotSpeed: Math.random() * 0.02 });
        scene.add(mesh);
      }
      
      updateFn = (time, mx, my) => {
        cubes.forEach(({mesh, rotSpeed}) => {
          mesh.rotation.x += rotSpeed;
          mesh.rotation.y += rotSpeed;
        });
        camera.position.x += (mx * 10 - camera.position.x) * 0.05;
        camera.position.y += (-my * 10 - camera.position.y) * 0.05;
      };
    }
    else if (bgType === 'rings') {
      const group = new THREE.Group();
      for(let i=0; i<5; i++) {
        const geometry = new THREE.TorusGeometry(10 + i*8, 0.2, 16, 100);
        const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: Math.min(1.0, (0.4 - i*0.05) * oMult) });
        geometries.push(geometry);
        materials.push(material);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { speed: (i % 2 === 0 ? 1 : -1) * (0.01 + i*0.005) };
        group.add(mesh);
      }
      scene.add(group);
      
      updateFn = (time, mx, my) => {
        group.children.forEach((mesh) => {
          mesh.rotation.x += mesh.userData.speed;
          mesh.rotation.y += mesh.userData.speed * 0.5;
        });
        group.rotation.x += (my * 0.5 - group.rotation.x) * 0.05;
        group.rotation.y += (mx * 0.5 - group.rotation.y) * 0.05;
      };
    }
    else if (bgType === 'waves') {
      const { geometry, points } = createPoints(1000, (i) => {
        const x = (i % 40) * 4 - 80;
        const z = Math.floor(i / 40) * 4 - 40;
        return [x, 0, z];
      }, 0.8, 0.6);
      
      updateFn = (time, mx, my) => {
        const pos = geometry.attributes.position.array;
        for(let i=0; i<1000; i++) {
          const x = pos[i*3];
          const z = pos[i*3+2];
          pos[i*3+1] = Math.sin(x*0.1 + time*2) * 5 + Math.cos(z*0.1 + time*2) * 5;
        }
        geometry.attributes.position.needsUpdate = true;
        points.rotation.x = 0.2 + my * 0.1;
        points.rotation.y = mx * 0.1;
      };
    }
    else if (bgType === 'dna') {
      const count = 200;
      const { geometry, points } = createPoints(count, (i) => {
        const y = (i - count/2) * 0.6;
        const angle = i * 0.2;
        const r = 10;
        // Two strands
        if (i % 2 === 0) return [Math.cos(angle) * r, y, Math.sin(angle) * r];
        return [Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r];
      }, 1.2, 0.8);
      
      updateFn = (time, mx, my) => {
        points.rotation.y += 0.01;
        points.rotation.x += (my * 0.3 - points.rotation.x) * 0.05;
        points.rotation.z += (mx * 0.3 - points.rotation.z) * 0.05;
      };
    }
    else if (bgType === 'vortex') {
      const count = 800;
      const { geometry, points } = createPoints(count, (i) => {
        const angle = i * 0.1;
        const r = 2 + (i * 0.05);
        return [Math.cos(angle) * r, Math.sin(angle) * r, -i * 0.2];
      }, 0.9, 0.5);
      
      updateFn = (time, mx, my) => {
        points.rotation.z += 0.01;
        camera.position.x += (mx * 5 - camera.position.x) * 0.1;
        camera.position.y += (-my * 5 - camera.position.y) * 0.1;
      };
    }

    let mouseX = 0, mouseY = 0;
    const onMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let frameId;
    let time = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.01;
      updateFn(time, mouseX, mouseY);
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
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [theme, bgType]);

  if (bgType === 'none') return null;

  return <div ref={mountRef} className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${isLight ? 'opacity-100' : 'opacity-70'}`} />;
}