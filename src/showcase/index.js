/* =========================================================
   Practice-area showcase — UI orchestration (GSAP).
   Editorial three-column layout around a 3D stage, cinematic
   item-to-item transitions and a full-screen detail overlay.
   ========================================================= */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AREAS } from './data.js';
import { show } from './state.js';
import { stage3d } from './stage3d.js';
import { ImageStage } from './fallback.js';
import { cursor } from '../cursor.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
const N = AREAS.length;
const IMGS = import.meta.glob('../../assets/img/*.webp', { eager: true, query: '?url', import: 'default' });
const imgFor = (a) => IMGS[`../../assets/img/${a.img}.webp`];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

let index = 0;
let busy = false;
let started = false;
let detailOpen = false;
let stage;
let sec;
let lenisRef;

/* ================================================================ */
/* DOM builders                                                      */
/* ================================================================ */
function buildTitle(lines) {
  const h = document.createElement('h2');
  h.className = 'sc-title';
  h.setAttribute('aria-label', lines.join(' '));
  lines.forEach((l) => {
    const line = document.createElement('span');
    line.className = 'sc-tline';
    line.setAttribute('aria-hidden', 'true');
    l.split(' ').forEach((w, i, arr) => {
      const s = document.createElement('span');
      s.className = 'sc-tw';
      s.textContent = w;
      line.appendChild(s);
      if (i < arr.length - 1) line.appendChild(document.createTextNode(' '));
    });
    h.appendChild(line);
  });
  return h;
}

function thumbLayer(src) {
  const d = document.createElement('div');
  d.className = 'sc-thumb__layer';
  d.innerHTML = `<img src="${src}" alt="" draggable="false" decoding="async">`;
  return d;
}

function fillLeft(d) {
  $('.js-sc-eyebrow', sec).textContent = d.eyebrow;
  $('.js-sc-desc', sec).textContent = d.desc;
  $('.js-sc-meta', sec).innerHTML = d.meta.map((m) => `<div><dt>${m.k}</dt><dd>${m.v}</dd></div>`).join('');
}
function fillRight(d) {
  $('.js-sc-ptitle', sec).textContent = d.panelTitle;
  $('.js-sc-ptext', sec).textContent = d.panelText;
  $('.js-sc-quote', sec).textContent = d.quote;
}

function buildDots() {
  const wrap = $('.js-sc-dots', sec);
  wrap.innerHTML = AREAS.map((a, i) =>
    `<button class="sc-dot" type="button" role="tab" aria-label="${a.title.join(' ')}" data-i="${i}"></button>`).join('');
  $('.js-sc-total', sec).textContent = pad(N);
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('.sc-dot');
    if (b) go(+b.dataset.i);
  });
}
function updateDots(i) {
  $$('.sc-dot', sec).forEach((d, j) => {
    d.classList.toggle('is-active', j === i);
    d.setAttribute('aria-selected', String(j === i));
  });
}

function renderInitial() {
  const d = AREAS[0];
  $('.sc-title-wrap', sec).appendChild(buildTitle(d.title));
  fillLeft(d);
  fillRight(d);
  $('.js-sc-wide', sec).appendChild(thumbLayer(imgFor(d)));
  $('.js-sc-tall', sec).appendChild(thumbLayer(imgFor(AREAS[1])));
  sec.style.setProperty('--accent', d.accent);
  updateDots(0);
}

