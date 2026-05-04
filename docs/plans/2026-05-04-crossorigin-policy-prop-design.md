# `crossOriginPolicy` prop — design

## Goal

Expose OpenSeadragon's `crossOriginPolicy` configuration as a prop on
`GlycerineViewer` (Vue) and as an option on the standalone `GlycerineViewer`
JS widget. Allow consumers to switch the policy at runtime and have the
viewer re-fetch tiles under the new mode while preserving the viewport,
the Annotorious instance, and the active annotation filters.

## Prop surface

`ImageViewer` (`src/components/ImageViewer.vue`) and `GlycerineViewer`
(`src/components/GlycerineViewer.vue`) both gain:

- name: `crossOriginPolicy`
- type: `[String, Boolean]`
- validator: accepts `'Anonymous'`, `'use-credentials'`, `false`
- default: `false`

`GlycerineViewer` forwards the prop to `ImageViewer`:

```html
<ImageViewer ... :crossOriginPolicy="crossOriginPolicy" />
```

The standalone widget (`src/jslib/main.js`) exposes it as a flat option:

```js
// inside #getRootProps()
crossOriginPolicy: this.options.crossOriginPolicy,
```

`README.md` documents the new prop under the Vue Props section and the
JS widget Configurations section.

## Initial wiring

`ImageViewer.initViewer()` currently hardcodes `crossOriginPolicy: false`
on the OSD config (`src/components/ImageViewer.vue:247`). That literal is
replaced with `this.crossOriginPolicy`. No other change is needed for the
first-mount path; the default of `false` keeps the current behavior
identical for existing consumers.

The tile-source construction in `initViewer()` is extracted into a small
`#buildTileSources()` (or equivalent method-on-`methods`) helper so the
runtime watcher can re-use it without duplicating the plain-image vs.
IIIF `info.json` branching.

## Runtime change — Approach A (soft reload)

OpenSeadragon reads `crossOriginPolicy` from the viewer instance when it
schedules tile fetches. Mutating `viewer.crossOriginPolicy` and then
calling `viewer.close()` followed by `viewer.open(tileSources)` is the
documented way to force already-cached tiles to be re-fetched under the
new policy without recreating the viewer.

`ImageViewer` adds a watcher on the prop:

```js
crossOriginPolicy(newValue) {
    if (!this.osdViewer) return;
    this.playStop();
    const bounds = this.osdViewer.viewport.getBounds(true);
    this.osdViewer.crossOriginPolicy = newValue;
    const onOpen = () => {
        this.osdViewer.removeHandler('open', onOpen);
        this.osdViewer.viewport.fitBounds(bounds, true);
        if (this.annotorious) {
            this.annotorious.setAnnotations(this.webAnnotations);
            this.refreshAnnotationStyle();
        }
    };
    this.osdViewer.addHandler('open', onOpen);
    this.osdViewer.close();
    this.osdViewer.open(this.buildTileSources());
}
```

Notes on the steps:

- `getBounds(true)` returns the current bounds without inertia, so the
  restore is exact.
- `fitBounds(bounds, true)` snaps without animation, avoiding a visible
  pan after the reload.
- `webAnnotations` is read **live** at re-set time. `GlycerineViewer`
  applies all annotation filters (set / language / line color / line
  weight / `userAnnotationFilter`) upstream in its `annotations`
  computed, so the prop coming in is already filtered, and using the
  current value naturally preserves whatever filter state is active when
  the policy change happens.
- `playStop()` mirrors what the existing `annotations` watcher does
  defensively, since the playback timer holds onto annotation
  references.
- The OSD instance is **not** destroyed, so the `osdInitialized` event is
  not re-emitted. Hosts that captured the OSD reference still hold a
  valid one. Annotorious's `selectionChanged` / `mouseEnterAnnotation` /
  `mouseLeaveAnnotation` listeners, the `canvas-click` suppressor, and
  the canvas-element light-level filter all stay bound across the
  reload.

### Fallback if Approach A misbehaves

If the Annotorious v3 Pixi layer turns out to lose its drawing context
or render state across `close()` / `open()` (the existing CLAUDE.md
notes that v3 has caused related quirks before — see the canvas-drawer
forcing and the fill-opacity / play-id restyle workarounds), the watcher
escalates to a full re-init: destroy `this.annotorious`, destroy
`this.osdViewer`, then call `initViewer()` again. The bounds capture
stays the same. Only the body of the watcher changes; the prop and
plumbing are unaffected.

## Out of scope

- `image-loader.js:81` hardcodes `crossOrigin="anonymous"` on the cutout
  `<img>` element. This is a separate fetch path used only for
  side-panel cutouts and stays as-is per product decision.
- No new event is emitted for the policy change. Hosts that need to
  observe it can watch their own state.
- `AudioViewer` and `VideoViewer` do not gain the prop. Their elements
  are not tile-based and have their own CORS attributes.

## Files touched

- `src/components/ImageViewer.vue` — add prop, replace literal at line
  247, extract `buildTileSources()`, add `crossOriginPolicy` watcher.
- `src/components/GlycerineViewer.vue` — add prop, forward it on the
  `<ImageViewer>` tag.
- `src/jslib/main.js` — add `crossOriginPolicy` to `#getRootProps()`.
- `README.md` — document under Props and Configurations.
