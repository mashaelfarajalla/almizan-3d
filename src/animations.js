/* =========================================================
   الميزان — Motion layer: GSAP + ScrollTrigger + Lenis
   ========================================================= */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { rig, intro, scroll } from './state.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Smooth scroll (Lenis) driven by the GSAP ticker ---------- */
export function initSmoothScroll() {
  if (reduceMotion) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', (e) => { scroll.velocity = e.velocity * 60; ScrollTrigger.update(); });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* ---------- Split text into words (keeps Arabic letters joined) ---------- */
function splitWords(el) {
  const frag = document.createDocumentFragment();
  const wrap = (node) => {
    const w = document.createElement('span');
    w.className = 'word';
    const inner = document.createElement('span');
    inner.appendChild(node);
    w.appendChild(inner);
    return w;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
        frag.appendChild(wrap(document.createTextNode(word)));
        frag.appendChild(document.createTextNode(' '));
      });
    } else {
      frag.appendChild(wrap(node.cloneNode(true)));
      frag.appendChild(document.createTextNode(' '));
    }
  });
  el.textContent = '';
  el.appendChild(frag);
  return $$('.word > span', el);
}

/* ---------- Hero intro (DOM + 3D together) ---------- */
function heroIntro() {
  const words = $$('[data-split]').flatMap(splitWords);
  const play = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: reduceMotion ? 0.01 : 1.2 } });
    tl.to(intro, { v: 1, duration: reduceMotion ? 0.01 : 2.6, ease: 'power3.out' }, 0)
      // clearProps: an inline transform on the header would trap the fixed mobile drawer inside it
      .from('.header', { yPercent: -100, opacity: 0, clearProps: 'transform,opacity' }, 0.1)
      .to('.hero__eyebrow', { opacity: 1, y: 0 }, 0.2)
      .to(words, { y: 0, rotation: 0, opacity: 1, stagger: 0.07 }, 0.35)
      .to('.hero__lead', { opacity: 1, y: 0 }, 0.9)
      .to('.hero__actions', { opacity: 1, y: 0 }, 1.05)
      .to('.hero__badges', { opacity: 1, y: 0 }, 1.2)
      .from('.scroll-hint', { opacity: 0, y: 20 }, 1.4);
  };
  if (window.__siteReady) play();
  else addEventListener('site:ready', play, { once: true });
}

/* ---------- The 3D scroll story ----------
   One scrubbed timeline from the top of the hero to the end of the sticky
   story section. It animates `rig` (read by the R3F scene every frame)
   and the DOM chapter panels in sync.
   Timeline units: 0→1 = hero scroll, 1→4 = the three story chapters. */
