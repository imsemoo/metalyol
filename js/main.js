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
      .from('.hero__service', {y:30, opacity:0, duration:.7, stagger:.1, ease:'power3.out'}, '-=.4')
      .from('.hero__cta > *', {y:20, opacity:0, duration:.6, stagger:.08, ease:'power3.out'}, '-=.4')
      .from('.hero__scroll', {opacity:0, duration:.6}, '-=.2');

    gsap.to('.hero__grid', {
      yPercent:30, ease:'none',
      scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}
    });
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

  /* -------- BLUEPRINT → REALITY scrub ---------- */
  function initBlueprint(){
    const stage = document.querySelector('.bp-stage');
    if(!stage) return;

    const lines = document.querySelectorAll('.bp__blueprint .bp__lines path, .bp__blueprint .bp__lines line');
    const dims = document.querySelector('.bp__dims');
    const titleblock = document.querySelector('.bp__titleblock');
    const reality = document.querySelector('.bp__reality');
    const blueprint = document.querySelector('.bp__blueprint');
    const fill = document.querySelector('.bp__progress-fill');
    const pct = document.querySelector('.bp__progress-pct');
    const phaseItems = document.querySelectorAll('.bp__phase-item');

    // Set up line drawing initial state
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
          // phase
          let phase = 0;
          if(self.progress > .35) phase = 1;
          if(self.progress > .7) phase = 2;
          phaseItems.forEach((it,i)=>{
            it.classList.toggle('is-active', i===phase);
          });
        }
      }
    });

    // Phase 1: lines draw on (0 → 35%)
    tl.to(lines, {strokeDashoffset:0, duration:1, ease:'power2.out', stagger:{each:.005, from:'start'}}, 0);
    tl.from(dims, {opacity:0, duration:.4}, .4);
    tl.from(titleblock, {opacity:0, x:-20, duration:.4}, .3);

    // Phase 2: blueprint fades while reality wipes in (35% → 75%)
    tl.to(reality, {clipPath:'inset(0 0% 0 0)', duration:1.2, ease:'power2.inOut'}, 1.0);
    tl.to(blueprint, {opacity:0, duration:.8, ease:'power2.in'}, 1.4);

    // Phase 3: subtle zoom on the finished photo (75% → 100%)
    tl.to(reality, {scale:1.05, duration:1, ease:'none', transformOrigin:'center center'}, 2.0);
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
