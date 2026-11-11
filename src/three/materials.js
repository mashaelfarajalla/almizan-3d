/* Shared PBR material library for every 3D object on the site.
   `createMaterials(uFade)` patches each material so the whole object can be
   faded to transparent black in one uniform (gl_FragColor *= uFade). Because
   the canvas uses premultiplied alpha, this dissolves an opaque object into the
   page without any depth-sorting artefacts — the same trick the Flora showcase
   uses for its flowers. Pass `null` to get plain (unpatched) materials. */
import * as THREE from 'three';

export const SPECS = {
  gold:      { color: 0xd9ae4b, metalness: 1, roughness: 0.18 },
  goldSatin: { color: 0xb98d34, metalness: 1, roughness: 0.36 },
  obsidian:  { color: 0x0d0f15, metalness: 0.6, roughness: 0.16 },
  wood:      { physical: true, color: 0x5b2a16, roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.2 },
  woodDark:  { physical: true, color: 0x2f1409, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.28 },
  leather:   { color: 0x1c2624, roughness: 0.58, metalness: 0.08 },
  leather2:  { color: 0x173a2e, roughness: 0.55, metalness: 0.08 },
  paper:     { color: 0xf3ead6, roughness: 0.88 },
  pages:     { color: 0xe6d8b6, roughness: 0.95 },
  marble:    { physical: true, color: 0xebe4d4, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.4 },
  slate:     { color: 0x151a26, roughness: 0.36, metalness: 0.4 },
  ribbon:    { color: 0x1a2236, roughness: 0.6 },
  lacquer:   { physical: true, color: 0x0b0b10, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06 },
};

export function fadeable(spec, uFade) {
  const { physical, ...params } = spec;
  const m = physical ? new THREE.MeshPhysicalMaterial(params) : new THREE.MeshStandardMaterial(params);
  if (!uFade) return m;
  m.onBeforeCompile = (s) => {
    s.uniforms.uFade = uFade;
    s.fragmentShader = 'uniform float uFade;\n' + s.fragmentShader.replace(
      '#include <dithering_fragment>',
      '#include <dithering_fragment>\ngl_FragColor *= uFade;',
    );
  };
  return m;
}

export function createMaterials(uFade = null) {
  const mats = {};
  Object.entries(SPECS).forEach(([k, s]) => { mats[k] = fadeable(s, uFade); });
  // build a variant on demand (e.g. an emissive pan, a textured sheet)
  mats.make = (base, extra = {}) => fadeable({ ...(SPECS[base] || {}), ...extra }, uFade);
  return mats;
}

/* Canvas-drawn textures — Arabic text is shaped correctly by the 2D canvas. */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const paint = () => { g.clearRect(0, 0, w, h); draw(g, w, h); };
  paint();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  // repaint once the web fonts are in, so Arabic text uses El Messiri
  document.fonts?.load(`700 64px ${DISPLAY_FONT}`).then(() => { paint(); t.needsUpdate = true; }).catch(() => {});
  return t;
}

export const DISPLAY_FONT = '"El Messiri", "IBM Plex Sans Arabic", serif';
