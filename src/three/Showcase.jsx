/* Practice-area showcase scene (React Three Fiber).
   Six procedural legal objects share one stage. The GSAP controller
   (src/showcase/) tweens `show.items[i]` and the light colours; this scene
   only reads that state every frame — exactly like the Flora flower stage. */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { show } from '../showcase/state.js';
import { AREAS } from '../showcase/data.js';
import { createMaterials } from './materials.js';
import Scales from './Scales.jsx';
import { Gavel, Books, Courthouse, Shield, Contract } from './models.jsx';

const MODELS = {
  contract: Contract,
  courthouse: Courthouse,
  gavel: Gavel,
  books: Books,
  shield: Shield,
  scales: (p) => <Scales {...p} interactive={false} tipSource={null} />,
};

const FIT_W = 5.2;   // every model is normalised to fit this box (world units)
const FIT_H = 4.6;
const CAM_Z = 13;
const isSmall = matchMedia('(max-width: 820px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const { clamp, lerp, degToRad } = THREE.MathUtils;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const additive = { blending: THREE.AdditiveBlending, depthWrite: false, transparent: true };

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = radialTexture([[0, 'rgba(255,255,255,.55)'], [0.4, 'rgba(255,255,255,.14)'], [1, 'rgba(255,255,255,0)']]);
const dotTex = radialTexture([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);

/* ------------------------------------------------------------ one object */
function Item({ index, model }) {
  const Model = MODELS[model];
  const uFade = useMemo(() => ({ value: 0 }), []);
  const mats = useMemo(() => createMaterials(uFade), [uFade]);
  const root = useRef();
  const tilt = useRef();
  const fit = useRef();
  const asm = useRef();
  const parts = useRef([]);

  // Normalise size/centre, then record each part's rest pose for the assembly animation.
  useLayoutEffect(() => {
    const a = asm.current;
    fit.current.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(a, true).applyMatrix4(fit.current.matrixWorld.clone().invert());
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    fit.current.scale.setScalar(Math.min(FIT_W / size.x, FIT_H / size.y));
    a.position.set(-c.x, -c.y, -c.z);

    let host = a;
    while (host.children.length === 1 && host.children[0].isGroup) host = host.children[0];
    const n = host.children.length;
    parts.current = host.children.map((o, k) => {
      const dir = o.position.clone().sub(c);
      if (dir.lengthSq() < 1e-3) dir.set(0, k % 2 ? 1 : -1, 0);
      dir.normalize();
      dir.y += 0.35;
      return {
        o,
        p: o.position.clone(),
        ry: o.rotation.y,
        off: dir.multiplyScalar(0.9 + (k % 3) * 0.45),
        spin: (k % 2 ? 1 : -1) * (0.35 + (k % 3) * 0.2),
        delay: (k / Math.max(1, n - 1)) * 0.45,
      };
    });
    root.current.userData.showItem = true;
  }, []);

  useFrame((state) => {
    const it = show.items[index];
    const live = it.fade > 0.002;
    root.current.visible = live;
    if (!live) return;
    const t = state.clock.elapsedTime * (reduceMotion ? 0.2 : 1);
    uFade.value = it.fade;
    root.current.position.set(it.x, it.y, it.z);
    root.current.scale.setScalar(it.s);
    root.current.rotation.y = it.ry;
    tilt.current.rotation.set(show.rot.x, show.rot.y + Math.sin(t * 0.3 + index) * 0.12, Math.sin(t * 0.5 + index) * 0.02);
    tilt.current.position.y = Math.sin(t * 0.8 + index * 2) * 0.06;

    const o = it.open;
    for (const P of parts.current) {
      const q = 1 - easeOut(clamp((o - P.delay) / 0.55, 0, 1));
      P.o.position.set(P.p.x + P.off.x * q, P.p.y + P.off.y * q, P.p.z + P.off.z * q);
      P.o.rotation.y = P.ry + P.spin * q;
    }
  });

  return (
    <group ref={root} visible={false}>
      <group ref={tilt}>
        <group ref={fit}>
          <group ref={asm}>
            <Model mats={mats} />
          </group>
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ stage */
function Stage() {
  const world = useRef();
  const key = useRef();
  const fill = useRef();
  const rim = useRef();
  const halo = useRef();
  const floor = useRef();
  const dust = useRef();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const cam = useRef({ x: 0, y: 0 });
  const v = useMemo(() => new THREE.Vector3(), []);

  const dustData = useMemo(() => {
    const N = isSmall ? 90 : 160;
    const pos = new Float32Array(N * 3);
    const speed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = -5 + Math.random() * 7;
      speed[i] = 0.05 + Math.random() * 0.14;
    }
    return { N, pos, speed };
  }, []);

  // responsive framing: model in the middle column on desktop, centred on mobile
  useLayoutEffect(() => {
    const vh = 2 * CAM_Z * Math.tan(degToRad(camera.fov / 2));
    const vw = vh * (size.width / size.height);
    const desktop = size.width > 820;
    const diameter = desktop ? Math.min(vh * 0.62, vw * 0.34) : Math.min(vh * 0.62, vw * 0.7);
    const scale = diameter / FIT_W;
    world.current.scale.setScalar(scale);
    world.current.position.y = desktop ? vh * 0.015 : -vh * 0.01;
    show.layout.travel = (vw * (desktop ? 0.27 : 0.45)) / scale;
    show.layout.radiusPx = ((diameter / 2) / vh) * size.height;
  }, [size, camera]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const k = 1 - Math.pow(0.0025, dt); // frame-rate independent smoothing
    const P = show.pointer;
    show.rot.y = lerp(show.rot.y, P.x * 0.34 + show.drag.y, k);
    show.rot.x = lerp(show.rot.x, -P.y * 0.16 + show.drag.x, k);
    cam.current.x = lerp(cam.current.x, P.x * 0.3, k * 0.6);
    cam.current.y = lerp(cam.current.y, P.y * 0.18, k * 0.6);
    camera.position.set(cam.current.x, cam.current.y, CAM_Z);
    camera.lookAt(0, 0, 0);

    const L = show.light;
    key.current.color.copy(L.key);
    rim.current.color.copy(L.rim);
    fill.current.color.copy(L.fill);
    const vis = Math.max(...show.items.map((it) => it.fade));
    halo.current.material.color.copy(L.accent);
    halo.current.material.opacity = (0.5 + Math.sin(t * 1.1) * 0.08) * vis;
    floor.current.material.color.copy(L.accent);
    floor.current.material.opacity = 0.55 * vis;
    dust.current.material.color.copy(L.accent);

    const p = dust.current.geometry.attributes.position;
    const { N, speed } = dustData;
    for (let i = 0; i < N; i++) {
      let y = p.getY(i) + speed[i] * dt * (reduceMotion ? 0.2 : 1);
      if (y > 5) y = -5;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    dust.current.rotation.y = cam.current.x * 0.12;

    // screen-space centre of the model, for cursor hit-testing
    v.set(0, 0, 0).applyMatrix4(world.current.matrixWorld).project(camera);
    show.layout.cx = (v.x * 0.5 + 0.5) * size.width;
    show.layout.cy = (-v.y * 0.5 + 0.5) * size.height;
  });

  return (
    <>
      <directionalLight ref={key} intensity={2.6} position={[-3, 4.5, 6]} />
      <directionalLight ref={fill} intensity={0.9} position={[4, -1.5, 3]} />
      <directionalLight ref={rim} intensity={3.4} position={[2.5, 3, -5]} />
      <hemisphereLight args={['#ffffff', '#0a0a0a', 0.3]} />
      <group ref={world}>
        <sprite ref={halo} position={[0, 0.2, -3]} scale={[10, 10, 1]}>
          <spriteMaterial map={glowTex} {...additive} opacity={0} />
        </sprite>
        <mesh ref={floor} position={[0, -FIT_H / 2 - 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
          <planeGeometry args={[6.5, 6.5]} />
          <meshBasicMaterial map={glowTex} {...additive} opacity={0} />
        </mesh>
        {AREAS.map((a, i) => <Item key={a.id} index={i} model={a.model} />)}
      </group>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustData.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} map={dotTex} opacity={0.55} sizeAttenuation {...additive} />
      </points>
    </>
  );
}

/* Compile every shader in the background so the first transition never hitches.
   Items are only made visible for the synchronous part of the call (compile()
   walks visible objects); they are hidden again before the next frame, so the
   renderer never blocks on a program that is still compiling in parallel. */
function Warmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (!alive) return;
      const roots = [];
      scene.traverse((o) => { if (o.userData.showItem) roots.push(o); });
      roots.forEach((o) => { o.visible = true; });
      let pending;
      try {
        pending = gl.compileAsync ? gl.compileAsync(scene, camera) : (gl.compile(scene, camera), null);
      } catch {
        pending = null;
      }
      roots.forEach((o) => { o.visible = false; });
      try { await pending; } catch { /* fall through: shaders compile on first use */ }
      show.markReady();
    })();
    return () => { alive = false; };
  }, [gl, scene, camera]);
  return null;
}

