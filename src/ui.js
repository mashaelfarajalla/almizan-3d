/* =========================================================
   الميزان — UI interactions (menu, tilt, slider, form…)
   Motion & scroll effects live in animations.js (GSAP).
   ========================================================= */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export function initUI({ lenis } = {}) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Preloader → fires `site:ready` ---------- */
  const ready = () => {
    if (document.body.classList.contains('is-ready')) return;
    document.body.classList.add('is-ready');
    window.__siteReady = true;
    window.dispatchEvent(new Event('site:ready'));
    setTimeout(() => $('#preloader')?.remove(), 1200);
  };
  if (document.readyState === 'complete') setTimeout(ready, 400);
  else window.addEventListener('load', () => setTimeout(ready, 500));
  setTimeout(ready, 3500); // safety net on slow networks

  if (!finePointer) {
    const hint = $('.story__hint');
    if (hint) hint.textContent = 'المس كفّتي الميزان أو اضغط عليه لتدويره';
  }

  /* ---------- Header state / back-to-top ---------- */
  const header = $('#header');
  const toTop = $('#toTop');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', scrollY > 30);
    toTop.classList.toggle('is-visible', scrollY > innerHeight * 0.8);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth anchor links (Lenis) ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      const offset = id === '#hero' ? 0 : -(header.offsetHeight - 10);
      if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  $('#navOverlay')?.addEventListener('click', () => setMenu(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Active nav link ---------- */
  const links = $$('.nav__link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionObserver.observe(s));

  /* ---------- 3D tilt cards / magnetic buttons / cursor glow ---------- */
  if (finePointer && !reduceMotion) {
    $$('.tilt').forEach((el) => {
      const max = +el.dataset.tilt || 10;
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        if (!el.classList.contains('is-in')) return; // wait for the GSAP reveal to finish
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transition = 'transform .15s ease-out, border-color .4s, box-shadow .5s';
          el.style.transform = `rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`;
          el.style.setProperty('--gx', `${x * 100}%`);
          el.style.setProperty('--gy', `${y * 100}%`);
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.style.transition = '';
        el.style.transform = '';
      });
    });

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });

    const glow = $('#cursorGlow');
    let gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy, running = false;
    const loop = () => {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5) requestAnimationFrame(loop);
      else running = false;
    };
    addEventListener('pointermove', (e) => {
      gx = e.clientX; gy = e.clientY;
      document.body.classList.add('has-cursor');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
  }

  /* ---------- Team flip on tap (touch) ---------- */
  $$('.member').forEach((m) => {
    m.addEventListener('click', () => { if (!finePointer) m.classList.toggle('is-flipped'); });
    m.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.classList.toggle('is-flipped'); }
    });
  });

  /* ---------- Testimonials slider ---------- */
  const slider = $('#slider');
  if (slider) {
    const slides = $$('.slide', slider);
    const dotsWrap = $('.slider__dots', slider);
    let current = 0, timer;
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `الشهادة ${i + 1}`);
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
      return b;
    });
    const go = (i, user) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
      dots.forEach((d, k) => { d.classList.toggle('is-active', k === current); d.setAttribute('aria-selected', k === current); });
      if (user) restart();
    };
    const restart = () => {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => go(current + 1), 6000);
    };
    $$('.slider__btn', slider).forEach((b) => b.addEventListener('click', () => go(current + +b.dataset.dir, true)));

    let sx = null;
    slider.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(current + (dx > 0 ? 1 : -1), true); // RTL: swipe right = next
      sx = null;
    });
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', restart);
    go(0); restart();
  }

  /* ---------- Contact form ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  if (form) {
    form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      $$('input, select, textarea', form).forEach((f) => {
        const ok = f.checkValidity();
        f.closest('.field')?.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      status.className = 'form__status';
      if (!valid) {
        status.textContent = 'يرجى تعبئة جميع الحقول بشكل صحيح.';
        status.classList.add('is-err');
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.style.opacity = '.7';
      status.textContent = 'جارٍ الإرسال...';

      // TODO: connect to a real backend / form service
      await new Promise((r) => setTimeout(r, 1200));

      status.textContent = 'شكرًا لك! تم استلام طلبك وسيتواصل معك أحد مستشارينا قريبًا.';
      status.classList.add('is-ok');
      form.reset();
      btn.disabled = false;
      btn.style.opacity = '';
    });
  }

  $('#year').textContent = new Date().getFullYear();
}
