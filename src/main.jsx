import 'lenis/dist/lenis.css';
import { createRoot } from 'react-dom/client';
import Experience from './three/Experience.jsx';
import { initUI } from './ui.js';
import { initAnimations, initSmoothScroll } from './animations.js';

const lenis = initSmoothScroll();
initUI({ lenis });
initAnimations();

// Mount React Three Fiber only if WebGL is available (otherwise the CSS fallback stays)
const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
})();

if (hasWebGL) createRoot(document.getElementById('webgl')).render(<Experience />);
