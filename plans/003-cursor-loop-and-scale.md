# 003 — Stop the cursor rAF loop when settled; grow via scale, not width/height

- **Status**: TODO
- **Commit**: ff6a97f
- **Severity**: MEDIUM
- **Category**: Performance + Physicality
- **Estimated scope**: 2 files (js/main.js, css/style.css), ~30 lines

## Problem

Three defects in the custom ember cursor (desktop only):

1. **The rAF loop never exits.** `running` is set once and never reset, so after the first mousemove the loop runs at ~60fps for the life of the page even when the mouse is idle — permanent main-thread work.

   ```js
   /* js/main.js:415-428 — current */
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
   ```

2. **Hover growth animates `width`/`height`** — layout properties — and this fires on every interactive element hover, one of the highest-frequency interactions on the site.

3. **Press feedback snaps.** `.cursor.is-down` changes `transform`, but `transform` is not in the transition list, so the scale-down is instant. It also stomps the JS-set inline `transform`, breaking position while pressed.

   ```css
   /* css/style.css:129-161 — current */
   .cursor {
     position: fixed;
     top: 0;
     left: 0;
     width: 10px;
     height: 10px;
     border-radius: 50%;
     background: var(--ember);
     pointer-events: none;
     z-index: 9998;
     transform: translate3d(-50%, -50%, 0);
     transition:
       width .3s cubic-bezier(.2, .8, .2, 1),
       height .3s cubic-bezier(.2, .8, .2, 1),
       background .3s ease,
       border-color .3s ease,
       box-shadow .3s ease;
     border: 2px solid transparent;
     box-sizing: border-box;
     will-change: transform, width, height;
   }

   .cursor.is-hover {
     width: 44px;
     height: 44px;
     background: transparent;
     border-color: var(--ember);
     box-shadow: 0 0 18px rgba(175, 15, 15, .55);
   }

   .cursor.is-down {
     transform: translate3d(-50%, -50%, 0) scale(.8);
   }
   ```

## Target

- Position moves via the standalone `translate` CSS property (set from JS); size via `transform: scale(var(--s))` (set from CSS classes). The two never collide, and everything animated is compositor-friendly.
- The element is laid out **once** at 44×44px; the resting dot is `scale(.227)` (= 10px visually). Hover: `scale(1)`. Press: `scale(.85)` while hovering, `scale(.18)` on the bare dot.
- `transform` transitions in **250ms `cubic-bezier(.2, .8, .2, 1)`**; press-in snaps faster via a **100ms** duration on the `.is-down` state (fast in, springy out — asymmetric on purpose).
- The rAF loop cancels itself once the lerp has settled (< 0.1px from target) and restarts on the next mousemove.

## Repo conventions to follow

- `cubic-bezier(.2, .8, .2, 1)` is the house strong ease-out (`css/style.css:141`) — keep it for the grow/shrink.
- The settle-and-stop rAF pattern matches how `initHeroParallax` already avoids redundant frames (js/main.js:351-366 — it only schedules a frame when there is new input).

## Steps

1. **css/style.css:129-161** — replace the three `.cursor` rules with:

   ```css
   .cursor {
     position: fixed;
     top: 0;
     left: 0;
     width: 44px;
     height: 44px;
     border-radius: 50%;
     background: var(--ember);
     pointer-events: none;
     z-index: 9998;
     transform: translate(-50%, -50%) scale(var(--s, .227));
     transition:
       transform .25s cubic-bezier(.2, .8, .2, 1),
       background .3s ease,
       border-color .3s ease,
       box-shadow .3s ease;
     border: 2px solid transparent;
     box-sizing: border-box;
     will-change: translate, transform;
   }

   .cursor.is-hover {
     --s: 1;
     background: transparent;
     border-color: var(--ember);
     box-shadow: 0 0 18px rgba(175, 15, 15, .55);
   }

   .cursor.is-down { --s: .18; transition-duration: .1s, .3s, .3s, .3s; }
   .cursor.is-hover.is-down { --s: .85; }
   ```

   Keep the `@media (max-width: 900px), (hover: none), (pointer: coarse) { .cursor { display: none; } }` rule (line 163-164) unchanged.

2. **js/main.js:415-428** — replace the position-driving code with a settling loop that writes `translate` instead of `transform`:

   ```js
   let mx = 0, my = 0, cx = 0, cy = 0, raf = null;
   const lerp = (a, b, n) => a + (b - a) * n;

   document.addEventListener('mousemove', e => {
     mx = e.clientX; my = e.clientY;
     if(!raf) raf = requestAnimationFrame(loop);
   }, {passive:true});

   function loop(){
     cx = lerp(cx, mx, .22);
     cy = lerp(cy, my, .22);
     cursor.style.translate = cx + 'px ' + cy + 'px';
     if (Math.abs(mx - cx) < .1 && Math.abs(my - cy) < .1) {
       cursor.style.translate = mx + 'px ' + my + 'px';
       raf = null;
       return;
     }
     raf = requestAnimationFrame(loop);
   }
   ```

3. **7 HTML pages** — bump `?v=` on `css/style.css` and `js/main.js` (skip if already bumped in this same working tree by an earlier plan and neither file shipped since).

## Boundaries

- Do NOT touch the hover-target selector list (js/main.js:430) or the mouseenter/mouseleave opacity handlers (js/main.js:439-440).
- Do NOT change the visual size of either cursor state: dot must render at 10px, ring at 44px. (Note: at `scale(.227)` the 2px border and box-shadow scale down too — the border is transparent in that state, so this is invisible. Confirm in the feel check.)
- Do NOT add new dependencies.
- If the code at these lines doesn't match (drift since ff6a97f), STOP and report.

## Verification

- **Mechanical**: local server, desktop viewport ≥ 901px wide with a mouse. DevTools → Performance: move the mouse, stop; within ~1s the rAF activity must flatline to zero. No console errors.
- **Feel check**:
  - Move the mouse: dot follows with the same elastic lag as before (lerp .22 unchanged).
  - Hover a nav link: dot grows into the 44px ring smoothly — verify in the Animations panel at 10% speed that it is a single scale, no size pop or reflow flash.
  - Press and hold on empty background: dot shrinks quickly (~100ms); release: it springs back over 250ms. Press while hovering a button: ring contracts slightly to .85 — and the cursor **keeps tracking the mouse while pressed** (the old code froze position on press; the new one must not).
  - Hover on/off rapidly across a row of links: growth retargets mid-flight, never restarts from the dot.
- **Done when**: rAF stops when idle, all cursor motion is `translate`/`transform` only, press state is transitioned and position-safe.
