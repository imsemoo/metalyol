/* ==========================================================================
   METALYOL — project.js
   Smart interactions for /projects/*.html
     · Hero entry — masked title reveal + image scale-down
     · Sticky split-screen spec panel — visual layer swaps as you scroll pages
     · Animated metric ledger — count-up on scroll
     · Magnetic-tilt gallery tiles — 3D rotate on cursor
     · Process timeline — wheel-to-horizontal scroll
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('page-project')) return;

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* -------- Hero entry --------------------------------------------------- */
  function initHero() {
    if (!hasGSAP || reduceMotion) return;
    const tl = gsap.timeline({ delay: .2 });
    tl.from('.proj-hero__media img', {
        scale: 1.15, duration: 1.6, ease: 'power3.out', clearProps: 'transform'
      })
      .from('.proj-back', { y: 12, opacity: 0, duration: .6, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=1.1')
      .from('.proj-hero .eyebrow', { y: 16, opacity: 0, duration: .6, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=.4')
      .from('.proj-hero__title .line span', {
        yPercent: 110, duration: 1, stagger: .08, ease: 'power4.out', clearProps: 'transform'
      }, '-=.4')
      .from('.proj-hero__lead', { y: 16, opacity: 0, duration: .6, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=.6')
      .from('.proj-hero__strip', { y: 30, opacity: 0, duration: .7, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=.4');
  }

  /* -------- Sticky spec panel — change visual layer per page ------------- */
  function initSpecPanel() {
    if (!hasGSAP) return;
    const visual = document.querySelector('[data-spec-visual]');
    if (!visual) return;

    const layers = visual.querySelectorAll('.proj-spec__layer');
    const captionPage = visual.querySelector('.proj-spec__caption-page');
    const captionLabel = visual.querySelector('.proj-spec__caption-label');
    const pages = document.querySelectorAll('.proj-spec__page');
    if (!pages.length) return;

    const captions = [
      'SITE ELEVATION · DRAFT',
      'MATERIAL SPEC · S460',
      'GEOMETRY · CHALLENGE',
      'AS-BUILT · DELIVERED'
    ];

    function setActive(idx) {
      layers.forEach((el, i) => el.classList.toggle('is-active', i === idx));
      if (captionPage) {
        const total = String(layers.length).padStart(2, '0');
        captionPage.textContent = String(idx + 1).padStart(2, '0') + ' / ' + total;
      }
      if (captionLabel && captions[idx]) captionLabel.textContent = captions[idx];
    }
    setActive(0);

    // Each page triggers its layer when its midpoint hits the viewport mid
    pages.forEach((page, idx) => {
      ScrollTrigger.create({
        trigger: page,
        start: 'top center',
        end:   'bottom center',
        onEnter:     () => setActive(idx),
        onEnterBack: () => setActive(idx)
      });
    });
  }

  /* -------- Animated metric ledger — counts up on scroll ----------------- */
  function initMetricLedger() {
    if (!hasGSAP) return;
    document.querySelectorAll('[data-metric-row] [data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      if (isNaN(target)) return;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate() {
          el.textContent = obj.v.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
        }
      });
    });
  }

  /* -------- Magnetic-tilt gallery tiles ---------------------------------- */
  function initTiltTiles() {
    if (reduceMotion) return;
    if (window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)').matches) return;

    const tiles = document.querySelectorAll('[data-tilt]');
    const MAX = 8;   // max tilt degrees

    tiles.forEach(tile => {
      const img = tile.querySelector('.proj-tile__img');
      let raf = null, tx = 0, ty = 0;

      function update(e) {
        const r = tile.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - .5;  // -.5 → .5
        const py = (e.clientY - r.top)  / r.height - .5;
        tx = -py * MAX;        // tilt X is from vertical mouse movement (inverted)
        ty =  px * MAX;
        if (!raf) raf = requestAnimationFrame(apply);
      }

      function apply() {
        raf = null;
        tile.style.transform = 'perspective(1000px) rotateX(' + tx.toFixed(2) + 'deg) rotateY(' + ty.toFixed(2) + 'deg)';
        if (img) img.style.transform = 'translate3d(' + (ty * 1.2) + 'px, ' + (-tx * 1.2) + 'px, 0) scale(1.05)';
      }

      function reset() {
        tile.style.transform = '';
        if (img) img.style.transform = '';
      }

      tile.addEventListener('mousemove', update, { passive: true });
      tile.addEventListener('mouseleave', reset);
    });
  }

  /* -------- Process timeline — translate wheel scroll to horizontal ------ */
  function initProcessRail() {
    const rail = document.querySelector('.proj-process__rail');
    if (!rail) return;

    // On desktop, vertical wheel pushes the timeline horizontally if hovered
    rail.addEventListener('wheel', e => {
      const canScrollHoriz = rail.scrollWidth > rail.clientWidth;
      if (!canScrollHoriz) return;
      const atLeftEnd  = rail.scrollLeft <= 0 && e.deltaY < 0;
      const atRightEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1 && e.deltaY > 0;
      if (atLeftEnd || atRightEnd) return;
      e.preventDefault();
      rail.scrollLeft += e.deltaY;
    }, { passive: false });

    // Reveal each step as it scrolls into view
    if (hasGSAP && !reduceMotion) {
      gsap.utils.toArray('.proc-step').forEach((step, i) => {
        gsap.from(step, {
          opacity: 0, y: 20, duration: .7, ease: 'power3.out', delay: i * .04,
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: step, start: 'top 92%', once: true }
        });
      });
    }
  }

  /* -------- Section headings + brief copy reveal ------------------------- */
  function initContentReveal() {
    if (!hasGSAP || reduceMotion) return;

    gsap.utils.toArray('.section-head').forEach(h => {
      gsap.from(h.children, {
        opacity: 0, y: 24, duration: .8, stagger: .08, ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('.proj-brief__head, .proj-brief__copy').forEach(el => {
      gsap.from(el.children, {
        opacity: 0, y: 20, duration: .7, stagger: .06, ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('.proj-spec__page').forEach(page => {
      gsap.from(page.children, {
        opacity: 0, y: 18, duration: .7, stagger: .05, ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: page, start: 'top 80%', once: true }
      });
    });

    gsap.utils.toArray('.proj-tile').forEach((t, i) => {
      gsap.from(t, {
        opacity: 0, y: 30, duration: .7, ease: 'power3.out', delay: i * .05,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: t, start: 'top 92%', once: true }
      });
    });
  }

  /* -------- Boot --------------------------------------------------------- */
  // The shared main.js handles preloader + nav + cursor. We boot our extras
  // once GSAP/ScrollTrigger are ready.
  function boot() {
    initHero();
    initSpecPanel();
    initMetricLedger();
    initTiltTiles();
    initProcessRail();
    initContentReveal();
  }

  // main.js calls initAll() on preloader complete which doesn't run our hooks,
  // so we listen for the body 'lock' class disappearing as our cue.
  const observer = new MutationObserver(() => {
    if (!document.body.classList.contains('lock')) {
      observer.disconnect();
      boot();
    }
  });
  if (document.body.classList.contains('lock')) {
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Safety: boot anyway after 6.5s
    setTimeout(() => { observer.disconnect(); boot(); }, 6500);
  } else {
    boot();
  }
});
