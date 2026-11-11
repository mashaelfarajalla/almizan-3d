import 'lenis/dist/lenis.css';
import { createRoot } from 'react-dom/client';
import Experience from './three/Experience.jsx';
import Showcase from './three/Showcase.jsx';
import { initUI } from './ui.js';
import { initCursor } from './cursor.js';
import { initPreloader } from './preloader.js';
import { initAnimations, initSmoothScroll } from './animations.js';
import { initShowcase } from './showcase/index.js';
import { show } from './showcase/state.js';

// Mount React Three Fiber only if WebGL is available (otherwise the image fallbacks stay)
const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
})();

const lenis = initSmoothScroll();
initUI({ lenis });
initCursor();
initAnimations();
initShowcase({ lenis, webgl: hasWebGL });

if (hasWebGL) {
  createRoot(document.getElementById('webgl')).render(<Experience />);
  createRoot(document.getElementById('showStage')).render(<Showcase />);
}

const pageLoaded = document.readyState === 'complete'
  ? Promise.resolve()
  : new Promise((r) => addEventListener('load', r, { once: true }));
const timeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

// The showcase sits below the fold: give its shader compile a head start behind
// the curtain, but never hold the page for it (its intro waits for `show.ready`).
initPreloader([
  document.fonts?.ready,
  pageLoaded,
  hasWebGL ? timeout(show.ready, 1800) : null,
], { lenis });
