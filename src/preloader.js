/* Preloader with real progress: fonts, page assets and 3D shader compilation.
   Fires `site:ready` while the curtain lifts, so the hero intro plays through it. */
import gsap from 'gsap';

const $ = (s, c = document) => c.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function fireReady() {
  if (window.__siteReady) return;
  document.body.classList.add('is-ready');
  window.__siteReady = true;
  dispatchEvent(new Event('site:ready'));
}

export function initPreloader(tasks, { lenis } = {}) {
  const el = $('#preloader');
  if (!el) { fireReady(); return; }
  lenis?.stop();

  const count = $('.preloader__count span', el);
  const bar = $('.preloader__bar i', el);
  const prog = { v: 0 };
  const progressTo = (p) => gsap.to(prog, {
    v: p,
    duration: 0.6,
    ease: 'power2.out',
    overwrite: true,
    onUpdate: () => {
      count.textContent = Math.round(prog.v * 100);
      gsap.set(bar, { scaleX: prog.v });
    },
  });

  gsap.from($('.preloader__name span', el), { yPercent: 115, duration: 1.2, ease: 'expo.out', delay: 0.25 });

  const list = tasks.filter(Boolean);
  let done = 0;
  // NB: braces matter — a GSAP tween is a thenable, and returning it here would
  // chain each promise to a tween that the next progress update overwrites (kills).
  const all = Promise.all([
    ...list.map((p) => Promise.resolve(p).catch(() => {}).then(() => { progressTo((++done / list.length) * 0.95); })),
    wait(1000),
  ]);

  Promise.race([all, wait(8000)])
    .then(() => new Promise((res) => progressTo(1).eventCallback('onComplete', res)))
    .then(() => {
      gsap.timeline({ onComplete: () => el.remove() })
        .to($('.preloader__inner', el), { autoAlpha: 0, y: -24, duration: 0.6, ease: 'power2.in' })
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.4)
        .call(() => { lenis?.start(); fireReady(); }, null, 0.75);
    });
}