/* Render only while the section is on screen and no overlay covers it. */
function Frameloop() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    let want = true;
    let ready = false;
    const apply = () => setFrameloop(!ready || want ? 'always' : 'never');
    const onRun = (e) => { want = e.detail; apply(); };
    show.ready.then(() => { ready = true; apply(); });
    addEventListener('show:run', onRun);
    return () => removeEventListener('show:run', onRun);
  }, [setFrameloop]);
  return null;
}

/* Adaptive resolution: drop the pixel ratio on slow GPUs to keep motion fluid. */
function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useThree((s) => s.viewport.dpr);
  const acc = useRef({ t: 0, n: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt; a.n++;
    if (a.n < 60) return;
    const avg = a.t / a.n;
    a.t = 0; a.n = 0;
    if (avg > 1 / 40 && dpr > 0.75) setDpr(Math.max(0.75, dpr - 0.25));
  });
  return null;
}

export default function Showcase() {
  return (
    <Canvas
      dpr={[1, isSmall ? 1.5 : 2]}
      camera={{ fov: 30, near: 0.1, far: 100, position: [0, 0, CAM_Z] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
        document.getElementById('showStage')?.classList.add('is-on');
      }}
    >
      <Frameloop />
      <AdaptiveDpr />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={3} color="#ffe2b8" position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="circle" intensity={1.1} color="#6d85c9" position={[0, -5, 3]} rotation-x={Math.PI / 2} scale={8} />
        {/* soft frontal softbox: gives camera-facing gold (rims, bands, lettering) something to reflect */}
        <Lightformer form="rect" intensity={0.8} color="#fff4e0" position={[3, 2.5, 9]} rotation-y={Math.PI} scale={[5, 3, 1]} />
      </Environment>
      <Stage />
      <Warmup />
    </Canvas>
  );
}
