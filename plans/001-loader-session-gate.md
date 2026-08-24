# 001 — Play the preloader once per session, skip on repeat views

- **Status**: TODO
- **Commit**: ff6a97f
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 9 files (js/main.js, css/style.css, 7 HTML pages), ~60 lines

## Problem

Every one of the 7 pages (index, about, privacy, terms, 3 project pages) embeds the full-screen preloader and `js/main.js` plays the complete 2.5s sequence plus ~0.8s exit on **every page load**, with `body.lock` blocking scroll the whole time. Navigating index → project → back costs ~3.3s of forced waiting per hop. Even privacy.html and terms.html play it. Per the frequency rule (something seen on every navigation is high-frequency), this must not replay.

```js
/* js/main.js:36-61 — current */
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
  // ----- Timeline (2.5s) -----
  const TOTAL      = 2500;
```

Secondary bug in the same flow: on completion the stage gets `is-done`, which starts a **1s** `top` transition centering the logo, but `bootApp` fires after only **200ms**, so the logo is cut off ~20% into its move and the stage slides away mid-motion:

```js
/* js/main.js:198-204 — current */
if (p >= 1) {
  labelEl.textContent = 'Ready.';
  cancelAnimationFrame(raf);
  // Snap stage to "done" state for the centered logo, then boot.
  stage.classList.add('is-done');
  setTimeout(bootApp, 200);
  return;
}
```

```css
/* css/style.css:807-810 — current */
.loader-stage.is-done .loader-logo-zone {
  transition: top 1s cubic-bezier(.7, 0, .2, 1);
  top: 50%;
}
```

Timing constraint that makes a JS-only skip insufficient: the loader markup is inline in `<body>` and scripts load at the **end of body without `defer`** (`index.html:726`), so the loader is painted from first parse until `DOMContentLoaded`. A skip decided inside main.js would still flash the loader. The skip must be decided by a tiny inline script in `<head>`.

## Target

- **First page view of a browser session**: full sequence plays exactly as today (it is the brand intro — keep it).
- **Every subsequent page view in the same session** (`sessionStorage` key `metalyol-loader` = `'1'`): the loader never paints. An inline head script adds `loader-seen` to `<html>` before first paint; CSS hides the stage; main.js boots the page immediately with no scroll lock.
- Logo-centering cut fixed: transition shortened to **450ms `cubic-bezier(.2, .8, .2, 1)`** and boot delayed to match (450ms), so the move completes before the stage slides up.

## Repo conventions to follow

- localStorage/sessionStorage access is always wrapped in `try {} catch(_) {}` — copy the pattern from `js/main.js:278` (`initCookieBar`).
- The curve `cubic-bezier(.2, .8, .2, 1)` is this repo's house strong-ease-out (used at `css/style.css:141`, `:572`, `:1990`); use it for the logo move.
- Loader state classes are `is-on` / `is-off` / `is-done` / `is-finishing` on `.loader-stage` — the new skip class follows the same naming (`loader-seen` on `<html>` since it must exist before the stage does).

## Steps

1. **7 HTML pages** — `index.html`, `about.html`, `privacy.html`, `terms.html`, `projects/katara-towers.html`, `projects/lusail-marina-yacht-club.html`, `projects/lusail-multi-purpose-hall.html`: immediately **before** the `<link rel="stylesheet" href="...css/style.css">` tag in `<head>` (index.html:40; katara-towers.html:34; find the same tag in the others), insert:

   ```html
   <script>try{if(sessionStorage.getItem('metalyol-loader')==='1')document.documentElement.classList.add('loader-seen')}catch(_){}</script>
   ```

2. **css/style.css** — directly after the `.loader-stage.is-finishing` rule (line 812-815), add:

   ```css
   /* Repeat views in the same session skip the intro entirely (see 001 plan) */
   html.loader-seen .loader-stage { display: none; }
   ```

3. **js/main.js** — replace lines 36-37 (`document.body.classList.add('lock');` and the blank line after it) with:

   ```js
   let loaderSeen = false;
   try { loaderSeen = sessionStorage.getItem('metalyol-loader') === '1'; } catch(_) {}
   if (!loaderSeen && stage) document.body.classList.add('lock');
   ```

   Note: `stage` is declared on line 21 with `const` — move the whole block of element lookups (lines 21-34) **above** this new code so `stage` is in scope, or simply place the new code after line 34. Placing after line 34 is the smaller edit.

4. **js/main.js** — replace the branch at lines 53-56:

   ```js
   /* current */
   if (!stage) {
     // No loader on this page — boot immediately.
     bootApp();
   } else {
   ```

   with:

   ```js
   if (!stage || loaderSeen) {
     // No loader on this page, or already seen this session — boot immediately.
     bootApp();
   } else {
     try { sessionStorage.setItem('metalyol-loader', '1'); } catch(_) {}
   ```

   (the `sessionStorage.setItem` becomes the first statement inside the `else`).

5. **js/main.js** — in `bootApp` (lines 42-45), guard the exit animation so the skip path doesn't run a pointless 600ms timer on a hidden stage:

   ```js
   if (stage && !loaderSeen) {
     stage.classList.add('is-finishing');
     setTimeout(() => { stage.style.display = 'none'; }, 600);
   }
   ```

6. **js/main.js:203** — change `setTimeout(bootApp, 200);` to `setTimeout(bootApp, 450);`.

7. **css/style.css:807-810** — change the logo-centering transition:

   ```css
   /* target */
   .loader-stage.is-done .loader-logo-zone {
     transition: top .45s cubic-bezier(.2, .8, .2, 1);
     top: 50%;
   }
   ```

8. **7 HTML pages** — bump the cache-busting query on the two changed assets everywhere they are referenced: `css/style.css` → `css/style.css?v=2` and `js/main.js` → `js/main.js?v=2` (use `?v=N+1` if a `?v=` already exists; project pages use `../` prefixes).

## Boundaries

- Do NOT remove the loader markup from any page, and do NOT touch the loader's internal sequence (scan, sparks, service windows, timings other than the 200→450ms boot delay).
- Do NOT touch `js/project.js` — its `MutationObserver` watches `body.lock`; on the skip path `lock` is never added so its `else { boot(); }` branch (project.js:225-227) already handles it.
- Do NOT use `localStorage` — the key must expire with the session so returning visitors still get the intro.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since ff6a97f), STOP and report instead of improvising.

## Verification

- **Mechanical**: open the site via a local static server (e.g. `npx serve .` from the repo root). No console errors on index.html with DevTools open. In DevTools → Application → Session Storage, `metalyol-loader` = `1` after first load.
- **Feel check**:
  - Hard-refresh in a fresh tab (or after DevTools → Application → Clear session storage): full loader plays; at the end the logo glides to center and **completes its move** before the stage slides up — no visible cut. Re-check at 10% playback speed via DevTools Animations panel.
  - Click through index → a project page → back: the loader never appears, not even for a single frame (watch for a dark flash — there must be none), and the page scrolls immediately.
  - privacy.html and terms.html on repeat view: instant.
  - Reduced-motion (DevTools Rendering → emulate `prefers-reduced-motion`): first view still shows the loader structure (by design), repeat views skip it.
- **Done when**: full sequence exactly once per session; every subsequent navigation paints content directly with zero loader flash; logo centering completes cleanly on the first view.
