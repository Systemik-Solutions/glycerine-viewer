# Self-Drawing Logo Outline on the Startup Splash — Design

**Date:** 2026-08-31
**Status:** Approved (design phase)
**Component target:** `src/components/GlycerineViewer.vue` (+ new `src/components/GlycerineLogo.vue`)

## 1. Purpose & scope

The Glycerine Platform brand mark has been redesigned. The startup splash still shows the old
mark (`src/assets/logo.png`, a 500×303 blue/orange raster) with a `grayscale(1) → grayscale(0)`
pulse. This work replaces it with the new outline mark, animated so that it **draws itself from
nothing to the complete outline** on a loop, instead of fading.

Source artwork: `Outline - White.svg` from the branding pack
(`Workbench Update files/`). `viewBox="0 0 386.45 383.05"`, a single `<path>` whose two subpaths
are the outer and inner edges of a thin ribbon — the silhouette of the mark rendered as a hollow
outline.

The splash block at `GlycerineViewer.vue:376-383` is the **only** place a logo image appears in
the viewer. The `gv-powered-by` footer (line 267) is text-only, and `README.md` has no logo
references.

**Out of scope:**

- The wordmark. The splash shows the **mark only**, matching what the old splash showed.
  `Logos White.svg` (the mark + "Glycerine" lockup) is not used.
- The solid mark. `Solid White.svg` is not used; the animation resolves to the outline artwork
  and stops there.
- The brand's `Logo Animation.mp4` is illustration only and is **not** being matched.
- No new props, emits, or i18n keys — so the three-way sync between
  `GlycerineViewer.vue` / `jslib/main.js` / `README.md` described in `CLAUDE.md` does not apply.
- The splash background (`bg-gray-900`), its flex layout, and the `manifestErrors` block below the
  logo are unchanged.

## 2. Chosen animation

Four choreographies and three loop resets were prototyped and reviewed. The selected combination is
**A1 + L1**:

**A1 — "Opposed" contour trace.** Both contours are stroked as hairlines and drawn from their own
natural start points in their own natural directions. The outer contour begins at the top-left of
the mark, the inner at the bottom-right, and the two run counter to each other. This needs no phase
correction of any kind.

**L1 — "Snake" reset.** After the outline completes and holds, the line keeps travelling forward
and slides out the way it came in, then the cycle repeats. Motion is always in one direction, so it
never reads as undoing itself — which matters on a loading screen, where a visible rewind can imply
failure.

### Measured geometry

These numbers were measured from the artwork and are recorded for reference. **The implementation
does not hardcode them** (see §4).

| Property | Value |
| --- | --- |
| viewBox | `0 0 386.45 383.05` |
| Outer contour length | 1064.61 |
| Inner contour length | 1020.34 |
| Ribbon thickness | 7.05 min / 7.28 mean / 7.53 max — effectively uniform |
| Inner contour winding | Antiparallel to the outer (tangent dot = −1.000) |

### Timeline

One 5200ms cycle, `linear`, `infinite`:

| Phase | Duration | Keyframe | `stroke-dashoffset` |
| --- | --- | --- | --- |
| Draw | 2400ms | 0% → 46.15% | `1000` → `0` |
| Hold | 900ms | → 63.46% | `0` |
| Snake out | 1400ms | → 90.38% | `0` → `-1000` |
| Gap | 500ms | → 100% | `-1000` |

## 3. New component — `src/components/GlycerineLogo.vue`

A self-contained presentational component. It knows how to draw the mark and nothing about
loading, manifests, or the viewer.

**Why inline SVG rather than `<img src="…svg">`:** CSS cannot reach inside an `<img>`, so the paths
must be in the document for `stroke-dashoffset` to be animatable. Inlining in a `.vue` file also
means the artwork is compiled into both the `dist/` library and the `jslib/` UMD bundle with no
asset-emission or externalization concerns in either Vite config.

**Markup:**

- Root `<svg>` with `viewBox="0 0 386.45 383.05"`, `role="img"`, `aria-label="Glycerine"`
  (preserving the old `alt="Glycerine"`).
- Two `<path>` elements carrying the outer and inner subpath data **copied verbatim** from
  `Outline - White.svg`. The subpaths begin `M142.42,36.02…` and `M238.18,279.14…` respectively.
- Shared presentation: `fill="none"`, `stroke="currentColor"`, `stroke-width="2.6"`,
  `stroke-linecap="round"`, `pathLength="1000"`.

