# الميزان — Interactive 3D Law-Firm Website

**Live:** https://mashaelfarajalla.github.io/almizan-3d/

An Arabic (RTL) landing page for a law firm, built around an interactive 3D Scale of Justice
that is choreographed by scroll and reacts to the user's pointer.

## Stack
- **React Three Fiber** + **Three.js / WebGL** — procedurally modelled golden scale, studio lighting via drei `Environment` + `Lightformer` (no external HDR)
- **GSAP + ScrollTrigger** — one scrubbed timeline drives the 3D pose (position, rotation, zoom, beam tip) and the chapter panels together
- **Lenis** — smooth scrolling synced with the GSAP ticker
- **Vite** — build tooling

## Interactions
- Scroll: the scale travels from the hero into a sticky 3-chapter story (spin → close-up on the pans → the beam tips)
- Hover a pan: the beam tips toward it and the pan glows · Click: the scale spins with momentum
- Mouse parallax on the model and camera; gold dust accelerates with scroll velocity
- GSAP reveals, split-word hero title, counters, scrubbed timeline fill, velocity-reactive marquee
- Responsive poses for portrait/landscape; WebGL render loop pauses once the 3D section is off-screen

## Structure
```
index.html              page markup
assets/css/style.css    styles
assets/img/             images
src/main.jsx            entry: Lenis, UI, animations, mounts the R3F canvas
src/animations.js       GSAP + ScrollTrigger choreography
src/state.js            shared mutable state between GSAP and R3F
src/ui.js               menu, tilt cards, slider, form
src/three/Experience.jsx  Canvas, lights, rig, dust, camera
src/three/Scales.jsx      the 3D scale model + hover/click interaction
```

## Scripts
```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run deploy    # build and publish dist/ to the gh-pages branch (GitHub Pages)
```
