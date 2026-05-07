/* ==========================================================================
   METALYOL — main.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------- Reduced-motion + GSAP guards ----------
     Read user motion preference once and skip the heavier intro animations
     when it is set, or when GSAP failed to load (CDN blocked, offline, …). */
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  /* -------- Preloader · Metalyol scan-line sequence ----------
     A vertical scan line wipes across the brand logo (left → right) over
     ~3.1s, revealing the real wordmark from a faint ghost. Sparks emit at
     the scan position. The hex on the logo flashes when the scan crosses
     ~70% across. Three service cards activate in sequence with status text
     in the HUD. Master progress 0→100% over 7 seconds, then the stage
     fades + slides up and the page boots. */
  const stage      = document.getElementById('loaderStage');
  const logoZone   = document.getElementById('loaderLogoZone');
  const scanLine   = document.getElementById('loaderScanLine');
  const scanHalo   = document.getElementById('loaderScanHalo');
  const hexFlash   = document.getElementById('loaderHexFlash');
  const weldFlash  = document.getElementById('loaderWeldFlash');
  const sparksEl   = document.getElementById('loaderSparks');
  const tagline    = document.getElementById('loaderTagline');
  const trackFill  = document.getElementById('loaderTrackFill');
  const trackMark  = document.getElementById('loaderTrackMark');
  const pctEl      = document.getElementById('loaderPct');
  const labelEl    = document.getElementById('loaderLabel');
  const clockEl    = document.getElementById('loaderClock');
  const svcs       = document.querySelectorAll('.loader-svc');

  document.body.classList.add('lock');

  let bootDone = false;
  function bootApp(){
    if (bootDone) return;
    bootDone = true;
    if (stage) {
      stage.classList.add('is-finishing');
      setTimeout(() => { stage.style.display = 'none'; }, 600);
    }
    document.body.classList.remove('lock');
    if (hasGSAP) initAll();
  }

  // Hard safety: 5s timeout in case rAF stalls (tab backgrounded, etc.)
  setTimeout(bootApp, 5000);

  if (!stage) {
    // No loader on this page — boot immediately.
    bootApp();
  } else {
    // The sequence ALWAYS plays the full duration so the brand intro lands.
    // Reduce-motion users still see structure & status, but grain/sparks
    // are CSS-disabled (see @media (prefers-reduced-motion) in style.css).
    // ----- Timeline (2.5s) -----
    const TOTAL      = 2500;
    const SCAN_START = 100;
    const SCAN_END   = 1300;
    const HEX_AT     = SCAN_START + (SCAN_END - SCAN_START) * 0.70;
    const TAGLINE_AT = 1400;
    const SVC_WINDOWS = [
      [ 250, 1000, 'Sourcing mill stock — beams · plates · alloys'],
      [1000, 1700, 'Welding cell online — AWS D1.1 / EN 1090 EXC4'],
      [1700, 2500, 'BIM lift plan synced — erection crew dispatched']
    ];

    // UTC clock (1Hz)
    if (clockEl) {
      const tickClock = () => {
        const d = new Date();
        const h = String(d.getUTCHours()).padStart(2, '0');
        const m = String(d.getUTCMinutes()).padStart(2, '0');
        const s = String(d.getUTCSeconds()).padStart(2, '0');
        clockEl.textContent = h + ':' + m + ':' + s + ' UTC';
      };
      tickClock();
      setInterval(tickClock, 1000);
    }

    // Sparks helpers
    function sparkAtScan(){
      const rev = parseFloat(logoZone.style.getPropertyValue('--rev')) || 0;
      for (let i = 0; i < 2; i++) {
        const s = document.createElement('span');
        s.className = 'loader-spark';
        const a = (Math.random() * Math.PI) - Math.PI/2;
        const r = 30 + Math.random() * 90;
        s.style.setProperty('--sx', Math.cos(a) * r + 'px');
        s.style.setProperty('--sy', (Math.random() < .5 ? -1 : 1) * (20 + Math.random() * 70) + 'px');
        s.style.left = rev + '%';
        s.style.top  = (45 + Math.random() * 10) + '%';
        s.style.animationDuration = (0.7 + Math.random() * 0.6) + 's';
        sparksEl.appendChild(s);
        setTimeout(() => s.remove(), 1500);
      }
    }

    function bigBurst(xPct, yPct, n){
      n = n || 36;
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'loader-spark';
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 260;
        s.style.setProperty('--sx', Math.cos(a) * r + 'px');
        s.style.setProperty('--sy', Math.sin(a) * r * 0.8 + 'px');
        s.style.left = xPct + '%';
        s.style.top  = yPct + '%';
        s.style.animationDuration = (0.9 + Math.random() * 0.8) + 's';
        sparksEl.appendChild(s);
        setTimeout(() => s.remove(), 1900);
      }
    }

    let raf = null, t0 = null, hexFired = false, taglineFired = false, sparkAcc = 0;

    function setScan(t){
      if (t < SCAN_START) {
        logoZone.style.setProperty('--rev', '0%');
        scanLine.classList.remove('is-on');
        scanHalo.classList.remove('is-on');
        return;
      }
      if (t > SCAN_END + 200) {
        logoZone.style.setProperty('--rev', '100%');
        scanLine.classList.add('is-off');
        scanHalo.classList.add('is-off');
        scanLine.classList.remove('is-on');
        scanHalo.classList.remove('is-on');
        return;
      }
      const local = Math.min(1, Math.max(0, (t - SCAN_START) / (SCAN_END - SCAN_START)));
      const eased = local < .5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
      logoZone.style.setProperty('--rev', (eased * 100).toFixed(2) + '%');
      scanLine.classList.add('is-on');
      scanHalo.classList.add('is-on');
    }

    function loaderFrame(now){
      if (!t0) t0 = now;
      const t = now - t0;
      const p = Math.min(1, t / TOTAL);

      setScan(t);

      // Sparks while scanning (every ~70ms)
      if (t > SCAN_START && t < SCAN_END) {
        sparkAcc += 16.7;
        if (sparkAcc > 70) { sparkAtScan(); sparkAcc = 0; }
      }

      // Hex flash + weld flash when crossing the hexagon
      if (!hexFired && t >= HEX_AT) {
        hexFired = true;
        hexFlash.classList.remove('is-on'); void hexFlash.offsetWidth; hexFlash.classList.add('is-on');
        weldFlash.classList.remove('is-on'); void weldFlash.offsetWidth; weldFlash.classList.add('is-on');
        bigBurst(70, 50, 36);
      }

      // Tagline reveal
      if (!taglineFired && t >= TAGLINE_AT) {
        taglineFired = true;
        tagline.classList.add('is-on');
      }

      // Master progress
      const pp = (p * 100).toFixed(2);
      trackFill.style.width = pp + '%';
      trackMark.style.left  = pp + '%';
      pctEl.textContent     = Math.round(p * 100) + '%';

      // Service cards
      svcs.forEach((el, i) => {
        const w = SVC_WINDOWS[i];
        const local = (t - w[0]) / (w[1] - w[0]);
        const bar = el.querySelector('.loader-svc-bar');
        if (t < w[0]) {
          el.classList.remove('is-active', 'is-done');
          bar.style.width = '0%';
        } else if (t >= w[0] && t < w[1]) {
          el.classList.add('is-active');
          el.classList.remove('is-done');
          bar.style.width = Math.max(0, Math.min(1, local)) * 100 + '%';
          labelEl.textContent = w[2];
        } else {
          el.classList.remove('is-active');
          el.classList.add('is-done');
          bar.style.width = '100%';
        }
      });
      if (t < SVC_WINDOWS[0][0]) labelEl.textContent = 'Initializing mill link…';

      if (p >= 1) {
        labelEl.textContent = 'Ready.';
        cancelAnimationFrame(raf);
        // Snap stage to "done" state for the centered logo, then boot.
        stage.classList.add('is-done');
        setTimeout(bootApp, 200);
        return;
      }
      raf = requestAnimationFrame(loaderFrame);
    }

    raf = requestAnimationFrame(loaderFrame);
  }

  /* -------- Nav ---------- */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const links = document.querySelectorAll('.nav__menu a');

  // Publish the live nav height as --nav-h so CSS (e.g. sticky bp-stage)
  // can sit cleanly below it on every viewport.
  function syncNavHeight(){
    if(!nav) return;
    document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  }
  syncNavHeight();
  window.addEventListener('resize', syncNavHeight, {passive:true});
  if(typeof ResizeObserver !== 'undefined' && nav){
    new ResizeObserver(syncNavHeight).observe(nav);
  }

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    syncNavHeight();
    let cur = '';
    document.querySelectorAll('section[id]').forEach(s=>{
      const top = s.offsetTop - 120;
      if(window.scrollY >= top) cur = s.id;
    });
    links.forEach(a=>{
      a.classList.toggle('active', a.getAttribute('href') === '#'+cur);
    });
  }, {passive:true});

  burger?.addEventListener('click', ()=>nav.classList.toggle('open'));
  links.forEach(a=>a.addEventListener('click', ()=>nav.classList.remove('open')));

  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href');
      if(id.length<2) return;
      const t = document.querySelector(id);
      if(!t) return;
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 70;
      window.scrollTo({top:t.offsetTop - navH - 8, behavior:'smooth'});
    });
  });

  function initAll(){
    gsap.registerPlugin(ScrollTrigger);
    initHero();
    initHeroParallax();
    initServiceCycle();
    initCursor();
    initParticles();
    initReveals();
    initCounters();
    initServices();
    initWhyAccordion();
    initBlueprint();
  }

  /* -------- Cookie consent ----------
     Show the banner only if the user hasn't already accepted. The choice is
     stored in localStorage — we store no other data, no tracking. */
  (function initCookieBar(){
    const bar = document.getElementById('cookieBar');
    if (!bar) return;
    let accepted = false;
    try { accepted = localStorage.getItem('metalyol-cookies') === 'ok'; } catch(_) {}
    if (accepted) return;
    bar.hidden = false;
    bar.querySelector('[data-cookie-accept]')?.addEventListener('click', () => {
      try { localStorage.setItem('metalyol-cookies', 'ok'); } catch(_) {}
      bar.style.opacity = '0';
      bar.style.transform = 'translateY(20px)';
      bar.style.transition = 'opacity .25s ease, transform .25s ease';
      setTimeout(() => bar.hidden = true, 280);
    });
  })();

  /* -------- Why-us accordion ----------
     Each .why__item toggles open/closed on click + Enter/Space (keyboard).
     Opening one closes the others — keeps the section tidy. */
  function initWhyAccordion(){
    const items = document.querySelectorAll('.why__item');
    if (!items.length) return;

    function setOpen(target, open){
      target.classList.toggle('is-open', open);
      target.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    items.forEach(item => {
      const toggle = () => {
        const willOpen = !item.classList.contains('is-open');
        // Close siblings — only one open at a time (true accordion)
        items.forEach(other => { if (other !== item) setOpen(other, false); });
        setOpen(item, willOpen);
      };
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    // Open the first one by default — gives users a hint that they expand
    setOpen(items[0], true);
  }

  /* -------- Hero entry ----------
     Reduced-motion users get the natural CSS state with no intro animation,
     so the headline is always visible. clearProps ensures every `.from()`
     wipes its inline transform/opacity afterwards — even if the timeline
     gets interrupted mid-flight, the element snaps back to its CSS state. */
  function initHero(){
    if(reduceMotion) return;

    const tl = gsap.timeline();
    tl
      .from('.hero .eyebrow', {y:20, opacity:0, duration:.7, ease:'power3.out', clearProps:'transform,opacity'})
      .from('.hero__headline .line span', {yPercent:110, duration:1, stagger:.08, ease:'power4.out', clearProps:'transform'}, '-=.4')
      .from('.hero__sub', {y:20, opacity:0, duration:.7, ease:'power3.out', clearProps:'transform,opacity'}, '-=.5')
      .from('.hero__service', {y:30, opacity:0, duration:.7, stagger:.1, ease:'power3.out', clearProps:'transform,opacity'}, '-=.4')
      .from('.hero__cta > *', {y:20, opacity:0, duration:.6, stagger:.08, ease:'power3.out', clearProps:'transform,opacity'}, '-=.4')
      .from('.hero__scroll', {opacity:0, duration:.6, clearProps:'opacity'}, '-=.2');

    gsap.to('.hero__grid', {
      yPercent:30, ease:'none',
      scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}
    });
  }

  /* -------- Hero scene parallax (mouse) ---------- */
  function initHeroParallax(){
    const hero = document.querySelector('.hero');
    const layers = hero?.querySelectorAll('.hero__scene-layer');
    if(!hero || !layers || !layers.length) return;

    let raf = null, mx = 0, my = 0;
    const onMove = e => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width  - .5) * 2;   // -1 .. 1
      my = ((e.clientY - r.top)  / r.height - .5) * 2;
      if(!raf) raf = requestAnimationFrame(apply);
    };
    function apply(){
      raf = null;
      layers.forEach(el=>{
        const depth = parseFloat(el.dataset.depth || .35);
        const tx = mx * 28 * depth;
        const ty = my * 18 * depth;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    }
    hero.addEventListener('mousemove', onMove, {passive:true});
    hero.addEventListener('mouseleave', ()=>{
      layers.forEach(el => el.style.transform = 'translate3d(0,0,0)');
    });
  }

  /* -------- Hero service cards auto-cycle ---------- */
  function initServiceCycle(){
    const cards = document.querySelectorAll('.hero__service');
    if(cards.length < 2) return;

    let i = 0, paused = false, timer = null;
    const setActive = idx => {
      cards.forEach((c, k) => c.classList.toggle('is-active', k === idx));
      i = idx;
    };
    const start = () => {
      if(reduceMotion) return; // Honour reduced-motion: keep card 0 active, no rotation
      stop();
      timer = setInterval(()=>{ if(!paused) setActive((i + 1) % cards.length); }, 3500);
    };
    const stop = () => { if(timer){ clearInterval(timer); timer = null; } };

    cards.forEach((c, idx) => {
      c.addEventListener('mouseenter', ()=>{ paused = true;  setActive(idx); });
      c.addEventListener('mouseleave', ()=>{ paused = false; });
    });

    setActive(0);
    start();

    if(reduceMotion) return;

    // Pause cycling when hero is offscreen — saves cycles
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e => e.isIntersecting ? start() : stop());
    }, {threshold:.15});
    io.observe(cards[0].closest('.hero'));
  }

  /* -------- Magnetic ember cursor ---------- */
  function initCursor(){
    if(window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)').matches) return;
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);

    let mx = 0, my = 0, cx = 0, cy = 0, running = false;
    const lerp = (a, b, n) => a + (b - a) * n;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if(!running){ running = true; loop(); }
    }, {passive:true});

    function loop(){
      cx = lerp(cx, mx, .22);
      cy = lerp(cy, my, .22);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate3d(-50%, -50%, 0)`;
      requestAnimationFrame(loop);
    }

    const hoverSel = 'a, .btn, .hero__service, .service, .op-card, button, [role="button"]';
    document.addEventListener('mouseover', e=>{
      if(e.target.closest(hoverSel)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e=>{
      if(e.target.closest(hoverSel) && !e.relatedTarget?.closest(hoverSel)) cursor.classList.remove('is-hover');
    });
    document.addEventListener('mousedown', ()=>cursor.classList.add('is-down'));
    document.addEventListener('mouseup',   ()=>cursor.classList.remove('is-down'));
    document.addEventListener('mouseleave', ()=>cursor.style.opacity = '0');
    document.addEventListener('mouseenter', ()=>cursor.style.opacity = '1');
  }

  /* -------- Particles canvas ---------- */
  function initParticles(){
    const canvas = document.querySelector('.hero__canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles=[];
    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize(); window.addEventListener('resize', resize);

    for(let i=0;i<60;i++){
      particles.push({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-.5)*.2, vy:-Math.random()*.3 - .05,
        r:Math.random()*1.4 + .3,
        a:Math.random()*.6 + .2,
        hue:Math.random() > .7 ? '255,120,40' : '180,190,210'
      });
    }
    function tick(){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p=>{
        p.x += p.vx; p.y += p.vy;
        if(p.y < -10){ p.y = h+10; p.x = Math.random()*w; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${p.hue}, ${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* -------- Reveals ----------
     Each ScrollTrigger animation snaps the element back to its natural CSS
     state via `clearProps` once it finishes. If a trigger ever fires past
     the element (already in view) `once: true` ensures we don't re-hide it. */
  function initReveals(){
    if(reduceMotion) return;
    const stOnce = (trigger, start='top 85%') => ({trigger, start, once:true});

    gsap.utils.toArray('.section-head').forEach(h=>{
      gsap.from(h.children, {
        opacity:0, y:30, duration:.9, stagger:.1, ease:'power3.out',
        clearProps:'transform,opacity',
        scrollTrigger: stOnce(h)
      });
    });
    gsap.utils.toArray('.service').forEach((s,i)=>{
      gsap.from(s, {
        opacity:0, y:40, duration:.8, ease:'power3.out', delay:i*.08,
        clearProps:'transform,opacity',
        scrollTrigger: stOnce(s)
      });
    });
    gsap.utils.toArray('.why__item').forEach(item=>{
      gsap.from(item, {
        opacity:0, x:-30, duration:.8, ease:'power3.out',
        clearProps:'transform,opacity',
        scrollTrigger: stOnce(item)
      });
    });
    gsap.utils.toArray('.op-card').forEach((c,i)=>{
      gsap.from(c, {
        opacity:0, y:40, duration:.8, ease:'power3.out', delay:i*.06,
        clearProps:'transform,opacity',
        scrollTrigger: stOnce(c, 'top 90%')
      });
    });
    gsap.from('.footer__monogram', {
      opacity:0, y:60, duration:1.2, ease:'power3.out',
      clearProps:'transform,opacity',
      scrollTrigger: stOnce('.footer__monogram', 'top 90%')
    });
  }

  /* -------- Counters ----------
     Skip counters inside [data-metric-row] — those are handled by project.js
     (which supports decimals) on /projects/*.html pages. */
  function initCounters(){
    document.querySelectorAll('[data-count]').forEach(el=>{
      if (el.closest('[data-metric-row]')) return;
      const target = +el.dataset.count;
      const obj = {v:0};
      gsap.to(obj, {
        v:target, duration:2.2, ease:'power2.out',
        scrollTrigger:{trigger:el, start:'top 85%', once:true},
        onUpdate(){ el.textContent = Math.round(obj.v).toLocaleString(); }
      });
    });
  }

  /* -------- Services hover spotlight ---------- */
  function initServices(){
    document.querySelectorAll('.service').forEach(s=>{
      s.addEventListener('mousemove', e=>{
        const r = s.getBoundingClientRect();
        s.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
        s.style.setProperty('--my', ((e.clientY-r.top)/r.height*100)+'%');
      });
    });
  }

  /* -------- BLUEPRINT → FABRICATION → REALITY scrub ----------
     Each bp-stage runs its own independent scrub timeline so we can stack
     several featured projects (Katara towers, Lusail Marina Yacht Club, …)
     down the page without them stomping on each other. -------------------- */
  function initBlueprintStage(stage){
    const bp         = stage.querySelector('.bp');
    if(!bp) return;
    const blueprint  = stage.querySelector('.bp__blueprint');
    const reality    = stage.querySelector('.bp__reality');
    const forge      = stage.querySelector('.bp__forge');
    const lines      = stage.querySelectorAll('.bp__blueprint .bp__lines path, .bp__blueprint .bp__lines line');
    const callouts   = stage.querySelectorAll('.bp__dims .bp__callout');
    const titleblock = stage.querySelector('.bp__titleblock');
    const fill       = stage.querySelector('.bp__progress-fill');
    const pct        = stage.querySelector('.bp__progress-pct');
    const phaseItems = stage.querySelectorAll('.bp__phase-item');

    // Initial line-draw state for SVG blueprints — image blueprints simply skip this
    lines.forEach(el=>{
      const len = el.getTotalLength ? el.getTotalLength() : 400;
      el.style.strokeDasharray  = len;
      el.style.strokeDashoffset = len;
    });

    const tl = gsap.timeline({
      scrollTrigger:{
        trigger: stage,
        start: 'top top',
        end: 'bottom bottom',
        scrub: .6,
        onUpdate(self){
          const p = Math.round(self.progress*100);
          if(fill) fill.style.width = p+'%';
          if(pct)  pct.textContent  = p+'%';
          let phase = 0;
          if(self.progress > .30) phase = 1;
          if(self.progress > .66) phase = 2;
          phaseItems.forEach((it,i)=> it.classList.toggle('is-active', i===phase));
          bp.classList.toggle('is-forging', phase === 1);
          bp.classList.toggle('is-real',    phase === 2);
        }
      }
    });

    // ACT 1 · BLUEPRINT — line draw (SVG only) + label/callouts fade in
    if(lines.length){
      tl.to(lines, {strokeDashoffset:0, duration:1.2, ease:'power2.out', stagger:{each:.004, from:'start'}}, 0);
    }
    if(titleblock) tl.from(titleblock, {opacity:0, x:-20, duration:.5, ease:'power2.out'}, .25);
    if(callouts.length) tl.from(callouts, {opacity:0, y:-4, duration:.4, stagger:.07, ease:'power2.out'}, .55);

    // ACT 2 · FABRICATION — welds + sparks pulse
    if(forge){
      tl.to(forge, {opacity:1, duration:.5, ease:'power2.out'}, 1.4);
      tl.to({}, {duration:.6}, 1.9);
      tl.to(forge, {opacity:0, duration:.45, ease:'power2.in'}, 2.45);
    } else {
      tl.to({}, {duration:1.5}, 1.4);
    }

    // ACT 3 · CONSTRUCTED — real photo wipes in
    if(reality)   tl.to(reality,   {clipPath:'inset(0 0% 0 0)', duration:1.2, ease:'power2.inOut'}, 2.6);
    if(blueprint) tl.to(blueprint, {opacity:0, duration:.8, ease:'power2.in'}, 3.0);
    if(reality)   tl.to(reality,   {scale:1.06, duration:1, ease:'none', transformOrigin:'center center'}, 3.2);
  }

  function initBlueprint(){
    document.querySelectorAll('.bp-stage').forEach(initBlueprintStage);
  }

  /* -------- Form ---------- */
  const form = document.querySelector('.form');
  form?.addEventListener('submit', e=>{
    e.preventDefault();
    const btn = form.querySelector('.form__submit');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Message sent';
    btn.style.background = 'var(--ember-2)';
    setTimeout(()=>{ btn.innerHTML = orig; btn.style.background=''; form.reset(); }, 2400);
  });

});