**Interface:**

| | |
| --- | --- |
| Prop | `animated: Boolean`, default `false` |
| Colour | `stroke="currentColor"` — the parent decides |
| Size | a CSS width on the host element — the parent decides |

`animated` toggles a single class (`is-animated`) on the two paths; it is the component's only
input. When `false`, the outline renders complete and static — no `stroke-dasharray` is applied at
all, so there is nothing to animate and nothing to reset.

The `@keyframes` block lives in `GlycerineLogo.vue`'s own `<style scoped>`. Vue rewrites keyframe
names within a scoped block, and the rule referencing it sits in the same block, so this is safe.

The component is **internal**. It is not added to the public exports in `src/main.js`.

## 4. Length normalisation

The two contours are different lengths (1064.61 and 1020.34), so a naive implementation needs two
keyframe blocks with two hardcoded numbers.

Instead, both paths carry `pathLength="1000"`. This declares a synthetic length that
`stroke-dasharray` and `stroke-dashoffset` are resolved against, so **one shared `@keyframes` block
drives both paths** and both complete together and exactly.

This was verified in Chrome: at `stroke-dasharray: 1000; stroke-dashoffset: 0`, both contours close
completely with no gap, despite their differing real lengths.

The reason to prefer this over hardcoded lengths: the brand was only just redesigned and may
iterate. Hardcoded lengths would silently desync if the artwork is revised, whereas `pathLength`
adapts. Should a browser ever ignore the attribute, the degradation is mild and obvious — a short
unclosed gap in the outline — not a broken animation.

## 5. Behaviour

`:animated="manifestIsLoading"` — the same condition that gates the current pulse.

| State | Appearance |
| --- | --- |
| Loading | Outline draws, holds, snakes out, repeats |
| Not loading (idle, or error with `manifestErrors` shown below) | Outline complete and static |

The static resting state replaces today's static-grayscale one.

**Reduced motion:** under `@media (prefers-reduced-motion: reduce)`, the animation is suppressed and
the completed outline is shown. This is new behaviour — the existing pulse does not honour the
preference.

**Size:** the host is set to `200px`. Note this is a deliberate increase in presence: the old PNG
was 500×303, so `max-width: 200px` rendered it at roughly 200×121, whereas the new mark is square
and renders at 200×200. 200px is the size the prototypes were reviewed at.

**Colour:** the splash sets `color: #f1f1ed` (the artwork's own off-white) against the unchanged
`bg-gray-900` background.

## 6. Changes to `GlycerineViewer.vue`

| Line | Change |
| --- | --- |
| 377 | Replace the `<img>` with `<GlycerineLogo :animated="manifestIsLoading" />` |
| 393 | Remove `import logoPath from '@/assets/logo.png';` |
| 393 area | Add the `GlycerineLogo` import |
| 426-428 | Register `GlycerineLogo` in `components` |
| 1206 | Remove the `logoPath` entry from the `setup()` return |
| 1956-1974 | Replace the `/* Start up */` block — drop `.gv-start-logo.animation` and `@keyframes pulse`, and redefine `.gv-start-logo` |

The redefined `.gv-start-logo` keeps its name and position and becomes the splash's sizing and
colour hook, applied to the component as `<GlycerineLogo class="gv-start-logo" … />`:

```css
/* Start up */
.gv-start-logo {
    width: 200px;
    color: #f1f1ed;
}
```

`GlycerineViewer.vue`'s `<style>` block is `scoped`. A child component's root element still
receives the parent's scope attribute, so this rule reaches the `<svg>` without `:deep()`.

## 7. Asset changes

- **Add** `Outline - White.svg`'s two subpaths, inlined into `GlycerineLogo.vue`.
- **Delete** `src/assets/logo.png`. After the change above it has no remaining referents.

## 8. Verification

There is no test runner in this repo (`CLAUDE.md`), so verification is by inspection in a running
viewer, which the user starts and provides a URL for:

1. During manifest load, the outline draws from nothing, holds complete, and snakes away on a
   ~5.2s loop.
2. At full draw the shape matches `Outline - White.svg` — both contours closed, no gap.
3. Once loaded, and in the manifest-error state, the outline is complete and static.
4. With reduced motion enabled at the OS level, the outline is complete and static.
5. `npm run build` and `npm run build-lib` both succeed, and the logo animates in the UMD widget as
   well as the Vue library.
