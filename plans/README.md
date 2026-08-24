# Animation improvement plans — Metalyol

Written by the `improve-animations` audit at commit `ff6a97f` (2026-08-24). Each plan is self-contained — an executor needs zero context beyond the plan file. Run one with `improve-animations execute <plan>` or hand it to any agent.

## Plans

| # | Plan | Severity | Files touched | Status |
| --- | --- | --- | --- | --- |
| 001 | [Loader session gate](001-loader-session-gate.md) | HIGH | js/main.js, css/style.css, 8 HTML | **DONE** |
| 002 | [Particles reduced-motion + offscreen pause](002-particles-reduced-motion-pause.md) | MEDIUM | js/main.js | **DONE** |
| 003 | [Cursor rAF stop + scale-based grow](003-cursor-loop-and-scale.md) | MEDIUM | js/main.js, css/style.css | **DONE** |
| 004 | [Press feedback](004-press-feedback.md) | MEDIUM | css/style.css | **DONE** |
| 005 | [Mobile menu transitions](005-mobile-menu-transitions.md) | MEDIUM | css/style.css | **DONE** |

All five executed together; assets bumped to `?v=7` across the 8 pages.

## Execution notes

- **001** also added the inline `<head>` gate script to the 7 pages that carry the loader, and shortened the logo-centering tween to 450ms to match the new boot delay. Verified: first view arms `sessionStorage.metalyol-loader`, later views paint with `html.loader-seen`, `display:none` on the stage and no scroll lock. The skip path on `/projects/*` was the risky part — confirmed `project.js` still boots through its `else` branch when `body.lock` never appears.
- **002** particle count also dropped 60 → 28 with lower alpha as part of the hero de-cluttering (see below), not just the reduced-motion/offscreen gating the plan called for.
- **003** the `.cursor` rules were rewritten wholesale; JS now writes `translate` and CSS owns `transform`.

## Verification

The in-app preview pane did not composite frames, so nothing time-based could be observed there. Verification was redone by driving real headless Chrome through `puppeteer-core`, which runs rAF, CSS transitions and IntersectionObserver normally. Measured results:

| Check | Result |
| --- | --- |
| Loader plays, boots, arms the session flag | `is-done` @2580ms, `is-finishing` @3007ms, flag set |
| Logo reaches centre before the slide-up (001) | top `342px` → `449.98px` (target 450) with a 427ms gap |
| Cursor rests at 10px, grows to 44px, compresses on press | `10px` → `44px` → `37px` → back to `44px` |
| Cursor keeps tracking while pressed (was frozen before) | centre lands exactly on the pointer at `900,600` |
| Cursor rAF loop parks when the mouse stops (003) | 33 ticks while moving, 3 tail ticks then zero |
| Button press compression / release (004) | `scale(0.970)` on press, `scale(1.000)` after |
| Mobile menu opens with real motion (005) | `0.00 → 0.53 → 0.89 → 0.97 → 1.00` |
| Menu reverses mid-flight without restarting | caught at `0.11`, rose straight back to `1.00` |
| Menu closes with motion, no hard cut | `1.00 → 0.26 → 0.05 → 0.01 → 0.00` |
| Particles draw at the hero, stop when scrolled away (002) | 87 frames/600ms → 0 frames/600ms |
| Reduced motion: no particle drawing, copy still visible | 0 frames, headline `opacity: 1` |

Cross-page sweep at 1440px and 375px over all 8 pages: no horizontal overflow, no console errors, no failed requests, no stale asset versions.

One accepted trade-off: at 375px the WhatsApp float clips the bottom-right corner of the *secondary* hero CTA once the cookie bar is dismissed. The primary CTA is clear, the secondary's label stays readable, and the hero column has no spare vertical room on a phone — standard floating-button behaviour, left as is.

## Hero de-cluttering (not from a plan)

Done in the same pass, in response to the hero reading as visually crowded:

- Grid mask inverted — it used to peak at dead centre, exactly under the headline; opacity `.4` → `.22`.
- New `.hero__scrim` layer (z-index 2, above every decorative layer, below the copy) calms the text column without swallowing the bottom-left ember glow.
- Particle canvas thinned to 28 at `opacity: .7`.
- The three-service card trio became a spec strip: no box, no blur, no radius, hairline dividers, icon tile dropped, descriptions cut to one line. Card `305×215` → `253×108`; block `217px` → `110px`; hero content run `674px` → `511px` of a 900px viewport, slack below the CTA `26px` → `143px`.
- Mobile rows collapsed to `number · name` with the spec beneath: `96px` → `67px` per row, which pulls the CTA back above the fold (`−45px` → `+41px`).
- The three FontAwesome glyphs were dropped from the strip entirely — at 13px they rendered as illegible grey specks, adding noise while the `01/02/03` numbers already did the indexing. The Services section below keeps its proper 44px icon tiles.
- Right-hand I-beam in the hero SVG raised from `.06`/`.18` to `.11`/`.3` so the empty right half reads as deliberate structure rather than dead space.
- Scroll hint moved from bottom-right to bottom-left — it was sitting underneath the WhatsApp float, and the left edge matches the left-aligned copy.
- Cookie bar: copy cut to one line and the mobile layout kept as a single row instead of stacking. It was ~140px tall on a phone and buried both hero CTAs; the float is now hidden while the bar is up and returns when it is dismissed.

## Deferred findings (audited, not planned)

From the audit table, unselected: scroll-handler layout thrash (js/main.js:229-240), motion-token consolidation, accordion hover `padding-left` animation (css/style.css:2085), JS smooth-scroll ignoring reduced motion (js/main.js:245-255), tilt-tile snap on mouseleave (js/project.js:126-129), loader bar width transitions, spec-layer crossfade dip. Re-run the audit or ask for `plan <description>` to spec any of these later.
