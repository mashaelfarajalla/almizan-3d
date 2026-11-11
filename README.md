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

### Practice-area showcase (`#practice`)
A full-screen, editorial 3D showcase of six procedurally modelled legal objects
(contract, courthouse, gavel, law books, scales, shield) — one per practice area.

| Input | Action |
|---|---|
| Mouse move | object and camera follow the pointer (parallax) |
| Drag on the object | rotate it; it springs back when released |
| Quick horizontal flick / swipe | next / previous area (RTL: flick right = next) |
| ← → keys (while the section fills the screen) | next / previous area |
| Dots, arrows, small thumbnail | jump to an area / go to the next one |
| «تفاصيل الخدمة», large thumbnail | full-screen detail dialog: services, figures, lead partner |
| «احجز استشارة في هذا المجال» | closes the dialog, pre-selects the service in the contact form and scrolls to it |
| Esc / إغلاق | close the dialog |

- Transitions: the outgoing object drifts away and comes apart while the incoming one enters as an exploded view and assembles; title words rise through a mask, panels and thumbnails wipe, lights and the UI accent re-tint per area.
- Every shader is compiled in the background (`compileAsync`); the showcase intro waits for it, so the first reveal never stutters, and the preloader never waits more than 1.8 s for it.
- Rendering runs only while the section is on screen and no dialog covers it; the pixel ratio drops automatically on slow GPUs.
- Without WebGL the same choreography runs on the cut-out images.

### Site-wide
- Preloader with real progress (fonts, page assets, 3D warm-up) and a curtain reveal.
- Custom cursor on fine pointers: labelled states («اسحب», «عرض», «التالي», «اضغط»); hidden over text fields.

## Structure
```
index.html              page markup
assets/css/style.css    styles
assets/img/             images
src/main.jsx            entry: Lenis, UI, cursor, animations, showcase, preloader; mounts both R3F canvases
src/preloader.js        real-progress preloader → fires `site:ready`
src/cursor.js           custom cursor (ring + dot, contextual labels)
src/animations.js       GSAP + ScrollTrigger choreography (hero + story)
src/state.js            shared mutable state between GSAP and the hero scene
src/ui.js               menu, tilt cards, slider, form
src/three/Experience.jsx  hero canvas: lights, rig, dust, camera
src/three/Scales.jsx      the 3D scale (hero, and reused by the showcase)
src/three/models.jsx      contract, courthouse, gavel, books, shield (+ mini scales emblem)
src/three/materials.js    shared PBR library; fadeable via one uniform; canvas-drawn Arabic textures
src/three/Showcase.jsx    showcase canvas: auto-fit, assembly animation, lights, warm-up, adaptive DPR
src/showcase/data.js      practice-area content, accents and light colours  ← edit text here
src/showcase/index.js     showcase UI orchestration (transitions, dialog, input)
src/showcase/stage3d.js   3D choreography (GSAP tweens on the shared state)
src/showcase/state.js     shared state between the showcase UI and its scene
src/showcase/fallback.js  image-based stage when WebGL is unavailable
```

## Scripts
```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run deploy    # build and publish dist/ to the gh-pages branch (GitHub Pages)
```
