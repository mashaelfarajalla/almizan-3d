/* WebGL stage adapter: the cinematic choreography (intro + item-to-item
   transitions) expressed as GSAP tweens on the shared `show` state.
   The R3F scene renders whatever these tweens produce. */
import gsap from 'gsap';
import * as THREE from 'three';
import { show } from './state.js';
import { AREAS } from './data.js';

const RTL = -1; // in RTL the next item enters from the left
const { clamp } = THREE.MathUtils;

function lightTo(i, tl, at = 0, dur = 1.6) {
  const L = AREAS[i].light;
  const pairs = [[show.light.key, L.key], [show.light.rim, L.rim], [show.light.fill, L.fill], [show.light.accent, AREAS[i].accent]];
  pairs.forEach(([c, hex]) => {
    const to = new THREE.Color(hex);
    tl.to(c, { r: to.r, g: to.g, b: to.b, duration: dur, ease: 'power2.inOut' }, at);
  });
}

export const stage3d = {
  intro(i = 0) {
    const it = show.items[i];
    Object.assign(it, { fade: 0, open: 0, x: 0, y: -0.5, z: -1.4, s: 0.72, ry: 0.7 });
    return gsap.timeline()
      .to(it, { fade: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to(it, { open: 1, duration: 2.6, ease: 'power3.out' }, 0.1)
      .to(it, { x: 0, y: 0, z: 0, s: 1, duration: 2.4, ease: 'expo.out' }, 0)
      .to(it, { ry: 0, duration: 2.6, ease: 'power3.out' }, 0);
  },

  transition(from, to, dir) {
    const A = show.items[from];
    const B = show.items[to];
    const T = show.layout.travel;
    const sx = dir * RTL;
    gsap.killTweensOf([A, B]);
    const tl = gsap.timeline();

    // outgoing: drifts away, shrinks, comes apart and dims to black
    tl.to(A, { x: -sx * T, y: -0.45, z: -1.6, s: 0.5, duration: 1.5, ease: 'power3.inOut' }, 0)
      .to(A, { ry: -sx * 0.75, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(A, { open: 0.4, duration: 1.3, ease: 'power2.in' }, 0)
      .to(A, { fade: 0, duration: 0.95, ease: 'power2.in' }, 0.1);

    // incoming: enters from the other side as an exploded view, then assembles
    Object.assign(B, { x: sx * T, y: -0.35, z: -1.6, s: 0.45, ry: sx * 0.85, open: 0.08, fade: 0 });
    tl.to(B, { x: 0, y: 0, z: 0, s: 1, duration: 1.8, ease: 'expo.out' }, 0.45)
      .to(B, { ry: 0, duration: 2.1, ease: 'power3.out' }, 0.45)
      .to(B, { fade: 1, duration: 1.1, ease: 'power2.out' }, 0.45)
      .to(B, { open: 1, duration: 2.2, ease: 'power3.out' }, 0.5);

    lightTo(to, tl, 0.2);
    return tl;
  },

  setPointer(nx, ny) { show.pointer.x = nx; show.pointer.y = ny; },
  dragBy(dx, dy) {
    show.drag.y = clamp(show.drag.y + dx * 0.006, -1.2, 1.2);
    show.drag.x = clamp(show.drag.x + dy * 0.004, -0.6, 0.6);
  },
  release() { gsap.to(show.drag, { x: 0, y: 0, duration: 1.6, ease: 'elastic.out(1, 0.55)' }); },
  isOver(cx, cy, rect) {
    const L = show.layout;
    return Math.hypot(cx - rect.left - L.cx, cy - rect.top - L.cy) < L.radiusPx * 1.05;
  },
  pause(v) { show.flags.paused = v; show.updateRun(); },
};
