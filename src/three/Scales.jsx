/* Procedurally modelled Scale of Justice (React Three Fiber).
   Interactive (hero): hover a pan → the beam tips toward it and the pan glows;
   click → the whole scale spins with momentum (handled by the hero rig).
   The showcase reuses it with fadeable materials and `interactive={false}`. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rig, pointer } from '../state.js';
import { createMaterials } from './materials.js';

const { damp } = THREE.MathUtils;

const BEAM = 1.85;
const PIVOT_Y = 1.6;
const CHAIN_LEN = 1.55;
const PAN_R = 0.62;

const heroMats = createMaterials(null);
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const still = { tip: 0 };

function useGeometries() {
  return useMemo(() => {
    const profile = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      profile.push(new THREE.Vector2(Math.sin(t * Math.PI * 0.5) * PAN_R, -0.22 * Math.cos(t * Math.PI * 0.5)));
    }
    // three chains from the hook to the pan rim
    const up = new THREE.Vector3(0, 1, 0);
    const top = new THREE.Vector3(0, -0.05, 0);
    const chains = [0, 1, 2].map((k) => {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
      const bottom = new THREE.Vector3(Math.cos(a) * (PAN_R - 0.04), -CHAIN_LEN, Math.sin(a) * (PAN_R - 0.04));
      const dir = bottom.clone().sub(top);
      return {
        len: dir.length(),
        position: top.clone().addScaledVector(dir, 0.5),
        quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()),
      };
    });
    return {
      pan: new THREE.LatheGeometry(profile, 64),
      chain: new THREE.CylinderGeometry(0.009, 0.009, 1, 6),
      chains,
    };
  }, []);
}

function Pan({ side, geo, mats, hangerRef, onHover, interactive }) {
  const mat = useMemo(() => mats.make('gold', { side: THREE.DoubleSide, emissive: 0xd4a944, emissiveIntensity: 0 }), [mats]);
  const hot = useRef(0);

  useFrame((_, dt) => {
    mat.emissiveIntensity = damp(mat.emissiveIntensity, hot.current * 0.45, 6, dt);
  });

  return (
    <group ref={hangerRef} position={[side * BEAM, 0, 0]}>
      <mesh material={mats.gold} position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
      </mesh>
      {geo.chains.map((c, i) => (
        <mesh key={i} geometry={geo.chain} material={mats.goldSatin} position={c.position} quaternion={c.quaternion} scale={[1, c.len, 1]} />
      ))}
      <mesh geometry={geo.pan} material={mat} position={[0, -CHAIN_LEN, 0]} />
      <mesh material={mats.goldSatin} position={[0, -CHAIN_LEN, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PAN_R, 0.022, 12, 80]} />
      </mesh>
      {interactive && (
        /* generous invisible hit area: chains + pan */
        <mesh
          material={hitMat}
          position={[0, -CHAIN_LEN / 2 - 0.15, 0]}
          onPointerOver={(e) => { e.stopPropagation(); hot.current = 1; onHover(side); }}
          onPointerOut={() => { hot.current = 0; onHover(0); }}
        >
          <cylinderGeometry args={[PAN_R + 0.15, PAN_R + 0.15, CHAIN_LEN + 0.6, 16]} />
        </mesh>
      )}
    </group>
  );
}

export default function Scales({ mats = heroMats, interactive = true, tipSource = rig }) {
  const geo = useGeometries();
  const beam = useRef();
  const left = useRef();
  const right = useRef();
  const hoverSide = useRef(0);
  const hoverAmt = useRef(0);

  // `is-hot` gives a pointer (or the custom cursor's "اضغط" label) over a pan
  const onHover = (side) => {
    hoverSide.current = side || hoverSide.current;
    hoverAmt.current = side ? 1 : 0;
    document.body.classList.toggle('is-hot', !!side);
    dispatchEvent(new Event('cursor:refresh'));
  };

  const tilt = useRef(0);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const src = tipSource || still;
    // the heavier pan goes down: +x pan down ⇒ negative z rotation
    const target =
      -src.tip * 0.3 +
      -hoverSide.current * hoverAmt.current * 0.24 +
      Math.sin(t * 0.7) * 0.06 +
      pointer.x * -0.1;
    tilt.current = damp(tilt.current, target, hoverAmt.current ? 5 : 2.5, dt);
    beam.current.rotation.z = tilt.current;
    [left.current, right.current].forEach((h, i) => {
      h.rotation.z = -tilt.current + Math.sin(t * 1.3 + i * 1.7) * 0.025; // pans hang plumb
      h.rotation.x = Math.cos(t * 1.1 + i) * 0.02;
    });
  });

  return (
    <group>
      {/* stepped plinth */}
      <mesh material={mats.obsidian} position={[0, -2.32, 0]}><cylinderGeometry args={[1.25, 1.4, 0.22, 64]} /></mesh>
      <mesh material={mats.gold} position={[0, -2.2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.3, 0.035, 16, 100]} /></mesh>
      <mesh material={mats.goldSatin} position={[0, -2.1, 0]}><cylinderGeometry args={[0.85, 1.05, 0.2, 64]} /></mesh>
      <mesh material={mats.gold} position={[0, -1.86, 0]}><cylinderGeometry args={[0.42, 0.6, 0.28, 48]} /></mesh>

      {/* column + collars */}
      <mesh material={mats.gold} position={[0, -0.07, 0]}><cylinderGeometry args={[0.075, 0.11, 3.3, 32]} /></mesh>
      {[-1.55, -0.6, 0.6].map((y, i) => (
        <mesh key={y} material={mats.goldSatin} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[i === 0 ? 0.16 : 0.12, 0.035, 12, 48]} />
        </mesh>
      ))}
      <mesh material={mats.gold}><sphereGeometry args={[0.17, 32, 32]} /></mesh>

      {/* pivot + finial */}
      <mesh material={mats.gold} position={[0, PIVOT_Y + 0.25, 0]}><sphereGeometry args={[0.16, 32, 32]} /></mesh>
      <mesh material={mats.gold} position={[0, PIVOT_Y + 0.52, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.07, 0.32, 24]} /></mesh>

      {/* beam */}
      <group ref={beam} position={[0, PIVOT_Y, 0]}>
        <mesh material={mats.gold} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, BEAM * 2, 24]} /></mesh>
        <mesh material={mats.goldSatin}><sphereGeometry args={[0.12, 32, 32]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={mats.goldSatin} position={[s * 0.75, 0, 0]} rotation={[0, 0, Math.PI]} scale={[1, 0.5, 1]}>
              <torusGeometry args={[0.42, 0.022, 10, 48, Math.PI]} />
            </mesh>
            <mesh material={mats.gold} position={[s * BEAM, 0, 0]}><sphereGeometry args={[0.065, 20, 20]} /></mesh>
          </group>
        ))}
        <Pan side={-1} geo={geo} mats={mats} hangerRef={left} onHover={onHover} interactive={interactive} />
        <Pan side={1} geo={geo} mats={mats} hangerRef={right} onHover={onHover} interactive={interactive} />
      </group>
    </group>
  );
}
