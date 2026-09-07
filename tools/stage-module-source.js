import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/loaders/DRACOLoader.js/+esm';

(async () => {
'use strict';
const host = document.getElementById('rig3d');
if (!host) return;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return; }

/* ---------- loader: Draco-enabled GLTFLoader ---------- */
const MODEL_URL = 'https://files.catbox.moe/wz8ts8.glb';
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
async function loadModel() {
  const forceEmbedded = /[?&]embedded/.test(location.search);
  if (!forceEmbedded) {
    /* 1. the merged model at its published URL (needs CORS + a network that allows it) */
    try { return await loader.loadAsync(MODEL_URL); } catch (e) { console.warn('GASMAX: remote model unavailable, trying the local copy', e && e.message); }
    /* 2. a same-origin slim copy next to the page */
    try { return await loader.loadAsync('assets/gasmax-lite.glb'); } catch (e) { console.warn('GASMAX: local copy unavailable, using the embedded copy'); }
  }
  /* 3. the slim copy embedded in the page (no network, no Draco needed) */
  const b64 = (document.getElementById('gasmaxModel') || {}).textContent || '';
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return await loader.parseAsync(bytes.buffer, '');
}
let gltf;
try { gltf = await loadModel(); } catch (e) { console.error('GASMAX: model failed to load', e); return; }
const root = gltf.scene;

/* ---------- materials: carbon body, neon trim ---------- */
const NEON = 0x00ff66;
const carbon = new THREE.MeshStandardMaterial({ name: 'carbon', color: 0x111111, metalness: 0.85, roughness: 0.2, envMapIntensity: 1.2 });
const neon = new THREE.MeshStandardMaterial({ name: 'neon', color: NEON, emissive: NEON, emissiveIntensity: 2.0, roughness: 0.3, metalness: 0.1 });
const neonStrip = neon.clone(); neonStrip.name = 'neon_strip';
const neonWheel = neon.clone(); neonWheel.name = 'neon_wheel';
const tyre = new THREE.MeshStandardMaterial({ name: 'tyre', color: 0x0b0d0c, roughness: 0.92, metalness: 0.05 });
/* mesh names from the merged file: Vert_Material_0_N is the car, Cube_Pompe* is the pump */
const ROLE = {
  'Vert_Material_0_17': tyre,
  'Vert_Material_0_20': neonWheel,
  'Vert_Material_0_18': neonStrip, 'Vert_Material_0_19': neonStrip, 'Vert_Material_0_21': neonStrip, 'Vert_Material_0_22': neonStrip,
  'Vert_Material_0_1': neon, 'Vert_Material_0_2': neon, 'Vert_Material_0_25': neon, 'Vert_Material_0_6': neon, 'Vert_Material_0_10': neon,
};
const pumpLights = [];
root.traverse(o => {
  if (!o.isMesh) return;
  if (!o.geometry.getAttribute('normal')) o.geometry.computeVertexNormals();
  const n = o.name || '';
  if (/^Cube_Pompe_lumi/.test(n)) { o.material = neon.clone(); o.material.name = 'pump_light'; pumpLights.push(o); }
  else if (ROLE[n]) o.material = ROLE[n];
  else o.material = carbon;
  o.castShadow = true; o.receiveShadow = true;
});
let modelLight = null;
root.traverse(o => { if (o.isLight) { modelLight = o; o.intensity = 3; o.color.set(NEON); o.distance = 4; o.decay = 2; } });

/* ---------- pump on the camera side, facing the viewer ---------- */
root.updateMatrixWorld(true);
const pumpNode = root.getObjectByName('gas_pump');
const pivot = new THREE.Group(); pivot.name = 'pump_pivot';
if (pumpNode) {
  const pc = new THREE.Box3().setFromObject(pumpNode).getCenter(new THREE.Vector3());
  pivot.position.copy(pc); root.add(pivot); pivot.attach(pumpNode);
  pivot.rotation.y = -1.15; pivot.position.set(-3.15, pc.y, 1.2);
}
root.updateMatrixWorld(true);
const carBox = new THREE.Box3(); root.traverse(o => { if (o.isMesh && /^Vert_/.test(o.name)) carBox.expandByObject(o); });
const bbox = new THREE.Box3().setFromObject(root);
root.position.set(-(bbox.min.x + bbox.max.x) / 2, -bbox.min.y, -(bbox.min.z + bbox.max.z) / 2);
root.updateMatrixWorld(true);

/* ---------- renderer, environment, lights ---------- */
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
host.appendChild(renderer.domElement); host.classList.add('on');
const sceneEl = host.closest('.scene'); if (sceneEl) sceneEl.classList.add('webgl');
const scene = new THREE.Scene();
{
  const env = new THREE.Scene(); env.background = new THREE.Color(0x050706);
  const panel = (w, h, c, i, p, r) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.material.color.multiplyScalar(i); m.position.set(...p); m.rotation.set(...r); env.add(m); };
  panel(6, 1.2, 0xffffff, 10, [0, 5, 0], [Math.PI / 2, 0, 0]);
  panel(1.2, 6, 0xffffff, 7, [0, 5, 0], [Math.PI / 2, 0, Math.PI / 2]);
  panel(8, 3, 0xdfe8ff, 4, [0, 3, -7], [0, 0, 0]);
  panel(8, 3, 0xffffff, 3, [0, 2, 7], [0, Math.PI, 0]);
  panel(3, 6, 0x00ff66, 4, [-7, 3, 0], [0, Math.PI / 2, 0]);
  panel(3, 6, 0xffffff, 2.5, [7, 3, 0], [0, -Math.PI / 2, 0]);
  env.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0x0a0d0b, side: THREE.DoubleSide })).rotateX(-Math.PI / 2));
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture; scene.environmentIntensity = 1.4; pmrem.dispose();
}
scene.add(new THREE.HemisphereLight(0x9fb3a8, 0x0a0d0b, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0002; scene.add(key);
const fill = new THREE.DirectionalLight(0x00ff66, 0.9); fill.position.set(-6, 2.5, -4); scene.add(fill);
const rimL = new THREE.DirectionalLight(0xcfe3ff, 1.4); rimL.position.set(2, 4, -7); scene.add(rimL);
scene.add(root);

const radial = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.55 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const floorDisc = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: radial('rgba(6,10,8,0.92)', 'rgba(6,10,8,0)'), transparent: true, depthWrite: false })); floorDisc.rotation.x = -Math.PI / 2; floorDisc.position.y = -0.004; scene.add(floorDisc);

