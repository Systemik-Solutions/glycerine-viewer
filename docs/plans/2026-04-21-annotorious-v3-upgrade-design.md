# Annotorious v2 → v3 Upgrade — Design

Date: 2026-04-21
Branch: `annotorious-upgrade`

## Goal

Replace `@recogito/annotorious-openseadragon@^2.7.15` with `@annotorious/openseadragon@^3.x`
in the Glycerine Viewer. Preserve existing read-only behavior and visual semantics
(per-annotation color, hover/selected/highlighted/play-mode styling, light-level tint,
click-to-open-popup). OpenSeadragon stays at `^3.1.0` unless v3 proves incompatible.

## Scope

- In scope: a hard replacement of the Annotorious library and its usage inside
  `src/components/ImageViewer.vue`, the styling helper in `src/libraries/helper.js`,
  and the v2-specific CSS rules in `src/assets/styles.css`. Both Vite configs
  updated for the package rename. Both builds (`dist/`, `jslib/`) verified.
- Out of scope: upgrading OpenSeadragon, adding tests (repo has no test runner),
  any v2 compatibility shim, any public API changes to `GlycerineViewer.vue`
  props/events.

## Audit — current v2 footprint

Package `@recogito/annotorious-openseadragon@^2.7.15`, externalized in
`vite.config.js` as UMD global `Annotorious`.

Integration site: **`src/components/ImageViewer.vue` only**.

v2 APIs in use:

| v2 API | Location | v3 equivalent |
|---|---|---|
| `import Annotorious from '@recogito/annotorious-openseadragon'` | `ImageViewer.vue:11` | `import { createOSDAnnotator, W3CImageFormat } from '@annotorious/openseadragon'` |
| `import '.../annotorious.min.css'` | `ImageViewer.vue:12` | `import '@annotorious/openseadragon/annotorious-openseadragon.css'` |
| `Annotorious(viewer, { disableEditor, readOnly, formatters })` | `ImageViewer.vue:265-269` | `createOSDAnnotator(viewer, { userSelectAction: 'SELECT', adapter: W3CImageFormat(sourceUrl), style })` |
| `setAnnotations(webAnnotations)` | `:170, :272` | unchanged (with W3C adapter) |
| `clearAnnotations()` | `:168` | unchanged |
| `.on('selectAnnotation', cb)` | `:281` | `.on('selectionChanged', anns => cb(anns[0]))` — array payload |
| `.on('mouseEnterAnnotation', cb)` | `:287` | `.on('mouseEnterAnnotation', ann => …)` — no DOM element arg |
| `.on('mouseLeaveAnnotation', cb)` | `:293` | `.on('mouseLeaveAnnotation', ann => …)` — no DOM element arg |
| `cancelSelected()` | `:310` | unchanged |
| `fitBoundsWithConstraints(id)` | `:361` | `fitBounds(id)` |

CSS coupling in `src/assets/styles.css` (to be deleted):

- `.a9s-outer`, `.a9s-inner`, `.a9s-annotation`, `.a9s-selection`, `.a9s-annotationlayer`, `.a9s-point`
- `.rdwb-ano-shape` and its `.outline-normal/-light/-dark` variants
- `.ano-layer-fill-0 … .ano-layer-fill-100` (fill-opacity buckets)
- `.play-highlight`, `.highlighted` state classes

DOM queries in `ImageViewer.vue` (to be removed):

- `querySelector('.a9s-annotationlayer')` at `:299, :317` — used for light-level tint
- `querySelectorAll('.highlighted')` / `querySelector('[data-id="..."]')` at `:192-204` — highlight watcher
- `querySelectorAll('.play-highlight')` / `querySelector('.a9s-annotation[data-id='...']')` at `:350-358` — play-mode highlight

IIIF parser layer (`src/libraries/iiif/manifest-parser.js:241`): produces W3C-shape targets
with `FragmentSelector` (`xywh=pixel:...`) and `SvgSelector`. The v3 `W3CImageFormat`
adapter consumes this shape directly — no parser changes needed.

## Approach — "everything in the v3 style function"

v3 replaces v2's `formatters` (which returned `{ className, style }`) with a single
`style` function that returns a plain object: `{ fill, fillOpacity, stroke,
strokeOpacity, strokeWidth }`. There is no className-return channel.

Rather than try to preserve CSS class-based styling against v3's internal DOM, we
move all visual state into the style function. The styler receives the annotation
plus an `AnnotationState` (selection/hover), and we feed it local reactive state
(`highlightedAnnotationId`, `currentlyPlayingId`, `annotationFillOpacity`) via a
closure. This deletes all `.a9s-*` CSS and all DOM-query-driven class toggling.

Read-only behavior is preserved by `userSelectAction: 'SELECT'` (replaces v2's
`readOnly: true` + `disableEditor: true`). This fires `selectionChanged` on click
without showing edit handles — matching the current UX where clicking opens the
popup but never the shape editor.

## Target code shape

### Init (replaces `ImageViewer.vue:265-269`)

```js
import { createOSDAnnotator, W3CImageFormat } from '@annotorious/openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css';

this.annotorious = createOSDAnnotator(this.osdViewer, {
    userSelectAction: 'SELECT',
    adapter: W3CImageFormat(this.image),
    style: Helper.annotoriousStyle(() => ({
        highlightedId: this.highlightedAnnotationId,
        playingId: this.currentlyPlayingId,
        fillOpacity: this.annotationFillOpacity,
    })),
});
```

