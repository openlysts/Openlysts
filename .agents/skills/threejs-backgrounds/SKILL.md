---
name: threejs-backgrounds
description: "Guidelines for safely adding, modifying, and cleaning up 3D WebGL backgrounds in Openlyst to prevent memory leaks and maintain 60FPS."
---

# 3D Background Management Protocol

Openlyst utilizes a unified Three.js background system (`src/components/openlyst/ThreeBackground.jsx`) that instantly switches between 10+ visual designs based on user settings. To ensure the application remains "super snappy," you must follow these strict WebGL guidelines.

## 1. Memory Management (Zero Leaks)
Every time the user switches a background, the previous scene is destroyed. If you add a new background type, you MUST push all its Geometries and Materials to the cleanup arrays.

```javascript
// Correct
const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({ color });
geometries.push(geometry); // Required for dispose()
materials.push(material);  // Required for dispose()
scene.add(new THREE.Points(geometry, material));

// Incorrect (Will cause a memory leak on switch)
scene.add(new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial()));
```

## 2. Hardware Acceleration
Never use individual `Object3D` wrappers or `THREE.Sprite` for thousands of particles. Always use `THREE.BufferGeometry` with `Float32Array` attributes.

```javascript
// Correct (1 Draw Call)
const positions = new Float32Array(count * 3);
// populate positions...
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

## 3. Wiring New Backgrounds
If you are adding an 11th background:
1. Add it to the `bgType` `if/else` block inside `ThreeBackground.jsx`.
2. Ensure you assign a clean `updateFn(time, mouseX, mouseY)` inside that block.
3. Add the new string key (e.g. `'blackhole'`) to the dropdown menu in `src/pages/Settings.jsx`.
4. Ensure `src/lib/settings.js` does NOT change its default unless requested, but can support the new key.
