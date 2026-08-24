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

All five executed together; assets bumped once to `?v=4` across the 8 pages.

## Execution notes

- **001** also added the inline `<head>` gate script to the 7 pages that carry the loader, and shortened the logo-centering tween to 450ms to match the new boot delay. Verified: first view arms `sessionStorage.metalyol-loader`, later views paint with `html.loader-seen`, `display:none` on the stage and no scroll lock. The skip path on `/projects/*` was the risky part — confirmed `project.js` still boots through its `else` branch when `body.lock` never appears.
- **002** particle count also dropped 60 → 28 with lower alpha as part of the hero de-cluttering (see below), not just the reduced-motion/offscreen gating the plan called for.
- **003** the `.cursor` rules were rewritten wholesale; JS now writes `translate` and CSS owns `transform`.

## Verification limits

The preview pane in the session that executed these did not composite frames, so `requestAnimationFrame`, CSS transitions and IntersectionObserver never advanced there. Static layout, cascade and wiring were verified by reading computed styles with transitions disabled; **the motion itself was never watched**. Before shipping, eyeball in a real browser:

- the loader's logo-centering on a first view (plan 001 step 6-7),
- cursor grow/press and that the loop parks when the mouse is idle (003),
- press compression on buttons and cards (004),
- mobile menu open/close and mid-flight reversal (005).

## Hero de-cluttering (not from a plan)

Done in the same pass, in response to the hero reading as visually crowded:

- Grid mask inverted — it used to peak at dead centre, exactly under the headline; opacity `.4` → `.22`.
- New `.hero__scrim` layer (z-index 2, above every decorative layer, below the copy) calms the text column without swallowing the bottom-left ember glow.
- Particle canvas thinned to 28 at `opacity: .7`.
- The three-service card trio became a spec strip: no box, no blur, no radius, hairline dividers, icon tile dropped, descriptions cut to one line. Card `305×215` → `253×108`; block `217px` → `110px`; hero content run `674px` → `511px` of a 900px viewport, slack below the CTA `26px` → `143px`.
- Mobile rows collapsed to `number · icon · name` with the spec beneath: `96px` → `67px` per row, which pulls the CTA back above the fold (`−45px` → `+41px`).

## Deferred findings (audited, not planned)

From the audit table, unselected: scroll-handler layout thrash (js/main.js:229-240), motion-token consolidation, accordion hover `padding-left` animation (css/style.css:2085), JS smooth-scroll ignoring reduced motion (js/main.js:245-255), tilt-tile snap on mouseleave (js/project.js:126-129), loader bar width transitions, spec-layer crossfade dip. Re-run the audit or ask for `plan <description>` to spec any of these later.
