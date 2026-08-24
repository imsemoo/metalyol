# 004 — Add press feedback to buttons and pressable cards

- **Status**: TODO
- **Commit**: ff6a97f
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (css/style.css), ~25 lines

## Problem

There is not a single `:active` rule in all 4703 lines of `css/style.css`. Buttons lift on hover (`.btn-primary:hover { transform: translateY(-2px) }`, css/style.css:291-294) but pressing them does nothing — the press, the one moment the user is physically acting on the element, is dead. This also means **touch users get zero motion feedback at all** (hover states don't apply to them; `:active` does).

```css
/* css/style.css:240-250 — current (abridged) */
.btn {
  ...
  transition: transform .25s ease, color .25s ease, box-shadow .25s ease, border-color .25s ease;
  ...
}
```

```css
/* css/style.css:1603 — current: .bp__view has no transform in its transition list,
   so a transform-based press state would snap on release */
.bp__view { transition: background .25s ease, border-color .25s ease, gap .25s ease; }
```

## Target

Pressed elements compress subtly and quickly; release springs back at the element's normal transition speed (asymmetric: fast in ~100ms, normal out ~250-300ms):

- `.btn`, `.bp__view`, `.nav__burger`, `.wa-float` → `:active` scale **.97**
- `.hero__service`, `.op-card` (large cards) → `:active` scale **.98** (bigger surface, subtler compression)
- Press-in duration **.1s**; release inherits each element's existing transition (.25-.3s).

Scale stays within the 0.95-0.98 press-feedback band — never lower.

## Repo conventions to follow

- The house strong ease-out is `cubic-bezier(.2, .8, .2, 1)` (css/style.css:141) — use it where a transform transition must be added.
- Section-comment style is the `/* ---------- Name ---------- */` banner (e.g. css/style.css:128); give the new block one.
- Selectors already grouped multi-line elsewhere (e.g. the `:focus-visible` group at css/style.css:81-87) — follow that formatting.

## Steps

1. **css/style.css:1603** — add `transform` to `.bp__view`'s transition list so release animates:

   ```css
   /* target */
   .bp__view { transition: background .25s ease, border-color .25s ease, gap .25s ease, transform .25s cubic-bezier(.2, .8, .2, 1); }
   ```

2. **css/style.css** — append at the very end of the file (after the last rule, so these win the cascade against `:hover` transforms of equal specificity):

   ```css
   /* ---------- Press feedback (see plans/004) ---------- */
   .btn:active,
   .bp__view:active,
   .nav__burger:active,
   .wa-float:active {
     transform: scale(.97);
     transition-duration: .1s;
   }

   .hero__service:active,
   .op-card:active {
     transform: scale(.98);
     transition-duration: .1s;
   }
   ```

   Note `transition-duration: .1s` deliberately shortens **all** transitioning properties during the pressed state (color, box-shadow too) — the press should feel immediate across the board; on release, each element's own rule restores its normal durations.

3. Before appending, confirm each selector exists in the codebase (`grep -n "nav__burger\|wa-float\|hero__service\|op-card\|bp__view" css/style.css`). If any of the six does not exist at all, drop that selector from the block and note it in your report — do not guess replacements.

4. **7 HTML pages** — bump `?v=` on `css/style.css` (skip if already bumped in this working tree by an earlier plan and the file hasn't shipped since).

## Boundaries

- Do NOT add press states to non-pressable elements (`.why__item` rows, links in body text, footer links) — text and full-width rows compressing feels wrong.
- Do NOT touch any `:hover` rule.
- Do NOT introduce scale below .95 anywhere.
- Do NOT add new dependencies.
- If the code at the cited lines doesn't match (drift since ff6a97f), STOP and report.

## Verification

- **Mechanical**: local server; no console errors; the appended block is the last rules in the file.
- **Feel check**:
  - Press-and-hold the hero's primary CTA: it compresses to .97 quickly; release: it springs back over .25s and re-acquires the hover lift (`translateY(-2px)`) without a jump. Watch at 10% speed in the Animations panel: press-in must be visibly faster than release.
  - Press a `.bp__view` "view project" button: compress and release both animate (no snap on release — that's what step 1 fixes).
  - On a touch viewport (DevTools device emulation, 375px): tap any button — the compression is visible during the tap.
  - Rapid-fire click a button: the scale retargets fluidly, never restarts from rest (transitions, not keyframes, guarantee this — just confirm nothing flickers).
- **Done when**: every listed pressable compresses on press and springs back on release, asymmetric timing verified, hover behavior unchanged.
