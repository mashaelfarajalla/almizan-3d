/* Shared, mutable state between GSAP (DOM / scroll) and React Three Fiber (useFrame).
   GSAP tweens these plain objects; the 3D scene reads them every frame —
   no React re-renders involved, so it stays at 60fps. */

// Scroll-choreographed pose of the 3D scale (animated by the ScrollTrigger timeline)
export const rig = {
  px: -0.46, // x position, fraction of the viewport half-width
  py: -0.03, // y position, fraction of the viewport half-height
  s: 1,      // scale multiplier
  ry: 0,     // extra Y rotation (rad)
  rx: 0,     // extra X tilt (rad)
  tip: 0,    // beam tip: -1 … 1 (which pan is heavier)
  zoom: 0,   // camera dolly toward the model
  glow: 1,   // halo / rim light intensity
};

// Intro reveal 0 → 1 (played once after the preloader)
export const intro = { v: 0 };

// Normalised pointer (-1 … 1) and scroll velocity (px/s)
export const pointer = { x: 0, y: 0 };
export const scroll = { velocity: 0 };

addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });
