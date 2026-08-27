import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { getSettings } from '@/lib/settings';

export default function ThreeBackground() {
  const mountRef = useRef(null);
  const { theme } = useTheme();
  const [bgType, setBgType] = useState(getSettings().backgroundType || 'particles');
  const isLight = theme === 'light' || theme === 'creme' || theme === 'sand' || theme === 'mint' || theme === 'royal';

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
    
    // Ambient opacity multiplier calibrated for visual elegance
    const oMult = isLight ? 0.45 : 0.85;
    
    let updateFn = () => {};
    const geometries = [];
    const materials = [];

    const isMobileScreen = width < 640;

    // Common setup function for points
    const createPoints = (count, posFunc, size = 0.8, opacity = 0.6) => {
      const actualCount = isMobileScreen ? Math.max(50, Math.floor(count * 0.35)) : count;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(actualCount * 3);
      for (let i = 0; i < actualCount; i++) {
        const [x, y, z] = posFunc(i);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ 
        color, 
        size: size * (isLight ? 0.9 : 1.1), 
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
      const { points } = createPoints(420, () => [
        (Math.random() - 0.5) * 220, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 110
      ], 0.85, 0.7);
      let rotY = 0;
      updateFn = (time, mx, my) => {
        rotY += 0.0006;
        points.rotation.y += (rotY - points.rotation.y) * 0.05;
        points.rotation.x += (my * 0.2 - points.rotation.x) * 0.04;
        camera.position.x += (mx * 10 - camera.position.x) * 0.03;
        camera.position.y += (-my * 6 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      };
    } 
    else if (bgType === 'network') {
      const count = isMobileScreen ? 50 : 160;
      const { geometry, points } = createPoints(count, () => [
        (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 110, (Math.random() - 0.5) * 80
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
          if (pos[i] > 80 || pos[i] < -80) velocities[i] *= -1;
        }
        geometry.attributes.position.needsUpdate = true;
        
        const linePositions = [];
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const dx = pos[i*3] - pos[j*3];
            const dy = pos[i*3+1] - pos[j*3+1];
            const dz = pos[i*3+2] - pos[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq < 420) {
              linePositions.push(pos[i*3], pos[i*3+1], pos[i*3+2]);
              linePositions.push(pos[j*3], pos[j*3+1], pos[j*3+2]);
            }
          }
        }
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        
        points.rotation.y += (mx * 0.25 - points.rotation.y) * 0.04;
        points.rotation.x += (my * 0.25 - points.rotation.x) * 0.04;
        linesMesh.rotation.copy(points.rotation);
        camera.position.x += (mx * 8 - camera.position.x) * 0.03;
        camera.position.y += (-my * 6 - camera.position.y) * 0.03;
      };
    }
    else if (bgType === 'topography') {
      // Elegant low-horizon ambient particle wave terrain
      const cols = isMobileScreen ? 30 : 60;
      const rows = isMobileScreen ? 18 : 36;
      const totalPoints = cols * rows;
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(totalPoints * 3);
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 3;
          positions[idx] = (c - cols / 2) * 3.5;
          positions[idx + 1] = -28;
          positions[idx + 2] = (r - rows / 2) * 3.5 - 20;
        }
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ 
        color, 
        size: isLight ? 0.9 : 1.1, 
        transparent: true, 
        opacity: Math.min(0.65, 0.4 * oMult), 
        depthWrite: false 
      });
      geometries.push(geometry);
      materials.push(material);
      const terrain = new THREE.Points(geometry, material);
      scene.add(terrain);
      
      updateFn = (time, mx, my) => {
        const posArray = geometry.attributes.position.array;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 3;
            const x = posArray[idx];
            const z = posArray[idx + 2];
            posArray[idx + 1] = -26 + Math.sin(x * 0.08 + time * 1.5) * 4 + Math.cos(z * 0.08 + time * 1.2) * 3;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        terrain.rotation.y = mx * 0.15;
        camera.position.x += (mx * 8 - camera.position.x) * 0.03;
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
    else if (bgType === 'aurora') {
      const geometry = new THREE.PlaneGeometry(width * 2, height * 2);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0 },
          u_color: { value: color },
          u_opacity: { value: isLight ? 0.3 : 0.6 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float u_time;
          uniform vec3 u_color;
          uniform float u_opacity;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float t = u_time * 0.2;
            float intensity = sin(p.x * 2.0 + t) * cos(p.y * 2.0 + t) + sin(p.x * 4.0 - t * 1.5) * 0.5;
            vec3 aurora = mix(u_color, vec3(0.1, 0.5, 0.8), sin(t) * 0.5 + 0.5);
            float alpha = smoothstep(0.1, 1.0, intensity) * u_opacity;
            gl_FragColor = vec4(aurora * intensity, alpha * (1.0 - length(p) * 0.5));
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      geometries.push(geometry);
      materials.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -50;
      scene.add(mesh);
      updateFn = (time) => { material.uniforms.u_time.value = time; };
    }
    else if (bgType === 'liquid_noise') {
      const geometry = new THREE.PlaneGeometry(width * 2, height * 2);
      const material = new THREE.ShaderMaterial({
        uniforms: { u_time: { value: 0 }, u_color: { value: color }, u_opacity: { value: isLight ? 0.15 : 0.3 } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float u_time; uniform vec3 u_color; uniform float u_opacity; varying vec2 vUv;
          void main() {
            vec2 p = vUv * 5.0;
            for(int i=1; i<4; i++) {
              vec2 newp = p;
              newp.x += 0.6/float(i)*sin(float(i)*p.y+u_time/2.0+0.3) + 1.0;
              newp.y += 0.6/float(i)*cos(float(i)*p.x+u_time/2.0+0.3) - 1.0;
              p = newp;
            }
            vec3 col = u_color * (0.5 * sin(3.0 * p.x) + 0.5);
            gl_FragColor = vec4(col, u_opacity * 0.5);
          }
        `,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      geometries.push(geometry); materials.push(material);
      const mesh = new THREE.Mesh(geometry, material); mesh.position.z = -50; scene.add(mesh);
      updateFn = (time) => { material.uniforms.u_time.value = time; };
    }
    else if (bgType === 'plasma') {
      const geometry = new THREE.PlaneGeometry(width * 2, height * 2);
      const material = new THREE.ShaderMaterial({
        uniforms: { u_time: { value: 0 }, u_color: { value: color }, u_opacity: { value: isLight ? 0.2 : 0.4 } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float u_time; uniform vec3 u_color; uniform float u_opacity; varying vec2 vUv;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float v1 = sin(p.x * 5.0 + u_time);
            float v2 = sin(10.0 * (p.x * sin(u_time/2.0) + p.y * cos(u_time/3.0)) + u_time);
            float cx = p.x + 0.5 * sin(u_time/5.0);
            float cy = p.y + 0.5 * cos(u_time/3.0);
            float v3 = sin(sqrt(100.0 * (cx*cx + cy*cy) + 1.0) + u_time);
            float v = v1 + v2 + v3;
            vec3 col = mix(u_color, vec3(1.0, 1.0, 1.0), sin(v * 3.14) * 0.5 + 0.5);
            gl_FragColor = vec4(col, u_opacity * (0.3 + 0.3 * sin(v)));
          }
        `,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      geometries.push(geometry); materials.push(material);
      const mesh = new THREE.Mesh(geometry, material); mesh.position.z = -50; scene.add(mesh);
      updateFn = (time) => { material.uniforms.u_time.value = time; };
    }
    else if (bgType === 'warp_speed') {
      const count = isMobileScreen ? 400 : 1500;
      const { geometry, points } = createPoints(count, () => [
        (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, -Math.random() * 400
      ], 1.5, 0.8);
      
      updateFn = (time, mx, my) => {
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
          pos[i*3 + 2] += 2.0;
          if (pos[i*3 + 2] > 100) {
            pos[i*3 + 2] = -400;
            pos[i*3] = (Math.random() - 0.5) * 200;
            pos[i*3 + 1] = (Math.random() - 0.5) * 200;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        camera.position.x += (mx * 20 - camera.position.x) * 0.05;
        camera.position.y += (-my * 20 - camera.position.y) * 0.05;
      };
    }

    let mouseX = 0, mouseY = 0;
    const onMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

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
      window.removeEventListener('touchmove', onTouchMove);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      if (renderer.getContext() && typeof renderer.forceContextLoss === 'function') {
        renderer.forceContextLoss();
      }
      renderer.dispose();
    };
  }, [theme, bgType]);

  if (bgType === 'none') return null;

  return (
    <div 
      ref={mountRef} 
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${isLight ? 'opacity-35' : 'opacity-55'}`}
      style={{
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.15) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.15) 100%)',
      }}
    />
  );
}