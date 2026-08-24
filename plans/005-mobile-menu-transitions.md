# 005 — Make the mobile nav menu open/close interruptible and animated both ways

- **Status**: TODO
- **Commit**: ff6a97f
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file (css/style.css), ~30 lines. No JS changes.

## Problem

The mobile menu (≤900px) opens via a `display: none → flex` toggle plus an entrance keyframe animation, and closes by vanishing instantly:

```css
/* css/style.css:2470-2492 — current (inside the max-width: 900px media block) */
.nav__menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  background: rgba(10, 11, 13, .96);
  backdrop-filter: blur(20px);
  padding: 16px var(--gutter) 24px;
  border-bottom: 1px solid var(--line);
  transform-origin: top;
  animation: navMenuIn .25s ease both;
}

@keyframes navMenuIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.nav.open .nav__menu { display: flex; }
```

Three problems:

1. **Close is a hard cut** — `display: none` kills the panel mid-frame. Tapping a menu link (which closes the menu, js/main.js:243) teleports the UI.
2. **Not interruptible** — keyframes restart from zero; tapping the burger rapidly replays the entrance from scratch each time instead of retargeting.
3. Entrance uses the weak built-in `ease` instead of a deliberate ease-out.

The JS just toggles `.open` on `.nav` (js/main.js:242-243) — it needs no changes; this is CSS-only.

## Target

Visibility-based show/hide with transitions in both directions, retargetable mid-flight:

- Open: opacity 0→1, translateY(-8px)→0, **200ms `cubic-bezier(.2, .8, .2, 1)`**.
- Close: reverse, **150ms** (exits faster than entrances), with `visibility` flipping only after the fade completes.
- Closed panel is `visibility: hidden` + `pointer-events: none` (out of tab order and untouchable, same as `display:none` gave us, but transitionable).

## Repo conventions to follow

- `cubic-bezier(.2, .8, .2, 1)` is the house strong ease-out (css/style.css:141).
- All edits stay **inside the existing `@media (max-width: 900px)` block** — desktop `.nav__menu` (a plain inline flex row) must be untouched.
- The delayed-visibility pattern (`transition: ... visibility 0s linear .15s`) is standard; no repo precedent exists, so follow this plan's code exactly.

## Steps

1. **css/style.css:2470-2492** — replace the three blocks quoted above with:

   ```css
   .nav__menu {
     position: absolute;
     top: 100%;
     left: 0;
     right: 0;
     flex-direction: column;
     align-items: stretch;
     gap: 0;
     background: rgba(10, 11, 13, .96);
     backdrop-filter: blur(20px);
     padding: 16px var(--gutter) 24px;
     border-bottom: 1px solid var(--line);
     opacity: 0;
     transform: translateY(-8px);
     visibility: hidden;
     pointer-events: none;
     transition:
       opacity .15s cubic-bezier(.2, .8, .2, 1),
       transform .15s cubic-bezier(.2, .8, .2, 1),
       visibility 0s linear .15s;
   }

   .nav.open .nav__menu {
     opacity: 1;
     transform: translateY(0);
     visibility: visible;
     pointer-events: auto;
     transition:
       opacity .2s cubic-bezier(.2, .8, .2, 1),
       transform .2s cubic-bezier(.2, .8, .2, 1),
       visibility 0s;
   }
   ```

   Notes for the executor:
   - `display: none` is **removed** from `.nav__menu` here — the element keeps the `display: flex` it needs from the open state at all times; being `position: absolute` + `visibility: hidden` it occupies no space and paints nothing when closed. The base `.nav__menu` outside this media block already sets `display: flex`.
   - The `@keyframes navMenuIn` block and `transform-origin: top` line are deleted (origin was for the keyframe; translateY doesn't need it).
   - The `.nav.open .nav__menu { display: flex; }` rule is deleted (superseded by the visibility pattern).

2. **7 HTML pages** — bump `?v=` on `css/style.css` (skip if already bumped in this working tree and unshipped).

## Boundaries

- Do NOT touch js/main.js — the `.open` class toggle stays the only mechanism.
- Do NOT touch the desktop `.nav__menu` rules outside the media block, the `.nav__menu a` rules, or the burger icon styles.
- Do NOT change the panel's look: background, blur, padding, border must be byte-identical.
- Do NOT add new dependencies.
- If the code at these lines doesn't match (drift since ff6a97f), STOP and report.

## Verification

- **Mechanical**: local server, DevTools at 375px wide. No console errors. With the menu closed, verify in the Elements panel that `.nav__menu` computes `visibility: hidden` and receives no pointer events (clicking where it would be hits the page).
- **Feel check** (375px):
  - Tap the burger: panel fades/slides in over 200ms with a decisive start (strong ease-out — verify at 10% playback that it launches fast and settles).
  - Tap the burger again mid-entrance: the panel **reverses from wherever it is** — no restart, no flash.
  - Tap a menu link: menu fades out (150ms) while the page smooth-scrolls — no hard cut.
  - Keyboard (still ≤900px): Tab through the page with the menu closed — menu links must be skipped (visibility:hidden removes them from tab order).
  - Desktop ≥901px: nav row identical to before — no absolute positioning, no fade.
- **Done when**: open and close both animate, mid-flight toggles retarget smoothly, closed menu is untabbable and unclickable, desktop untouched.
