# 002 — Gate hero particles behind reduced-motion and pause offscreen

- **Status**: TODO
- **Commit**: ff6a97f
- **Severity**: MEDIUM
- **Category**: Accessibility + Performance
- **Estimated scope**: 1 file (js/main.js), ~20 lines

## Problem

`initParticles` (js/main.js:444-477) draws 60 ambient particles on the hero canvas in a `requestAnimationFrame` loop that:

1. **Ignores `prefers-reduced-motion`.** Every other intro in this file checks the `reduceMotion` flag (main.js:10-11); this one doesn't. The global CSS kill-switch (`css/style.css:62-70`) cannot stop canvas drawing, so reduced-motion users get permanent ambient motion — exactly the "long-running animation" the CSS comment says it kills.
2. **Never stops.** The rAF loop runs at ~60fps forever — after the hero is scrolled far offscreen and for the whole life of the tab. Constant main-thread work and battery drain for pixels nobody sees.

```js
/* js/main.js:444-477 — current (abridged to the relevant lines) */
function initParticles(){
  const canvas = document.querySelector('.hero__canvas');
  if(!canvas) return;
  ...
  function tick(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p=>{ ... });
    requestAnimationFrame(tick);
  }
  tick();
}
```

## Target

- Reduced-motion users: the loop never starts (static empty canvas — the hero has other texture; a frozen single frame is not required).
- The loop runs **only while the hero is on screen**, controlled by an `IntersectionObserver`, storing and cancelling the rAF id.

## Repo conventions to follow

- The reduced-motion guard is a plain early return, exactly like `initHero` at js/main.js:328: `if(reduceMotion) return;`.
- The offscreen-pause pattern already exists in this file — imitate `initServiceCycle` (js/main.js:400-404), which uses `new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting ? start() : stop()), {threshold:.15})`.
- `reduceMotion` is already in scope inside `initParticles` (it is a `const` at the top of the `DOMContentLoaded` closure, main.js:10).

## Steps

1. **js/main.js:444** — add the guard as the first line of `initParticles`:

   ```js
   function initParticles(){
     if(reduceMotion) return;
     const canvas = document.querySelector('.hero__canvas');
     if(!canvas) return;
   ```

2. **js/main.js:464-476** — replace the tail of the function (from `function tick(){` through the closing `tick();` call) with a stoppable loop plus observer:

   ```js
     let raf = null;
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
       raf = requestAnimationFrame(tick);
     }

     // Draw only while the hero is on screen — saves cycles
     const io = new IntersectionObserver(entries=>{
       entries.forEach(e=>{
         if(e.isIntersecting){ if(!raf) raf = requestAnimationFrame(tick); }
         else if(raf){ cancelAnimationFrame(raf); raf = null; }
       });
     }, {threshold: 0});
     io.observe(canvas);
   ```

   The particle-drawing body inside `tick` is byte-identical to the current code — only the loop control changes. Note `tick()` is no longer called directly; the observer fires immediately on `observe()` and starts it.

3. **7 HTML pages** — bump `js/main.js` cache-busting query (`?v=N+1`) in `index.html`, `about.html`, `privacy.html`, `terms.html`, and the three `projects/*.html` (path there is `../js/main.js`). If plan 001 already bumped it in the same working tree, bump once more only if main.js changed again after that bump — one bump per release of the file is enough.

## Boundaries

- Do NOT touch the particle look: count (60), velocities, radii, alphas, hues stay byte-identical.
- Do NOT touch `initHeroParallax`, `initCursor`, or any other function.
- Do NOT add a `document.visibilitychange` handler — browsers already throttle rAF in hidden tabs; the IntersectionObserver covers the scrolled-away case.
- Do NOT add new dependencies.
- If the code at these lines doesn't match (drift since ff6a97f), STOP and report.

## Verification

- **Mechanical**: load index.html via a local server; no console errors. In DevTools → Performance, record 5s while scrolled to the footer: there must be **no** recurring `.hero__canvas`-related rAF/canvas work in the flame chart.
- **Feel check**:
  - At the top of the page, particles drift exactly as before (same density, same speed).
  - Scroll to the footer, wait, scroll back up: particles resume seamlessly.
  - Enable `prefers-reduced-motion` emulation (DevTools → Rendering) and hard-refresh: canvas stays empty and static; the rest of the hero still renders.
- **Done when**: particles visually unchanged for motion-tolerant users at the hero, zero rAF work when the hero is offscreen, zero drawing under reduced motion.