### New styler in `helper.js` (replaces `annotoriousFormatter`)

```js
static annotoriousStyle(getState) {
    return function (annotation, state) {
        const { highlightedId, playingId, fillOpacity } = getState();
        const data = annotation.bodies?.[0]?.value
                  ?? annotation.body?.[0]?.value ?? {};
        const lineColor = data.lineColor || '#506DAC';
        const lineWeight = data.lineWeight || 'medium';
        const lum = lineWeight === 'light' ? 0.7
                  : lineWeight === 'dark' ? -0.5 : 0;
        const stroke = Helper.adjustColor(lineColor, lum);

        const isSelected = !!state?.selected;
        const isHover = !!state?.hovered;
        const isPlaying = annotation.id === playingId;
        const isHighlighted = annotation.id === highlightedId;
        const flashing = isSelected || isHover || isPlaying;

        return {
            fill: stroke,
            fillOpacity: isHighlighted ? 0.2 : fillOpacity,
            stroke: flashing ? '#fff000' : stroke,
            strokeOpacity: 1,
            strokeWidth: 2,
        };
    };
}
```

### Event handler changes

- `selectAnnotation` → `selectionChanged`: payload is an array; take `[0]`. Use
  the same defensive body read as the styler.
- `mouseEnter/LeaveAnnotation`: drop the unused DOM-element second arg.

### Removed from `ImageViewer.vue`

- `highlightedAnnotationId` watcher's class toggling (`:192-204`) — style function
  now reacts to the prop directly.
- `.a9s-annotationlayer` light-tint DOM queries (`:299, :317`). Set
  `this.$refs.container.style.backgroundColor` instead. Safe because fill-opacity
  defaults to 0; there is no visible difference between "tint the annotation
  layer" and "tint the container" when annotations have no fill.
- `.play-highlight` class toggling in `autoPlayAnnotations` (`:350-358`). Replace
  with a reactive `currentlyPlayingId` data field; style function reads it.

### Removed from `styles.css`

- All `.a9s-*`, `.rdwb-ano-shape*`, `.outline-*`, `.ano-layer-fill-*`,
  `.play-highlight`, `.highlighted` rules.

### Build config changes

- `package.json`: remove `@recogito/annotorious-openseadragon`; add
  `@annotorious/openseadragon` at `^3.x` latest.
- `vite.config.js`:
  - externals: swap entry to `'@annotorious/openseadragon'`.
  - globals map: `{ '@annotorious/openseadragon': 'AnnotoriousOSD' }` (v3 exports a
    namespace, not a default).
- `vite-jslib.config.js`: no change (bundles everything).

## Risks & unknowns

1. **`AnnotationState` property names.** Docs describe selected/hovered state
   on the state argument but don't fully pin the keys. Styler uses `state?.selected`
   and `state?.hovered` with nullish guards; if the real keys are `isSelected` /
   `isHovered` the styler changes by two property reads. Verify by logging `state`
   on first click/hover during implementation.
2. **Annotation body shape through the W3C adapter.** Our annotations put the full
   app payload at W3C `body[0].value`. v3 may internally call this `bodies[0].value`.
   Styler and selection handler both try both keys.
3. **OSD 3.1 compatibility.** v3 docs do not require a specific OSD major. If the
   smoke test fails at init, we stop and regroup before bumping OSD — that bump is
   explicitly out of this design's scope.
4. **UMD global naming.** The v3 package is ESM-first; the external's UMD global
   mainly matters for ESM consumers doing UMD interop. Setting it to a namespace
   name (`AnnotoriousOSD`) is safe; the `jslib` build bundles the module so this
   doesn't affect the widget.
5. **Point annotations.** v2 relied on `.a9s-point` CSS to make the outer circle
   visible. v3 renders its own point shape; the dynamic `fill` from the styler
   should color it. Verify visually with a point-selector annotation.

## Verification plan (manual)

Per `CLAUDE.md`, this repo has no test runner. Verification is manual via
`npm run dev` against a real manifest.

Golden path:

- Annotations render with correct per-annotation stroke/fill color.
- Hover turns stroke yellow; leaving reverts.
- Click opens `AnnotationPopup`, stroke stays yellow while popup is open.
- Closing popup de-selects (no lingering yellow).
- Setting `highlightedAnnotationId` fills the matching shape at 20% opacity.
- Auto-play cycles, flashes each shape, popup follows.
- Light-level slider darkens behind annotations.
- `displayAnnotations=false` hides the annotation layer entirely.

Edge cases:

- Rectangle (`FragmentSelector`) target.
- Polygon / SVG target (`SvgSelector`).
- Point annotation (`renderedVia.name === 'point'`).
- Switching canvas (annotation re-load via `watch.annotations`).
- Empty annotation list.

Build verification:

- `npm run build` — library build succeeds; `dist/` produced.
- `npm run build-lib` — UMD widget build succeeds; `jslib/` produced.
- Load `jslib/` in a test HTML page, confirm widget initializes and renders
  annotations.

## Rollback

Single branch, ordered commits. Revert = `git revert` the upgrade commits on
`annotorious-upgrade`, or abandon the branch without merging.
