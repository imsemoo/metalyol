/* ==========================================================================
   METALYOL — main.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------- Preloader ---------- */
  const pre = document.querySelector('.preloader');
  const preLogo = document.querySelectorAll('.preloader__logo span');
  const preCount = document.querySelector('.preloader__counter');
  const preBar = document.querySelector('.preloader__bar');

  document.body.classList.add('lock');

  const preTl = gsap.timeline();
  preTl
    .to(preLogo, {y:0, duration:.8, ease:'power3.out', stagger:.04})
    .to({}, {duration:1.4, ease:'power2.inOut',
      onUpdate(){
        const v = Math.round(this.progress()*100);
        preCount.textContent = String(v).padStart(3,'0') + '%';
        preBar.style.setProperty('--p', this.progress());
      }
    }, '-=.3')
    .to('.preloader', {yPercent:-100, duration:1, ease:'power3.inOut',
      onComplete(){ pre.style.display='none'; document.body.classList.remove('lock'); initAll(); }
    }, '+=.15');

  /* -------- Nav ---------- */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const links = document.querySelectorAll('.nav__menu a');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
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
      window.scrollTo({top:t.offsetTop - 70, behavior:'smooth'});
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
    initBlueprint();
  }

  /* -------- Hero entry ---------- */
  function initHero(){
    const tl = gsap.timeline();
    tl
      .from('.hero .eyebrow', {y:20, opacity:0, duration:.7, ease:'power3.out'})
      .from('.hero__headline .line span', {yPercent:110, duration:1, stagger:.08, ease:'power4.out'}, '-=.4')
      .from('.hero__sub', {y:20, opacity:0, duration:.7, ease:'power3.out'}, '-=.5')
      .from('.hero__service', {y:30, opacity:0, duration:.7, stagger:.1, ease:'power3.out', clearProps:'transform,opacity'}, '-=.4')
      .from('.hero__cta > *', {y:20, opacity:0, duration:.6, stagger:.08, ease:'power3.out'}, '-=.4')
      .from('.hero__scroll', {opacity:0, duration:.6}, '-=.2');

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

  /* -------- Reveals ---------- */
  function initReveals(){
    gsap.utils.toArray('.section-head').forEach(h=>{
      gsap.from(h.children, {
        opacity:0, y:30, duration:.9, stagger:.1, ease:'power3.out',
        scrollTrigger:{trigger:h, start:'top 85%'}
      });
    });
    gsap.utils.toArray('.service').forEach((s,i)=>{
      gsap.from(s, {
        opacity:0, y:40, duration:.8, ease:'power3.out', delay:i*.08,
        scrollTrigger:{trigger:s, start:'top 85%'}
      });
    });
    gsap.utils.toArray('.why__item').forEach(item=>{
      gsap.from(item, {
        opacity:0, x:-30, duration:.8, ease:'power3.out',
        scrollTrigger:{trigger:item, start:'top 85%'}
      });
    });
    gsap.utils.toArray('.op-card').forEach((c,i)=>{
      gsap.from(c, {
        opacity:0, y:40, duration:.8, ease:'power3.out', delay:i*.06,
        scrollTrigger:{trigger:c, start:'top 90%'}
      });
    });
    gsap.from('.footer__monogram', {
      opacity:0, y:60, duration:1.2, ease:'power3.out',
      scrollTrigger:{trigger:'.footer__monogram', start:'top 90%'}
    });
  }

  /* -------- Counters ---------- */
  function initCounters(){
    document.querySelectorAll('[data-count]').forEach(el=>{
      const target = +el.dataset.count;
      const obj = {v:0};
      gsap.to(obj, {
        v:target, duration:2.2, ease:'power2.out',
        scrollTrigger:{trigger:el, start:'top 85%'},
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

  /* -------- BLUEPRINT → FABRICATION → REALITY scrub ---------- */
  function initBlueprint(){
    const stage = document.querySelector('.bp-stage');
    if(!stage) return;

    const bp = document.querySelector('.bp');
    const lines = document.querySelectorAll('.bp__blueprint .bp__lines path, .bp__blueprint .bp__lines line');
    const callouts = document.querySelectorAll('.bp__dims .bp__callout');
    const titleblock = document.querySelector('.bp__titleblock');
    const forge = document.querySelector('.bp__forge');
    const reality = document.querySelector('.bp__reality');
    const blueprint = document.querySelector('.bp__blueprint');
    const fill = document.querySelector('.bp__progress-fill');
    const pct = document.querySelector('.bp__progress-pct');
    const phaseItems = document.querySelectorAll('.bp__phase-item');

    // Initial line-draw state — each line hidden via stroke-dashoffset = length
    lines.forEach(el=>{
      const len = el.getTotalLength ? el.getTotalLength() : 400;
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    });

    const tl = gsap.timeline({
      scrollTrigger:{
        trigger:stage,
        start:'top top',
        end:'bottom bottom',
        scrub:.6,
        onUpdate(self){
          const p = Math.round(self.progress*100);
          fill.style.width = p+'%';
          pct.textContent = p+'%';
          // 3-act phase logic
          let phase = 0;
          if(self.progress > .30) phase = 1;
          if(self.progress > .66) phase = 2;
          phaseItems.forEach((it,i)=>{
            it.classList.toggle('is-active', i===phase);
          });
          // Container state classes — drive ember glow / steel glow via CSS
          bp.classList.toggle('is-forging', phase === 1);
          bp.classList.toggle('is-real', phase === 2);
        }
      }
    });

    // ============ ACT 1 · BLUEPRINT (0 → 1.2 timeline / 0–30% scroll) ============
    tl.to(lines, {strokeDashoffset:0, duration:1.2, ease:'power2.out', stagger:{each:.004, from:'start'}}, 0);
    tl.from(titleblock, {opacity:0, x:-20, duration:.5, ease:'power2.out'}, .25);
    tl.from(callouts,   {opacity:0, y:-4, duration:.4, stagger:.07, ease:'power2.out'}, .55);

    // ============ ACT 2 · FABRICATION (1.4 → 2.5 / 30–66% scroll) ============
    tl.to(forge, {opacity:1, duration:.5, ease:'power2.out'}, 1.4);
    tl.to({}, {duration:.6}, 1.9);                                  // dwell on welding
    tl.to(forge, {opacity:0, duration:.45, ease:'power2.in'}, 2.45);

    // ============ ACT 3 · CONSTRUCTED (2.6 → 4 / 66–100% scroll) ============
    tl.to(reality,   {clipPath:'inset(0 0% 0 0)', duration:1.2, ease:'power2.inOut'}, 2.6);
    tl.to(blueprint, {opacity:0, duration:.8, ease:'power2.in'}, 3.0);
    tl.to(reality,   {scale:1.06, duration:1, ease:'none', transformOrigin:'center center'}, 3.2);
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
