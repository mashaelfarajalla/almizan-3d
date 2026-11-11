/* Procedural 3D legal objects for the practice-area showcase.
   Every model takes a `mats` library (see materials.js) so the showcase can
   fade it as one piece. Each model's top-level parts are what the showcase
   "assembles" during a transition, so keep meaningful parts at the top level. */
import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { canvasTexture, DISPLAY_FONT } from './materials.js';

const PI = Math.PI;
const V2 = (x, y) => new THREE.Vector2(x, y);

/* radial displacement helpers: flutes (columns) and scallops (wax seal) */
function radialWave(geo, count, amp, power = 1) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-4) continue;
    const a = Math.atan2(z, x);
    const w = Math.pow(Math.max(0, Math.cos(a * count)), power);
    const k = 1 + amp * w;
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------ Mini scales */
/* a small emblem used on the shield and the courthouse pediment */
export function MiniScales({ mats, ...props }) {
  const panMat = useMemo(() => mats.make('gold', { side: THREE.DoubleSide }), [mats]);
  return (
    <group {...props}>
      <mesh material={mats.gold} position={[0, 0.04, 0]}><cylinderGeometry args={[0.26, 0.32, 0.08, 32]} /></mesh>
      <mesh material={mats.gold} position={[0, 0.58, 0]}><cylinderGeometry args={[0.028, 0.04, 1.04, 16]} /></mesh>
      <mesh material={mats.gold} position={[0, 1.15, 0]}><sphereGeometry args={[0.075, 20, 20]} /></mesh>
      <mesh material={mats.gold} position={[0, 1.0, 0]} rotation={[0, 0, PI / 2]}><cylinderGeometry args={[0.022, 0.022, 1.32, 12]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.62, 1.0, 0]}>
          {[-1, 1].map((k) => (
            <mesh key={k} material={mats.goldSatin} position={[k * 0.1, -0.2, 0]} rotation={[0, 0, k * 0.46]}>
              <cylinderGeometry args={[0.008, 0.008, 0.45, 6]} />
            </mesh>
          ))}
          <mesh material={panMat} position={[0, -0.4, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.22, 24, 12, 0, PI * 2, PI / 2, PI / 2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ Gavel */
export function Gavel({ mats }) {
  const handle = useMemo(() => new THREE.LatheGeometry([
    V2(0, 0), V2(0.115, 0), V2(0.115, 0.12), V2(0.15, 0.17), V2(0.15, 0.32), V2(0.118, 0.37),
    V2(0.1, 0.55), V2(0.098, 1.5), V2(0.118, 2.2), V2(0.158, 2.55), V2(0.17, 2.7), V2(0.152, 2.84),
    V2(0.085, 2.93), V2(0, 2.95),
  ], 40), []);

  return (
    <group>
      {/* sound block */}
      <mesh material={mats.woodDark} position={[0, -2.18, 0]}><cylinderGeometry args={[1.5, 1.6, 0.44, 72]} /></mesh>
      <mesh material={mats.gold} position={[0, -1.97, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[1.47, 0.03, 12, 120]} /></mesh>
      <mesh material={mats.wood} position={[0, -1.86, 0]}><cylinderGeometry args={[1.2, 1.32, 0.2, 72]} /></mesh>
      <mesh material={mats.goldSatin} position={[0, -1.76, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[1.19, 0.018, 10, 120]} /></mesh>

      {/* the gavel, hovering above the block */}
      <group position={[-0.6, 0.15, 0.2]} rotation={[0.12, -0.5, -0.42]} scale={1.15}>
        <mesh material={mats.wood}><cylinderGeometry args={[0.4, 0.4, 1.3, 48]} /></mesh>
        <mesh material={mats.gold}><cylinderGeometry args={[0.43, 0.43, 0.46, 48]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={mats.goldSatin} position={[0, s * 0.31, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.415, 0.016, 8, 64]} /></mesh>
            <mesh material={mats.woodDark} position={[0, s * 0.74, 0]}><cylinderGeometry args={[0.47, 0.47, 0.2, 48]} /></mesh>
            <mesh material={mats.wood} position={[0, s * 0.89, 0]}><cylinderGeometry args={s > 0 ? [0.36, 0.43, 0.12, 48] : [0.43, 0.36, 0.12, 48]} /></mesh>
          </group>
        ))}
        <mesh geometry={handle} material={mats.wood} position={[0.36, 0, 0]} rotation={[0, 0, -PI / 2]} />
        <mesh material={mats.gold} position={[0.8, 0, 0]} rotation={[0, PI / 2, 0]}><torusGeometry args={[0.112, 0.024, 10, 40]} /></mesh>
        <mesh material={mats.gold} position={[2.86, 0, 0]} rotation={[0, PI / 2, 0]}><torusGeometry args={[0.165, 0.02, 10, 40]} /></mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ Books */
function useTitleTexture(text) {
  return useMemo(() => canvasTexture(512, 160, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 104px ${DISPLAY_FONT}`;
    g.fillText(text, w / 2, h / 2 + 6);
  }), [text]);
}

/* flat gold decals face the camera, so a pure mirror would only reflect darkness:
   a slightly diffuse, faintly emissive foil reads as gold leaf from every angle */
const FOIL = { metalness: 0.75, roughness: 0.3, emissive: 0x6a4810, emissiveIntensity: 0.45 };

function Book({ mats, cover, w, h, d, title, ribbon, ...props }) {
  const tex = useTitleTexture('القانون');
  const foil = useMemo(() => mats.make('gold', FOIL), [mats]);
  const titleMat = useMemo(() => (title ? mats.make('gold', { ...FOIL, map: tex, emissiveMap: tex, alphaTest: 0.45, color: 0xe8c063 }) : null), [mats, tex, title]);
  const bands = [0.3, 0.44];
  return (
    <group {...props}>
      <mesh material={mats.pages} position={[0.03, 0, -0.03]}><boxGeometry args={[w - 0.08, h - 0.1, d - 0.1]} /></mesh>
      <RoundedBox args={[w + 0.06, 0.07, d + 0.04]} radius={0.025} smoothness={3} material={cover} position={[0, h / 2 - 0.035, 0]} />
      <RoundedBox args={[w + 0.06, 0.07, d + 0.04]} radius={0.025} smoothness={3} material={cover} position={[0, -h / 2 + 0.035, 0]} />
      {/* spine, facing the camera */}
      <RoundedBox args={[w + 0.06, h, 0.18]} radius={0.07} smoothness={4} material={cover} position={[0, 0, d / 2 - 0.05]} />
      {[-1, 1].flatMap((s) => bands.map((o) => (
        <mesh key={`${s}${o}`} material={foil} position={[s * (w / 2 - o), 0, d / 2 + 0.045]}>
          <boxGeometry args={[0.05, h - 0.1, 0.02]} />
        </mesh>
      )))}
      {titleMat && (
        <mesh material={titleMat} position={[0, -0.01, d / 2 + 0.042]}>
          <planeGeometry args={[h * 1.9, h * 0.6]} />
        </mesh>
      )}
      {ribbon && (
        <mesh material={mats.goldSatin} position={[w / 2 + 0.01, -h / 2 - 0.2, d / 2 - 0.55]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.012, 0.62, 0.14]} />
        </mesh>
      )}
    </group>
  );
}

export function Books({ mats }) {
  return (
    <group rotation={[0.08, -0.55, 0]}>
      <Book mats={mats} cover={mats.leather} w={3.7} h={0.84} d={2.5} title ribbon position={[0, -1.98, 0]} />
      <Book mats={mats} cover={mats.leather2} w={3.2} h={0.7} d={2.2} position={[-0.14, -1.2, -0.1]} rotation={[0, 0.1, 0]} />
      <Book mats={mats} cover={mats.leather} w={2.7} h={0.52} d={1.9} position={[0.08, -0.59, -0.05]} rotation={[0, -0.14, 0]} />
      <MiniScales mats={mats} position={[0.25, -0.33, 0.1]} rotation={[0, -0.3, 0]} scale={1.15} />
    </group>
  );
}

/* ------------------------------------------------------------ Courthouse */
export function Courthouse({ mats }) {
  const geo = useMemo(() => {
    const shaft = radialWave(new THREE.CylinderGeometry(0.15, 0.165, 2.05, 64, 1), 12, -0.07, 3);
    const tri = (w, hgt) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, hgt); s.closePath();
      return s;
    };
    const pediment = new THREE.ExtrudeGeometry(tri(4.5, 1.0), { depth: 2.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    const tympanum = new THREE.ExtrudeGeometry(tri(3.5, 0.72), { depth: 0.04, bevelEnabled: false });
    return { shaft, pediment, tympanum };
  }, []);
  const cols = [-1.8, -1.08, -0.36, 0.36, 1.08, 1.8];

  return (
    <group>
      {/* stepped stylobate */}
      <mesh material={mats.marble} position={[0, -2.31, 0]}><boxGeometry args={[5.1, 0.18, 3.3]} /></mesh>
      <mesh material={mats.marble} position={[0, -2.13, 0.02]}><boxGeometry args={[4.8, 0.18, 3.05]} /></mesh>
      <mesh material={mats.marble} position={[0, -1.95, 0.04]}><boxGeometry args={[4.5, 0.18, 2.8]} /></mesh>
      <mesh material={mats.gold} position={[0, -1.855, 1.445]}><boxGeometry args={[4.5, 0.025, 0.02]} /></mesh>

      {/* cella with the door */}
      <group>
        <mesh material={mats.slate} position={[0, -0.72, -0.3]}><boxGeometry args={[3.3, 2.3, 1.7]} /></mesh>
        <mesh material={mats.marble} position={[0, -1.1, 0.56]}><boxGeometry args={[1.12, 1.56, 0.06]} /></mesh>
        <mesh material={mats.wood} position={[0, -1.17, 0.6]}><boxGeometry args={[0.86, 1.36, 0.05]} /></mesh>
        <mesh material={mats.gold} position={[0, -1.17, 0.63]}><boxGeometry args={[0.02, 1.36, 0.01]} /></mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={mats.gold} position={[s * 0.08, -1.2, 0.64]}><sphereGeometry args={[0.035, 12, 12]} /></mesh>
        ))}
      </group>

      {/* colonnade */}
      {cols.map((x) => (
        <group key={x} position={[x, -1.86, 1.05]}>
          <mesh material={mats.marble} position={[0, 0.05, 0]}><boxGeometry args={[0.44, 0.1, 0.44]} /></mesh>
          <mesh material={mats.gold} position={[0, 0.13, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.175, 0.03, 10, 40]} /></mesh>
          <mesh geometry={geo.shaft} material={mats.marble} position={[0, 1.15, 0]} />
          <mesh material={mats.gold} position={[0, 2.2, 0]}><cylinderGeometry args={[0.21, 0.16, 0.1, 40]} /></mesh>
          <mesh material={mats.marble} position={[0, 2.29, 0]}><boxGeometry args={[0.46, 0.08, 0.46]} /></mesh>
        </group>
      ))}

      {/* entablature + pediment */}
      <mesh material={mats.marble} position={[0, 0.66, 0.05]}><boxGeometry args={[4.4, 0.36, 2.5]} /></mesh>
      <mesh material={mats.gold} position={[0, 0.53, 1.305]}><boxGeometry args={[4.4, 0.03, 0.02]} /></mesh>
      <mesh material={mats.marble} position={[0, 0.88, 0.05]}><boxGeometry args={[4.6, 0.08, 2.6]} /></mesh>
      <mesh geometry={geo.pediment} material={mats.marble} position={[0, 0.92, -1.15]} />
      <mesh geometry={geo.tympanum} material={mats.slate} position={[0, 1.04, 1.165]} />
      <MiniScales mats={mats} position={[0, 1.08, 1.22]} scale={0.42} />
    </group>
  );
}

/* ------------------------------------------------------------ Shield */
function shieldShape(k = 1) {
  const s = new THREE.Shape();
  s.moveTo(0, 1.84 * k);
  s.quadraticCurveTo(0.8 * k, 1.5 * k, 1.56 * k, 1.78 * k);
  s.bezierCurveTo(1.62 * k, 0.3 * k, 1.25 * k, -1.05 * k, 0, -2.05 * k);
  s.bezierCurveTo(-1.25 * k, -1.05 * k, -1.62 * k, 0.3 * k, -1.56 * k, 1.78 * k);
  s.quadraticCurveTo(-0.8 * k, 1.5 * k, 0, 1.84 * k);
  return s;
}

export function Shield({ mats }) {
  const geo = useMemo(() => {
    const rim = shieldShape(1);
    rim.holes.push(new THREE.Path(shieldShape(0.86).getPoints(80).reverse()));
    const bevel = { bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.08, bevelSegments: 5, curveSegments: 64 };
    return {
      rim: new THREE.ExtrudeGeometry(rim, { depth: 0.32, ...bevel }),
      face: new THREE.ExtrudeGeometry(shieldShape(0.88), { depth: 0.2, ...bevel, bevelSize: 0.03, bevelThickness: 0.04 }),
      leaf: new THREE.SphereGeometry(1, 16, 10),
    };
  }, []);

  const leaves = useMemo(() => {
    const out = [];
    for (const s of [-1, 1]) {
      for (let k = 0; k < 8; k++) {
        const t = k / 7;
        const a = -PI / 2 - s * (0.32 + t * 1.05); // sweep up and outwards from the base
        const r = 1.0 + (k % 2 ? 0.07 : -0.07);
        out.push({
          key: `${s}${k}`,
          position: [Math.cos(a) * r, -0.05 + Math.sin(a) * r, 0.32],
          rotation: [0, 0, a + (k % 2 ? 0.5 : -0.5) * s],
          scale: [0.052 - t * 0.01, 0.135 - t * 0.025, 0.028],
        });
      }
    }
    return out;
  }, []);

  const face = useMemo(() => mats.make('slate', { color: 0x1f2738, metalness: 0.55, roughness: 0.28 }), [mats]);
  return (
    <group rotation={[-0.08, 0.22, 0]}>
      <mesh geometry={geo.face} material={face} position={[0, 0, 0.02]} />
      <mesh geometry={geo.rim} material={mats.gold} />
      <MiniScales mats={mats} position={[0, -0.55, 0.3]} scale={1.05} />
      <group>
        {leaves.map((l) => <mesh key={l.key} geometry={geo.leaf} material={mats.goldSatin} position={l.position} rotation={l.rotation} scale={l.scale} />)}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ Contract */
function usePaperTexture() {
  return useMemo(() => canvasTexture(1024, 1372, (g, w, h) => {
    const bg = g.createRadialGradient(w / 2, h * 0.45, 100, w / 2, h / 2, h * 0.75);
    bg.addColorStop(0, '#f7f0df');
    bg.addColorStop(1, '#e6dac0');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.fillStyle = '#23252b';
    g.font = `700 92px ${DISPLAY_FONT}`;
    g.fillText('عقد قانوني', w / 2, 200);
    g.fillStyle = '#b8892f';
    g.fillRect(w / 2 - 120, 246, 240, 4);
    // paragraph lines (right-aligned, RTL)
    const widths = [760, 700, 780, 540, 760, 720, 610, 760, 480];
    widths.forEach((lw, i) => {
      g.fillStyle = i % 4 === 3 ? '#cdbf9f' : '#d6cab0';
      const y = 340 + i * 74;
      g.beginPath();
      g.roundRect?.(w - 130 - lw, y, lw, 16, 8);
      if (!g.roundRect) g.rect(w - 130 - lw, y, lw, 16);
      g.fill();
    });
    // signature
    g.strokeStyle = '#2d3350';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(150, 1150);
    g.bezierCurveTo(190, 1040, 230, 1210, 270, 1130);
    g.bezierCurveTo(300, 1070, 320, 1170, 360, 1140);
    g.bezierCurveTo(400, 1110, 430, 1150, 520, 1120);
    g.stroke();
    g.fillStyle = '#a3977d';
    g.fillRect(130, 1190, 420, 3);
    g.font = `500 34px ${DISPLAY_FONT}`;
    g.fillText('التوقيع', 340, 1250);
  }), []);
}

export function Contract({ mats }) {
  const tex = usePaperTexture();
  const geo = useMemo(() => ({
    seal: radialWave(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 96, 1), 18, 0.08, 2),
  }), []);
  const paperMat = useMemo(() => mats.make('paper', { map: tex, color: 0xffffff }), [mats, tex]);

  return (
    <group rotation={[-0.16, 0.22, 0.03]}>
      {/* clipboard */}
      <RoundedBox args={[2.75, 3.65, 0.12]} radius={0.09} smoothness={4} material={mats.slate} />
      {/* paper sheets */}
      <group>
        <mesh material={mats.pages} position={[0.05, -0.17, 0.068]} rotation={[0, 0, -0.025]}><boxGeometry args={[2.36, 3.12, 0.012]} /></mesh>
        <mesh material={mats.paper} position={[0, -0.15, 0.08]}><boxGeometry args={[2.36, 3.14, 0.012]} /></mesh>
        <mesh material={paperMat} position={[0, -0.15, 0.0865]}><planeGeometry args={[2.36, 3.14]} /></mesh>
      </group>
      {/* clip */}
      <group position={[0, 1.66, 0.12]}>
        <RoundedBox args={[1.05, 0.36, 0.14]} radius={0.05} smoothness={3} material={mats.gold} />
        <mesh material={mats.goldSatin} position={[0, -0.1, 0.08]}><boxGeometry args={[0.7, 0.1, 0.04]} /></mesh>
        <mesh material={mats.gold} position={[0, 0.27, 0]}><torusGeometry args={[0.15, 0.04, 14, 40]} /></mesh>
      </group>
      {/* wax seal + ribbons */}
      <group position={[0.62, -1.08, 0.12]}>
        <mesh material={mats.ribbon} position={[-0.12, -0.36, -0.02]} rotation={[0, 0, 0.28]}><boxGeometry args={[0.16, 0.56, 0.01]} /></mesh>
        <mesh material={mats.ribbon} position={[0.12, -0.36, -0.02]} rotation={[0, 0, -0.28]}><boxGeometry args={[0.16, 0.56, 0.01]} /></mesh>
        <mesh geometry={geo.seal} material={mats.gold} rotation={[PI / 2, 0, 0]} />
        <mesh material={mats.goldSatin} position={[0, 0, 0.035]} rotation={[PI / 2, 0, 0]}><cylinderGeometry args={[0.24, 0.24, 0.02, 48]} /></mesh>
        <mesh material={mats.gold} position={[0, 0, 0.045]} rotation={[0, 0, 0]}><torusGeometry args={[0.24, 0.014, 8, 48]} /></mesh>
      </group>
      {/* fountain pen */}
      <group position={[1.55, -0.35, 0.42]} rotation={[0.2, 0, -0.32]}>
        <mesh material={mats.lacquer} position={[0, 0.15, 0]}><cylinderGeometry args={[0.088, 0.088, 1.5, 32]} /></mesh>
        <mesh material={mats.lacquer} position={[0, 1.18, 0]}><cylinderGeometry args={[0.08, 0.092, 0.58, 32]} /></mesh>
        <mesh material={mats.gold} position={[0, 0.9, 0]}><cylinderGeometry args={[0.095, 0.095, 0.06, 32]} /></mesh>
        <mesh material={mats.gold} position={[0, 1.47, 0]}><sphereGeometry args={[0.082, 20, 14]} /></mesh>
        <mesh material={mats.gold} position={[0, 1.2, 0.1]}><boxGeometry args={[0.035, 0.46, 0.03]} /></mesh>
        <mesh material={mats.lacquer} position={[0, -0.75, 0]}><cylinderGeometry args={[0.088, 0.064, 0.3, 32]} /></mesh>
        <mesh material={mats.gold} position={[0, -0.6, 0]}><cylinderGeometry args={[0.092, 0.092, 0.04, 32]} /></mesh>
        <mesh material={mats.gold} position={[0, -1.06, 0]} rotation={[PI, 0, 0]}><coneGeometry args={[0.064, 0.34, 32]} /></mesh>
      </group>
    </group>
  );
}
