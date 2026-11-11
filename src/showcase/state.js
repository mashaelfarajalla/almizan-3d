/* Shared mutable state between the showcase controller (GSAP / DOM) and the
   showcase R3F scene (useFrame). GSAP tweens these plain objects; the scene
   reads them every frame, so no React re-render ever happens during motion. */
import * as THREE from 'three';
import { AREAS } from './data.js';

let resolveReady;

export const show = {
  // per-item pose; `open` drives the exploded-view → assembled animation
  items: AREAS.map(() => ({ fade: 0, open: 0, x: 0, y: 0, z: 0, s: 1, ry: 0 })),
  pointer: { x: 0, y: 0 },
  drag: { x: 0, y: 0 },
  light: {
    key: new THREE.Color(AREAS[0].light.key),
    rim: new THREE.Color(AREAS[0].light.rim),
    fill: new THREE.Color(AREAS[0].light.fill),
    accent: new THREE.Color(AREAS[0].accent),
  },
  rot: { x: 0, y: 0 },                                  // smoothed pointer/drag rotation
  layout: { travel: 4, radiusPx: 200, cx: 0, cy: 0 }, // written by the scene on resize
  ready: new Promise((r) => { resolveReady = r; }),   // resolves once shaders are compiled
  markReady: () => resolveReady(),

  // render gating: on screen, not covered by the detail overlay, tab visible
  flags: { visible: false, paused: false },
  updateRun() {
    const run = show.flags.visible && !show.flags.paused && !document.hidden;
    dispatchEvent(new CustomEvent('show:run', { detail: run }));
  },
};