/* world-space anchors after centering */
const pumpCenter = pivot.getWorldPosition(new THREE.Vector3());
const carWorld = carBox.clone().applyMatrix4(root.matrixWorld);
const carC = carWorld.getCenter(new THREE.Vector3());
const pumpLight = new THREE.PointLight(NEON, 2.5, 6, 2); pumpLight.position.copy(pumpCenter).add(new THREE.Vector3(0.2, 0.5, 0.5)); scene.add(pumpLight);
const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), new THREE.MeshBasicMaterial({ map: radial('rgba(0,255,102,1)', 'rgba(0,255,102,0)'), transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(pumpCenter.x, 0.012, pumpCenter.z); scene.add(pool);
const partTex = radial('rgba(210,255,225,1)', 'rgba(0,255,102,0)');
const flareMat = new THREE.SpriteMaterial({ map: partTex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
const flare = new THREE.Sprite(flareMat); flare.scale.set(1.6, 1.6, 1); flare.position.copy(pumpCenter).add(new THREE.Vector3(0.1, 0.35, 0.3)); scene.add(flare);

/* readout on the pump face (pivot-local +x is the pump's front) */
const scrC = document.createElement('canvas'); scrC.width = 256; scrC.height = 112; const sg = scrC.getContext('2d');
const scrTex = new THREE.CanvasTexture(scrC); scrTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.18), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); screen.rotation.y = Math.PI / 2; screen.position.set(0.31, 0.2, 0.05); pivot.add(screen);
function drawScreen(gwei, col, p) {
  sg.fillStyle = '#04110b'; sg.fillRect(0, 0, 256, 112);
  sg.fillStyle = col; sg.font = '700 54px "JetBrains Mono", Consolas, monospace'; sg.textAlign = 'center'; sg.textBaseline = 'alphabetic';
  sg.fillText(String(gwei).padStart(3, '0'), 128, 58);
  sg.fillStyle = '#9AA4AD'; sg.font = '500 12px "JetBrains Mono", Consolas, monospace'; sg.fillText('GWEI · PRESSURE', 128, 78);
  sg.fillStyle = '#0b1f15'; sg.fillRect(24, 90, 208, 8); sg.fillStyle = col; sg.fillRect(24, 90, Math.round(208 * p), 8);
  scrTex.needsUpdate = true;
}

/* charge hose from the pump to the near sidepod, with flow, halo and pulses */
const flowC = document.createElement('canvas'); flowC.width = 64; flowC.height = 8;
{ const g = flowC.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 8); g.fillStyle = '#fff'; g.fillRect(0, 0, 26, 8); }
const flowTex = new THREE.CanvasTexture(flowC); flowTex.wrapS = flowTex.wrapT = THREE.RepeatWrapping; flowTex.repeat.set(22, 1);
const hoseMat = new THREE.MeshStandardMaterial({ color: 0x1a1f1c, roughness: 0.5, metalness: 0.35, emissive: NEON, emissiveIntensity: 0, emissiveMap: flowTex });
const haloMat = new THREE.MeshBasicMaterial({ color: NEON, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, alphaMap: flowTex });
const sideZ = carWorld.max.z, capX = carC.x - 0.4, capY = carWorld.max.y * 0.62;
const hoseCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(pumpCenter.x + 0.35, 0.55, pumpCenter.z + 0.15),
  new THREE.Vector3(pumpCenter.x + 0.7, 0.08, pumpCenter.z + 0.35),
  new THREE.Vector3((pumpCenter.x + capX) / 2, 0.04, sideZ + 0.45),
  new THREE.Vector3(capX - 0.3, 0.05, sideZ + 0.3),
  new THREE.Vector3(capX, capY * 0.6, sideZ + 0.12),
  new THREE.Vector3(capX + 0.05, capY, sideZ - 0.05),
]);
const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 120, 0.035, 12, false), hoseMat); hose.castShadow = true; scene.add(hose);
const halo = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 120, 0.07, 10, false), haloMat); scene.add(halo);
const coupler = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0xd6dadd, roughness: 0.1, metalness: 1 })); coupler.position.copy(hoseCurve.getPoint(1)).add(new THREE.Vector3(0, 0.05, 0)); scene.add(coupler);
const pulseMat = new THREE.SpriteMaterial({ map: partTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const pulses = []; for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(pulseMat); sp.scale.set(0.3, 0.3, 1); scene.add(sp); pulses.push(sp); }
let pulseOff = 0;

/* charge bar along the near sidepod */
const segs = [];
for (let i = 0; i < 8; i++) { const m = new THREE.MeshStandardMaterial({ color: 0x062a14, emissive: NEON, emissiveIntensity: 0.12, roughness: 0.4 }); const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.02), m); b.position.set(carC.x - 1.0 + i * 0.2, capY * 0.72, sideZ + 0.02); scene.add(b); segs.push(b); }
const exhaust = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial('rgba(0,255,102,1)', 'rgba(0,255,102,0)'), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
exhaust.position.set(carWorld.min.x - 0.15, carWorld.max.y * 0.55, carC.z); exhaust.scale.set(0.4, 0.4, 1); scene.add(exhaust);