/* ================================================================ */
/* Item transition                                                   */
/* ================================================================ */
function swapThumb(tl, box, src, at, dir) {
  const old = box.querySelector('.sc-thumb__layer:last-child');
  const layer = thumbLayer(src);
  box.appendChild(layer);
  const im = layer.querySelector('img');
  // RTL: the next item wipes in from the left edge
  tl.fromTo(layer,
    { clipPath: dir > 0 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' }, at)
    .fromTo(im, { scale: 1.35, xPercent: -dir * 12 }, { scale: 1, xPercent: 0, duration: 1.7, ease: 'expo.out' }, at + 0.1);
  if (old) tl.to(old.querySelector('img'), { xPercent: dir * 18, scale: 1.08, duration: 1.3, ease: 'expo.inOut' }, at);
  tl.call(() => $$('.sc-thumb__layer', box).slice(0, -1).forEach((n) => n.remove()), null, at + 1.5);
}

function swapBlock(tl, els, fill, at) {
  tl.to(els, { y: -12, autoAlpha: 0, duration: 0.42, ease: 'power2.in', stagger: 0.04 }, at)
    .call(fill, null, at + 0.5)
    .fromTo(els, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.95, ease: 'power3.out', stagger: 0.07 }, at + 0.52);
}

function go(to, dir) {
  to = ((to % N) + N) % N;
  if (!started || busy || to === index) return;
  if (dir === undefined) dir = to > index ? 1 : -1;
  busy = true;
  const from = index;
  index = to;
  const d = AREAS[to];
  const tl = gsap.timeline({ onComplete: () => { busy = false; } });

  tl.add(stage.transition(from, to, dir), 0);
  tl.to(sec, { '--accent': d.accent, duration: 1.4, ease: 'power2.inOut' }, 0.2);

  // Title: old words slide up out of their mask, new words rise in
  const wrap = $('.sc-title-wrap', sec);
  const oldT = wrap.querySelector('.sc-title');
  const h0 = wrap.offsetHeight;
  const newT = buildTitle(d.title);
  wrap.appendChild(newT);
  gsap.set(oldT, { position: 'absolute', top: 0, insetInline: 0 });
  const h1 = newT.offsetHeight;
  tl.fromTo(wrap, { height: h0 }, { height: h1, duration: 1.1, ease: 'power3.inOut', clearProps: 'height' }, 0.25)
    .to($$('.sc-tw', oldT), { yPercent: -115, rotate: -3, duration: 0.7, ease: 'power3.in', stagger: 0.06 }, 0)
    .from($$('.sc-tw', newT), { yPercent: 115, rotate: 4, duration: 1.25, ease: 'expo.out', stagger: 0.09 }, 0.55)
    .call(() => oldT.remove(), null, 1.0);

  swapBlock(tl, [$('.sc-label', sec), $('.js-sc-desc', sec), $('.js-sc-meta', sec)], () => fillLeft(d), 0.05);
  swapBlock(tl, [$('.js-sc-ptitle', sec), $('.js-sc-ptext', sec), $('.sc-quote', sec)], () => fillRight(d), 0.15);
  swapThumb(tl, $('.js-sc-wide', sec), imgFor(d), 0.1, dir);
  swapThumb(tl, $('.js-sc-tall', sec), imgFor(AREAS[(to + 1) % N]), 0.22, dir);

  const cur = $('.js-sc-cur', sec);
  tl.to(cur, { yPercent: -dir * 60, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0)
    .call(() => { cur.textContent = pad(to + 1); }, null, 0.3)
    .fromTo(cur, { yPercent: dir * 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out' }, 0.32);
  updateDots(to);

  if (reduceMotion) tl.timeScale(1.8);
}
const next = () => go(index + 1, 1);
const prev = () => go(index - 1, -1);

/* ================================================================ */
/* Intro — plays the first time the section scrolls into view        */
/* ================================================================ */
const UI = ['.showcase__head', '.sc-label', '.js-sc-desc', '.js-sc-meta', '.sc-thumbs', '.js-sc-ptitle', '.js-sc-ptext', '.sc-quote', '.js-sc-detail', '.showcase__bottom', '.showcase__hint'];

function intro() {
  if (started) return;
  const tl = gsap.timeline({ onComplete: () => { started = true; } });
  const q = (s) => $(s, sec);
  tl.add(stage.intro(0), 0)
    .to(q('.showcase__head'), { autoAlpha: 1, duration: 1 }, 0.1)
    .to(q('.sc-label'), { autoAlpha: 1, duration: 0.8 }, 0.25)
    .to($$('.sc-tw', sec), { yPercent: 0, rotate: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09 }, 0.3)
    .fromTo([q('.js-sc-desc'), q('.js-sc-meta')], { y: 20 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', stagger: 0.1 }, 0.55)
    .fromTo(q('.sc-thumbs'), { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 1.4, ease: 'expo.inOut' }, 0.35)
    .fromTo([q('.js-sc-ptitle'), q('.js-sc-ptext'), q('.sc-quote'), q('.js-sc-detail')], { y: 20 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.75)
    .to([q('.showcase__bottom'), q('.showcase__hint')], { autoAlpha: 1, duration: 1 }, 1.1);
  // allow interaction early; the intro keeps playing underneath
  gsap.delayedCall(1.2, () => { started = true; });
  if (reduceMotion) tl.timeScale(2);
}

/* ================================================================ */
/* Detail overlay                                                    */
/* ================================================================ */
function fillDetail(i) {
  const d = AREAS[i];
  const el = $('#scDetail');
  el.style.setProperty('--accent', d.accent);
  const im = $('.js-scd-img', el);
  im.src = imgFor(d);
  im.alt = d.service;
  $('.js-scd-eyebrow', el).textContent = d.eyebrow;
  $('.scd__title', el).textContent = d.title.join(' ');
  $('.js-scd-long', el).textContent = d.details.long;
  $('.js-scd-services', el).innerHTML = d.details.services
    .map(([k, v], n) => `<li><span class="scd__num">${pad(n + 1)}</span><div><strong>${k}</strong><span>${v}</span></div></li>`).join('');
  $('.js-scd-stats', el).innerHTML = d.details.stats
    .map(([k, v]) => `<div><b dir="ltr">${k}</b><span>${v}</span></div>`).join('');
  const lead = d.meta[0];
  $('.js-scd-lead', el).innerHTML = `<span class="scd__avatar">${lead.v.replace(/^(د|أ)\.\s*/, '').split(' ').map((w) => w.replace(/^ال/, '')[0]).join(' ')}</span><div><small>${lead.k}</small><strong>${lead.v}</strong></div>`;
  $('.js-scd-count', el).textContent = `${pad(i + 1)} / ${pad(N)}`;
}

function openDetail() {
  if (detailOpen) return;
  detailOpen = true;
  const el = $('#scDetail');
  fillDetail(index);
  el.setAttribute('aria-hidden', 'false');
  el.scrollTop = 0;
  lenisRef?.stop();
  cursor.refresh();
  const items = [$('.scd__hero', el), ...$$('.scd__stats > div', el), ...$$('.scd__content > *', el)];
  gsap.timeline()
    .set(el, { visibility: 'visible' })
    .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'expo.inOut' })
    .fromTo(items, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.045 }, 0.55)
    .fromTo($('.js-scd-img', el), { scale: 1.25, rotate: -4 }, { scale: 1, rotate: 0, duration: 2, ease: 'expo.out' }, 0.3)
    .fromTo($('.scd__close', el), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.7)
    .call(() => $('.scd__close', el).focus({ preventScroll: true }), null, 0.75)
    .call(() => stage.pause(true)); // the dialog now covers the stage: stop rendering it
}

function closeDetail() {
  if (!detailOpen) return;
  detailOpen = false;
  const el = $('#scDetail');
  stage.pause(false);
  lenisRef?.start();
  cursor.refresh();
  gsap.timeline()
    .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'expo.inOut' })
    .call(() => {
      gsap.set(el, { visibility: 'hidden', clipPath: 'inset(100% 0% 0% 0%)' });
      el.setAttribute('aria-hidden', 'true');
    });
  gsap.fromTo([$('.showcase__info', sec), $('.showcase__panel', sec)], { y: 30 }, { y: 0, duration: 1.4, ease: 'expo.out', delay: 0.5 });
  $('.js-sc-detail', sec).focus({ preventScroll: true });
}

function detailStep(dir) {
  const target = (index + dir + N) % N;
  const el = $('#scDetail');
  const content = $$('.scd__content > *, .scd__media > *', el);
  gsap.timeline()
    .to(content, { autoAlpha: 0, y: -14, duration: 0.35, ease: 'power2.in', stagger: 0.02 })
    .call(() => {
      stage.pause(false);
      go(target, dir);
      fillDetail(target);
      el.scrollTo({ top: 0 });
    })
    .fromTo(content, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.04 })
    .fromTo($('.js-scd-img', el), { scale: 1.2 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, '<')
    .call(() => { if (detailOpen) stage.pause(true); }, null, '+=1.6');
}

function bookThisArea(e) {
  e.preventDefault();
  const sel = $('#contactForm select[name="service"]');
  if (sel) {
    sel.value = AREAS[index].service;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  closeDetail();
  gsap.delayedCall(0.7, () => {
    const target = $('#contact');
    if (lenisRef) lenisRef.scrollTo(target, { offset: -60, duration: 1.8 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

/* ================================================================ */
/* Input                                                             */
/* ================================================================ */
function initInput() {
  const stageEl = $('#showStage');
  const UI_SEL = 'a, button, input, select, textarea, .showcase__info, .showcase__panel, .showcase__bottom';
  let down = null;
  let inView = false;

  sec.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = sec.getBoundingClientRect();
    stage.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  }, { passive: true });
  sec.addEventListener('pointerleave', () => stage.setPointer(0, 0));

  sec.addEventListener('pointerdown', (e) => {
    if (detailOpen || e.button > 0 || e.target.closest(UI_SEL)) return;
    const onStage = e.pointerType !== 'mouse' || stage.isOver(e.clientX, e.clientY, stageEl.getBoundingClientRect());
    if (!onStage) return;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now() };
    cursor.dragging = true;
    cursor.refresh();
  });
  addEventListener('pointermove', (e) => {
    if (!down || down.id !== e.pointerId) return;
    stage.dragBy(e.clientX - down.lx, e.pointerType === 'mouse' ? e.clientY - down.ly : 0);
    down.lx = e.clientX; down.ly = e.clientY;
  }, { passive: true });
  const end = (e) => {
    if (!down || down.id !== e.pointerId) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const dt = performance.now() - down.t;
    down = null;
    stage.release();
    cursor.dragging = false;
    cursor.refresh();
    // a quick horizontal flick switches area (RTL: flick right = next)
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && dt < 450) (dx > 0 ? next : prev)();
  };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);

  // cursor label over the 3D object
  cursor.providers.push((x, y, target) => {
    if (detailOpen || !inView || !target.closest('#practice') || target.closest(UI_SEL)) return null;
    return stage.isOver(x, y, stageEl.getBoundingClientRect()) ? 'drag' : null;
  });

  // keyboard: only while the showcase fills the screen
  addEventListener('keydown', (e) => {
    if (detailOpen) {
      if (e.key === 'Escape') closeDetail();
      if (e.key === 'ArrowLeft') detailStep(1);
      if (e.key === 'ArrowRight') detailStep(-1);
      return;
    }
    if (!inView || e.target.closest?.('input, textarea, select')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); next(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); prev(); }
  });

  // controls
  $('.js-sc-detail', sec).addEventListener('click', openDetail);
  $('.js-sc-wide', sec).addEventListener('click', openDetail);
  $('.js-sc-tall', sec).addEventListener('click', next);
  $('.js-sc-next', sec).addEventListener('click', next);
  $('.js-sc-prev', sec).addEventListener('click', prev);
  const el = $('#scDetail');
  $('.scd__close', el).addEventListener('click', closeDetail);
  $('.js-scd-next', el).addEventListener('click', () => detailStep(1));
  $('.js-scd-prev', el).addEventListener('click', () => detailStep(-1));
  $('.js-scd-book', el).addEventListener('click', bookThisArea);
  // keep Tab focus inside the dialog
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, a[href]', el).filter((n) => n.offsetParent !== null);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // render only while on screen
  new IntersectionObserver(([en]) => {
    show.flags.visible = en.isIntersecting;
    show.updateRun();
  }, { rootMargin: '80px 0px' }).observe(sec);
  new IntersectionObserver(([en]) => {
    inView = en.isIntersecting;
    document.body.classList.toggle('is-showcase', inView);
  }, { threshold: 0.55 }).observe(sec);
  document.addEventListener('visibilitychange', () => show.updateRun());
}

/* ================================================================ */
/* Init                                                              */
/* ================================================================ */
export function initShowcase({ lenis, webgl }) {
  sec = $('#practice');
  if (!sec) return;
  lenisRef = lenis;
  stage = webgl ? stage3d : new ImageStage($('#showStage'), AREAS, imgFor);

  buildDots();
  renderInitial();
  if (!finePointer) $('.showcase__hint span', sec).textContent = 'اسحب أفقيًا للتنقّل بين التخصصات';

  gsap.set(UI.map((s) => $(s, sec)), { autoAlpha: 0 });
  gsap.set($$('.sc-tw', sec), { yPercent: 115, rotate: 4 });
  initInput();

  // mobile: subtle scroll parallax of the stage (stacked layout)
  gsap.matchMedia().add('(max-width: 820px)', () => {
    gsap.to('#showStage', {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true },
    });
  });
  gsap.matchMedia().add('(min-width: 821px)', () => {
    const lx = gsap.quickTo($('.showcase__info', sec), 'x', { duration: 1.2, ease: 'power3' });
    const rx = gsap.quickTo($('.showcase__panel', sec), 'x', { duration: 1.2, ease: 'power3' });
    const onMove = (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      lx(nx * -8); rx(nx * -14);
    };
    sec.addEventListener('pointermove', onMove, { passive: true });
    return () => sec.removeEventListener('pointermove', onMove);
  });

  // the intro waits for every shader to be compiled, so the first reveal never stutters
  const play = () => (webgl ? Promise.race([show.ready, new Promise((r) => setTimeout(r, 6000))]).then(intro) : intro());
  const start = () => ScrollTrigger.create({ trigger: sec, start: 'top 60%', once: true, onEnter: play });
  if (window.__siteReady) start();
  else addEventListener('site:ready', start, { once: true });
}