function scrollStory() {
  const panels = $$('.story__panel');
  const bars = $$('.story__nav i');
  const mm = gsap.matchMedia();

  // matchMedia only runs when at least one condition matches → cover both orientations
  mm.add({ wide: '(min-aspect-ratio: 1/1)', narrow: '(max-aspect-ratio: 1/1)' }, (ctx) => {
    const { wide } = ctx.conditions;
    const TAU = Math.PI * 2;

    // poses — landscape: model on the visual left (text is on the right, RTL)
    //         portrait : model on top, text at the bottom
    const P = wide ? {
      hero: { px: -0.46, py: -0.03, s: 1, ry: 0, rx: 0, tip: 0, zoom: 0, glow: 1 },
      c1:   { px: -0.42, py: 0, s: 1.08, ry: TAU, rx: 0.05, tip: 0, zoom: 0, glow: 1.1 },
      c2:   { px: -0.45, py: -0.42, s: 1.6, ry: TAU + 0.7, rx: 0.32, tip: -0.35, zoom: 1.2, glow: 0.8 },
      c3:   { px: -0.42, py: 0.02, s: 1.12, ry: TAU - 0.35, rx: -0.04, tip: 1, zoom: 0.2, glow: 1.8 },
    } : {
      hero: { px: 0, py: 0.42, s: 1, ry: 0, rx: 0, tip: 0, zoom: 0, glow: 1 },
      c1:   { px: 0, py: 0.4, s: 1.05, ry: TAU, rx: 0.05, tip: 0, zoom: 0, glow: 1.1 },
      c2:   { px: 0, py: 0.3, s: 1.4, ry: TAU + 0.7, rx: 0.3, tip: -0.35, zoom: 0.8, glow: 0.8 },
      c3:   { px: 0, py: 0.4, s: 1.08, ry: TAU - 0.35, rx: -0.04, tip: 1, zoom: 0.2, glow: 1.8 },
    };
    gsap.set(rig, P.hero);

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        endTrigger: '#story',
        end: 'bottom bottom',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });

    // hero → chapter 1
    tl.to('.hero__content', { y: -120, autoAlpha: 0, ease: 'power1.in', duration: 0.6 }, 0)
      .to('.scroll-hint', { autoAlpha: 0, duration: 0.2 }, 0)
      .to(rig, { ...P.c1, duration: 1 }, 0)
      .fromTo(panels[0], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.65)
      .to(bars[0], { scaleX: 1, ease: 'none', duration: 0.9 }, 0.7)
    // chapter 1 → 2 (close-up on the pans)
      .to(panels[0], { autoAlpha: 0, y: -70, duration: 0.3, ease: 'power2.in' }, 1.55)
      .to(rig, { ...P.c2, duration: 0.9 }, 1.4)
      .fromTo(panels[1], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 1.9)
      .to(bars[1], { scaleX: 1, ease: 'none', duration: 0.9 }, 1.8)
    // chapter 2 → 3 (the beam tips decisively)
      .to(panels[1], { autoAlpha: 0, y: -70, duration: 0.3, ease: 'power2.in' }, 2.55)
      .to(rig, { ...P.c3, duration: 0.9 }, 2.4)
      .fromTo(panels[2], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 2.9)
      .to(bars[2], { scaleX: 1, ease: 'none', duration: 0.9 }, 2.8)
      .to({}, { duration: 0.2 }, 3.8); // hold the last chapter until the end (total = 4)

    return () => gsap.set(rig, P.hero);
  });

  // Stop rendering WebGL once the story has scrolled away (content covers it)
  ScrollTrigger.create({
    trigger: '#story',
    start: 'top top',
    end: 'bottom top',
    onLeave: () => setWebGL(false),
    onEnterBack: () => setWebGL(true),
  });
}

function setWebGL(active) {
  $('#webgl')?.classList.toggle('is-off', !active);
  dispatchEvent(new CustomEvent('webgl:active', { detail: active }));
}

/* ---------- Section reveals (batched + staggered) ---------- */
function reveals() {
  const show = (els) => gsap.to(els, {
    opacity: 1, y: 0,
    duration: reduceMotion ? 0.01 : 1.1,
    ease: 'expo.out',
    stagger: 0.09,
    overwrite: true,
    onStart() { els.forEach((el) => { el.style.transition = 'none'; }); },
    onComplete() {
      els.forEach((el) => {
        el.classList.add('is-in');
        gsap.set(el, { clearProps: 'transform,opacity,transition' });
      });
    },
  });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: show,
    onLeave: show, // fast jumps (nav links) past an element still reveal it
  });
}

/* ---------- Counters ---------- */
function counters() {
  $$('[data-count]').forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count,
      duration: reduceMotion ? 0.01 : 2.2,
      ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-US'); },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* ---------- Scrubbed effects ---------- */
function scrubbed() {
  // reading progress bar
  gsap.to('#scrollBar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // process timeline fills as you scroll through it
  gsap.fromTo('#timelineFill', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '#timeline', start: 'top 60%', end: 'bottom 60%', scrub: true },
  });

  if (reduceMotion) return;

  // parallax depth
  gsap.to('.about__quote', { yPercent: -60, ease: 'none', scrollTrigger: { trigger: '.about', scrub: true } });
}

/* ---------- Marquee that reacts to scroll velocity & direction ---------- */
function marquee() {
  const track = $('.marquee__track');
  if (!track || reduceMotion) return;
  const loop = gsap.to(track, { xPercent: 50, ease: 'none', duration: 40, repeat: -1 });
  loop.totalTime(40 * 500); // headroom so it can also run backwards when scrolling up
  let dir = 1;
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      dir = self.direction;
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 8);
      gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
    },
  });
}

export function initAnimations() {
  heroIntro();
  scrollStory();
  reveals();
  counters();
  scrubbed();
  marquee();
  // fonts/images change layout → recalc trigger positions
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