/* ---------- camera framed on the model, slow drift plus pointer parallax ---------- */
const full = new THREE.Box3().setFromObject(root);
const size = full.getSize(new THREE.Vector3()), center = full.getCenter(new THREE.Vector3());
const look = new THREE.Vector3(center.x + 0.2, Math.max(0.5, center.y * 0.8), center.z);
{ const span = Math.max(size.x, size.z) * 0.8; key.shadow.camera.left = -span; key.shadow.camera.right = span; key.shadow.camera.top = span; key.shadow.camera.bottom = -span; key.shadow.camera.updateProjectionMatrix(); }
const camera = new THREE.PerspectiveCamera(34, 2, 0.05, 200);
const dir0 = new THREE.Vector3(0.32, 0.2, 1.35).normalize();
const rootBase = root.position.clone();
let dist = 10;
function fit() {
  const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const vf = camera.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * camera.aspect);
  dist = Math.max((size.x * 0.5) / Math.tan(hf) * 1.0, (size.y * 0.5) / Math.tan(vf) * 1.35);
}
new ResizeObserver(fit).observe(host); fit();
const state = { p: 0, holding: false, done: false, gwei: 20, col: '#00C805', overheat: false };
let visible = true, last = performance.now(), mx = 0, my = 0, cx = 0, cy = 0, flash = 0, pulseA = 0;
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2; });
host.addEventListener('pointerleave', () => { mx = 0; my = 0; });
const up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
function frame(t) {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
  tmp.copy(dir0).applyAxisAngle(up, 0.14 * Math.sin(t * 0.00022) + cx * 0.32);
  camera.position.copy(look).addScaledVector(tmp, dist); camera.position.y -= cy * 0.5;
  camera.lookAt(look);
  const p = state.p, holding = state.holding, lvl = state.done ? 1 : p;
  flash = Math.max(0, flash - 2.2 * dt);
  const pulse = holding ? 0.5 + 0.5 * Math.sin(t / 45) : 0;
  /* the whole scene's emissive intensity rises while the lever is held */
  const glow = 2.0 + 2.4 * lvl + 0.8 * pulse + 4 * flash;
  neon.emissiveIntensity = glow; neonStrip.emissiveIntensity = glow * (0.6 + 0.4 * lvl); neonWheel.emissiveIntensity = glow * 0.8;
  pumpLights.forEach(o => { o.material.emissiveIntensity = glow * 1.4; });
  if (modelLight) modelLight.intensity = 3 + 8 * lvl + 8 * flash;
  pumpLight.intensity = 2.5 + 7 * lvl + 6 * flash + 2 * pulse;
  flareMat.opacity = 0.3 + 0.45 * lvl + 0.25 * pulse + 0.5 * flash; flare.scale.setScalar(1.6 + 1.2 * lvl + 0.6 * pulse + 1.5 * flash);
  pool.material.opacity = 0.22 + 0.35 * lvl + 0.2 * flash;
  if (holding) flowTex.offset.x -= 1.8 * dt;
  pulseA += ((holding ? 1 : 0) - pulseA) * Math.min(1, 4 * dt);
  hoseMat.emissiveIntensity = 3 * pulseA; haloMat.opacity = 0.55 * pulseA;
  if (holding) pulseOff = (pulseOff + 0.5 * dt) % 1;
  pulseMat.opacity = 0.95 * pulseA;
  pulses.forEach((sp, i) => { hoseCurve.getPointAt((i / pulses.length + pulseOff) % 1, sp.position); });
  const lit = Math.round(lvl * segs.length);
  segs.forEach((b, i) => { b.material.emissiveIntensity = i < lit ? 2.6 + (holding && i === lit - 1 ? 2 * pulse : 0) + 3 * flash : 0.12; });
  const amp = holding ? 0.04 * p : 0;
  root.position.set(rootBase.x + (Math.random() - 0.5) * amp, rootBase.y + (Math.random() - 0.5) * amp, rootBase.z);
  exhaust.scale.setScalar(0.4 + 1.5 * lvl + (holding ? Math.random() * 0.25 : 0) + flash);
  exhaust.material.opacity = 0.1 + 0.55 * lvl;
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.__rig = {
  update(s) {
    if (s.done && !state.done) flash = 1;
    Object.assign(state, s);
    const c = new THREE.Color(s.col === '#00C805' ? NEON : s.col);
    [neon, neonStrip, neonWheel, hoseMat].forEach(m => { m.emissive.copy(c); if (m !== hoseMat) m.color.copy(c); });
    pumpLights.forEach(o => { o.material.color.copy(c); o.material.emissive.copy(c); });
    [haloMat, pulseMat, flareMat, pool.material, exhaust.material].forEach(m => m.color.copy(c));
    pumpLight.color.copy(c); if (modelLight) modelLight.color.copy(c);
    segs.forEach(b => b.material.emissive.copy(c));
    drawScreen(s.gwei, s.col, s.p);
  }
};
drawScreen(20, '#00C805', 0);
if (window.__pumpRender) window.__pumpRender();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (window.__pumpRender) window.__pumpRender(); });
})();
