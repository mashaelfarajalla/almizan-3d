/* R3F scene: lighting, environment, the scroll-driven rig, dust & camera. */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import Scales from './Scales.jsx';
import { rig, intro, pointer, scroll } from '../state.js';

const CAM_Z = 10;
const isSmall = matchMedia('(max-width: 768px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const { damp, degToRad } = THREE.MathUtils;

/* soft radial sprite texture */
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
const dotTex = radialTexture([[0, 'rgba(255,244,214,1)'], [0.25, 'rgba(241,215,143,.7)'], [1, 'rgba(212,169,68,0)']]);
const haloTex = radialTexture([[0, 'rgba(212,169,68,.55)'], [0.4, 'rgba(212,169,68,.15)'], [1, 'rgba(212,169,68,0)']]);
const noHit = () => null;
const additive = { blending: THREE.AdditiveBlending, depthWrite: false, transparent: true };

/* The rig composes: responsive layout × GSAP scroll pose × intro × mouse × click-spin */
function Rig({ children }) {
  const group = useRef();
  const halo = useRef();
  const floor = useRef();
  const spin = useRef({ angle: 0, vel: 0 });
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime * (reduceMotion ? 0.15 : 1);
    const { camera, size } = state;

    mouse.current.x = damp(mouse.current.x, pointer.x, 3, dt);
    mouse.current.y = damp(mouse.current.y, pointer.y, 3, dt);
    const m = mouse.current;

    const halfH = Math.tan(degToRad(camera.fov / 2)) * CAM_Z;
    const aspect = size.width / size.height;
    const halfW = halfH * aspect;
    const base = aspect >= 1 ? Math.min(1, halfH / 3.1) : Math.min(0.56, halfW / 3.4);
    const i = intro.v;

    spin.current.angle += spin.current.vel * dt;
    spin.current.vel *= Math.exp(-1.8 * dt);

    const g = group.current;
    g.position.set(
      rig.px * halfW,
      rig.py * halfH - (1 - i) * 1.2 + Math.sin(t * 0.9) * 0.08,
      0,
    );
    g.scale.setScalar(base * rig.s * (0.75 + 0.25 * i));
    g.rotation.set(
      rig.rx + m.y * 0.08,
      rig.ry + (1 - i) * -1.6 + Math.sin(t * 0.25) * 0.4 + m.x * 0.35 + spin.current.angle,
      0,
    );

    halo.current.material.opacity = (0.6 + Math.sin(t * 1.2) * 0.12) * i * rig.glow;
    floor.current.material.opacity = 0.9 * i;

    // camera parallax + scroll dolly
    camera.position.x = m.x * 0.35;
    camera.position.y = 0.3 - m.y * 0.2;
    camera.position.z = CAM_Z - rig.zoom;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group
      ref={group}
      onClick={(e) => { e.stopPropagation(); spin.current.vel += 7; }}
    >
      {children}
      <sprite ref={halo} raycast={noHit} position={[0, 0.2, -2.5]} scale={[9, 9, 1]}>
        <spriteMaterial map={haloTex} {...additive} opacity={0} />
      </sprite>
      <mesh ref={floor} raycast={noHit} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.44, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial map={haloTex} {...additive} opacity={0} />
      </mesh>
      <Orbits />
    </group>
  );
}

function Orbits() {
  const rings = useMemo(() => [
    { r: 3.0, tilt: [1.25, 0.25, 0], speed: 0.25 },
    { r: 3.45, tilt: [1.75, -0.45, 0], speed: -0.18 },
  ], []);
  const refs = useRef([]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    rings.forEach((o, k) => {
      const { g, bead } = refs.current[k];
      g.rotation.z += o.speed * Math.min(dt, 0.05);
      const a = t * o.speed * 2;
      bead.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
    });
  });
  return rings.map((o, k) => (
    <group key={k} rotation={o.tilt} raycast={noHit} ref={(g) => { refs.current[k] = { ...refs.current[k], g }; }}>
      <mesh raycast={noHit}>
        <torusGeometry args={[o.r, 0.006, 8, 200]} />
        <meshBasicMaterial color={0xd4a944} transparent opacity={0.28} />
      </mesh>
      <sprite scale={0.35} raycast={noHit} ref={(bead) => { refs.current[k] = { ...refs.current[k], bead }; }}>
        <spriteMaterial map={dotTex} {...additive} />
      </sprite>
    </group>
  ));
}

/* Gold dust — drifts up, and rushes with scroll velocity */
function Dust() {
  const COUNT = isSmall ? 450 : 1300;
  const points = useRef();
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
      speeds[i] = 0.08 + Math.random() * 0.25;
    }
    return { positions, speeds };
  }, [COUNT]);
  const boost = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05) * (reduceMotion ? 0.15 : 1);
    boost.current = damp(boost.current, Math.min(Math.abs(scroll.velocity) / 300, 6), 4, dt);
    scroll.velocity *= 0.9;
    const p = points.current.geometry.attributes.position.array;
    const k = 1 + boost.current;
    for (let i = 0; i < COUNT; i++) {
      p[i * 3 + 1] += speeds[i] * dt * k;
      if (p[i * 3 + 1] > 6) p[i * 3 + 1] = -6;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.rotation.y = state.clock.elapsedTime * 0.02 + pointer.x * 0.05;
  });

  return (
    <points ref={points} raycast={noHit}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={isSmall ? 0.07 : 0.06} map={dotTex} color={0xf1d78f} opacity={0.85} sizeAttenuation {...additive} />
    </points>
  );
}

/* Pause the render loop while the story section is off-screen */
function FrameloopToggle() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onToggle = (e) => setFrameloop(e.detail ? 'always' : 'never');
    addEventListener('webgl:active', onToggle);
    return () => removeEventListener('webgl:active', onToggle);
  }, [setFrameloop]);
  return null;
}

export default function Experience() {
  return (
    <Canvas
      eventSource={document.body}
      eventPrefix="client"
      dpr={[1, isSmall ? 1.5 : 2]}
      camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0.3, CAM_Z] }}
      gl={{ antialias: !isSmall, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
        document.getElementById('webgl').classList.add('is-on');
        document.getElementById('hero')?.classList.add('is-3d');
      }}
    >
      <FrameloopToggle />

      {/* studio lighting baked into an env map — no external HDR download */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={3} color="#ffd9a0" position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="circle" intensity={1.2} color="#6d85c9" position={[0, -5, 3]} rotation-x={Math.PI / 2} scale={8} />
      </Environment>
      <ambientLight intensity={0.15} />
      <directionalLight color={0xfff1d6} intensity={2.2} position={[4, 5, 6]} />
      <pointLight color={0xffb84d} intensity={30} distance={20} decay={2} position={[-3, 2, -3]} />
      <pointLight color={0x6d85c9} intensity={12} distance={20} decay={2} position={[4, -2, 2]} />

      <Rig>
        <Scales />
      </Rig>
      <Dust />
    </Canvas>
  );
}
