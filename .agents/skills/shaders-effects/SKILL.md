---
name: shaders-effects
description: "Guidelines and implementation recipes for designing, adapting, and integrating interactive WebGL/WebGPU and GLSL shaders inspired by Shaders.com into Openlysts without memory leaks."
---

# Shaders & GLSL Visual Effects Skill

## Objective
When requested to build cutting-edge shader visuals, liquid metal backgrounds, cursor-reactive particle distortions, iridescent glass refractions, or WebGL/WebGPU canvas materials, utilize the patterns and techniques from **Shaders.com** (`https://shaders.com/`) and modern Three.js/OGL shader pipelines.

---

## 1. Shader Archetypes & Core Visuals
- **Liquid Metal & Fluid Dynamics**: Raymarched or heightmap-displaced chromatic fluid surfaces reacting to pointer velocity.
- **Distortion & Chromatic Aberration**: Screen-space UV warping using Perlin/Simplex noise or fractional Brownian motion (fBm).
- **Particle Swarms & Vector Fields**: GPU-computed particle position maps using `THREE.DataTexture` or Float32 buffer attribute updates.
- **Iridescent Glass & Holograms**: Custom Fresnel equations with multi-octave color banding for cards, badges, and headers.
- **Dynamic Energy Grids & Cyber Meshes**: Procedural scanline and grid distortions in vertex/fragment shaders.

---

## 2. Integration Rules for Openlysts

### A. Strict Zero-Memory-Leak Protocol
Every shader mesh, custom material (`THREE.ShaderMaterial` / `THREE.RawShaderMaterial`), uniform texture, and geometry MUST be tracked and cleanly disposed when unmounted or switched:

```javascript
// Register all geometries, materials, and textures for teardown
const uniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  uMouse: { value: new THREE.Vector2(0, 0) }
};

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  transparent: true,
  depthWrite: false
});

const geometry = new THREE.PlaneGeometry(2, 2);

geometries.push(geometry);
materials.push(material);

// Cleanup on unmount/re-render:
// geometry.dispose();
// material.dispose();
// renderer.dispose();
```

### B. Frame Rate & Resource Throttling
- **RAF Loop Throttling**: Pause the `requestAnimationFrame` loop when the container element is scrolled out of viewport using `IntersectionObserver`.
- **DPR Clamping**: Always clamp `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to prevent mobile GPUs from choking on 3x screens.
- **Precision**: Default to `precision mediump float;` in mobile or ambient shaders unless highp depth calculations are strictly required.

---

## 3. Reference GLSL Template (Three.js Custom Shader Material)

```javascript
// Minimal Liquid Distortion / Noise Background Fragment Shader
export const liquidNoiseShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    varying vec2 vUv;

    // Simple 2D Pseudo-Noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec2 st = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
      vec2 mouseNorm = (uMouse * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
      
      float dist = length(st - mouseNorm);
      float wave = sin(dist * 10.0 - uTime * 2.0) * 0.05 / (dist + 0.5);
      
      float n = noise(st * 3.0 + vec2(uTime * 0.1, uTime * 0.15) + wave);
      
      // Openlysts Palette: Dark background (#09090b) with subtle cyan/indigo glow
      vec3 bg = vec3(0.035, 0.035, 0.043);
      vec3 cyanAccent = vec3(0.05, 0.45, 0.65);
      vec3 violetAccent = vec3(0.35, 0.15, 0.65);
      
      vec3 color = mix(bg, mix(cyanAccent, violetAccent, n), n * 0.35);
      gl_FragColor = vec4(color, 1.0);
    }
  `
};
```
