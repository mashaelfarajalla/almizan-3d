/* Graceful fallback when WebGL is unavailable: the cut-out renders with the
   same transition choreography, driven by GSAP on DOM elements. */
import gsap from 'gsap';

const RTL = -1;

export class ImageStage {
  constructor(el, areas, imgFor) {
    this.el = el;
    this.current = 0;
    el.classList.add('is-fallback');
    this.items = areas.map((a) => {
      const w = document.createElement('div');
      w.className = 'sc-fb';
      w.innerHTML = `<img src="${imgFor(a)}" alt="" decoding="async">`;
      el.appendChild(w);
      gsap.set(w, { autoAlpha: 0, xPercent: -50, yPercent: -50 });
      return w;
    });
  }

  intro(i = 0) {
    return gsap.fromTo(this.items[i], { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'expo.out' });
  }

  transition(from, to, dir) {
    const A = this.items[from];
    const B = this.items[to];
    const travel = window.innerWidth * 0.27 * dir * RTL;
    this.current = to;
    return gsap.timeline()
      .to(A, { x: -travel, scale: 0.5, autoAlpha: 0, duration: 1.4, ease: 'power3.inOut' }, 0)
      .fromTo(B, { x: travel, scale: 0.45, autoAlpha: 0 }, { x: 0, scale: 1, autoAlpha: 1, duration: 1.8, ease: 'expo.out' }, 0.45);
  }

  setPointer(nx, ny) {
    gsap.to(this.items[this.current], { rotationY: nx * 10, rotationX: -ny * 6, duration: 1, ease: 'power2.out', overwrite: 'auto' });
  }
  dragBy() {}
  release() {}
  isOver() { return false; }
  pause() {}
}
