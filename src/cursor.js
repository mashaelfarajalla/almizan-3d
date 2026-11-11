/* Custom cursor: a lagging ring + a precise dot. The ring grows into a
   labelled disc over interactive 3D objects ("اسحب"), thumbnails ("عرض")…
   Other modules add context through `cursor.providers`. Fine pointers only. */
import gsap from 'gsap';

const $ = (s, c = document) => c.querySelector(s);
const LABELS = { view: 'عرض', next: 'التالي', drag: 'اسحب', press: 'اضغط' };
const TEXT_INPUT = 'input, textarea, select';

export const cursor = {
  enabled: false,
  dragging: false,
  providers: [], // (x, y, target) => label | null
  refresh() {},
};

export function initCursor() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ring = $('.cursor');
  const dot = $('.cursor-dot');
  if (!fine || !ring) return cursor;

  cursor.enabled = true;
  document.body.classList.add('has-cursor');
  const label = $('.cursor__label', ring);
  const d = reduce ? 0.15 : 0.55;
  const xTo = gsap.quickTo(ring, 'x', { duration: d, ease: 'power3' });
  const yTo = gsap.quickTo(ring, 'y', { duration: d, ease: 'power3' });
  const dxTo = gsap.quickTo(dot, 'x', { duration: 0.08 });
  const dyTo = gsap.quickTo(dot, 'y', { duration: 0.08 });
  let shown = false;
  let last = null;

  const update = (x, y, target) => {
    if (!target || !target.closest) return;
    if (!shown) { gsap.to([ring, dot], { opacity: 1, duration: 0.4 }); shown = true; }
    xTo(x); yTo(y); dxTo(x); dyTo(y);

    const overText = !!target.closest(TEXT_INPUT);
    const tagged = target.closest('[data-cursor]');
    const link = target.closest('a, button, [role="tab"], .member, label');
    let lab = tagged ? LABELS[tagged.dataset.cursor] : null;
    let drag = false;
    if (!lab && !link) {
      for (const p of cursor.providers) {
        const r = p(x, y, target);
        if (r) { lab = LABELS[r] || r; drag = r === 'drag'; break; }
      }
    }
    if (!lab && !link && document.body.classList.contains('is-hot')) lab = LABELS.press;

    ring.classList.toggle('is-hidden', overText);
    dot.classList.toggle('is-hidden', overText);
    ring.classList.toggle('is-label', !!lab && !cursor.dragging);
    ring.classList.toggle('is-drag', drag && !cursor.dragging);
    ring.classList.toggle('is-dragging', cursor.dragging);
    ring.classList.toggle('is-link', !!link && !lab);
    if (lab) label.textContent = lab;
    gsap.to(dot, { scale: link && !lab ? 0 : 1, duration: 0.3, overwrite: 'auto' });
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    last = { x: e.clientX, y: e.clientY };
    update(e.clientX, e.clientY, e.target);
  }, { passive: true });

  // content scrolls under a still mouse (Lenis): re-evaluate what is under it
  cursor.refresh = () => {
    if (!last) return;
    update(last.x, last.y, document.elementFromPoint(last.x, last.y));
  };
  let raf = 0;
  addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(cursor.refresh);
  }, { passive: true });
  addEventListener('cursor:refresh', cursor.refresh);

  document.addEventListener('mouseleave', () => { gsap.to([ring, dot], { opacity: 0, duration: 0.3 }); shown = false; });
  addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.85, duration: 0.2 }));
  addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: 0.5, ease: 'elastic.out(1, .5)' }));
  return cursor;
}
