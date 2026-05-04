# `crossOriginPolicy` prop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `crossOriginPolicy` prop to `GlycerineViewer` (Vue) and `ImageViewer`, plus the matching option on the standalone JS widget, and make the OpenSeadragon viewer re-fetch tiles under the new policy at runtime while preserving viewport, Annotorious, and active annotation filters.

**Architecture:** The prop is added on `ImageViewer.vue` and forwarded from `GlycerineViewer.vue` (Vue library) and `src/jslib/main.js` (UMD widget). On initial mount, the value is passed straight into the OSD constructor — replacing the literal `false` at `src/components/ImageViewer.vue:247`. On runtime changes, an `ImageViewer` watcher captures the current viewport bounds, mutates `osdViewer.crossOriginPolicy`, calls `viewer.close()` + `viewer.open(tileSources)` (the documented OSD reload pattern), then on the `open` event restores bounds and re-applies annotations from the **live** filtered list (so filters are preserved by virtue of `webAnnotations` reflecting the current value of the upstream-filtered `annotations` prop).

**Tech Stack:** Vue 3 (Options API), OpenSeadragon 6, `@annotorious/openseadragon` v3, Vite (library + UMD widget builds).

**No tests:** Per `CLAUDE.md`, this repo has no test runner and explicitly opts out of TDD. Verification is a manual browser smoke test against a CORS-restricted IIIF source — see Task 6.

**Reference design:** `docs/plans/2026-05-04-crossorigin-policy-prop-design.md`

---

### Task 1: Add `crossOriginPolicy` prop to `ImageViewer`

**Files:**
- Modify: `src/components/ImageViewer.vue` (props block ending at line 92)

**Step 1: Add the prop**

Add this prop after `popupPosition` (currently the last prop, ending at line 91), inside the `props: { ... }` object:

```js
// Sets OpenSeadragon's crossOriginPolicy. Accepts 'Anonymous',
// 'use-credentials', or false. Changing at runtime triggers a
// soft reload of the tile source so already-cached tiles are
// re-fetched under the new policy.
crossOriginPolicy: {
    type: [String, Boolean],
    default: false,
    validator(value) {
        return value === false || value === 'Anonymous' || value === 'use-credentials';
    },
},
```

**Step 2: Sanity check**

Run `npm run build` and confirm it completes without warnings about the new prop.

**Step 3: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Add crossOriginPolicy prop to ImageViewer"
```

---

### Task 2: Wire the prop into the OSD constructor and extract `buildTileSources()`

**Files:**
- Modify: `src/components/ImageViewer.vue` — `initViewer()` method (around lines 238–262) and a new helper method.

**Step 1: Replace the hardcoded literal**

In `initViewer()`, change line 247:

```js
crossOriginPolicy: false,
```

to:

```js
crossOriginPolicy: this.crossOriginPolicy,
```

**Step 2: Extract tile-source construction into a method**

In `initViewer()`, the block currently sets `osdConfig.tileSources` based on `this.plainImage`. Extract that into a new method on the `methods` object (placed adjacent to `initViewer`):

```js
/**
 * Builds the OSD tileSources value from the current image prop.
 * Used by both initViewer() and the crossOriginPolicy watcher.
 *
 * @returns {Object|Array<string>}
 */
buildTileSources() {
    if (this.plainImage) {
        return {
            type: 'image',
            url: this.image,
            buildPyramid: false,
        };
    }
    return [this.image + '/info.json'];
},
```

In `initViewer()`, replace the existing if/else that assigns `osdConfig.tileSources` with:

```js
osdConfig.tileSources = this.buildTileSources();
```

**Step 3: Build & manual smoke**

Run `npm run build` — expect a clean build. Run `npm run dev` and ask the user to load any IIIF manifest in their normal test page; confirm the image still loads exactly as before (the change is behavior-preserving).

**Step 4: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Pass crossOriginPolicy to OSD and extract buildTileSources helper"
```

---

### Task 3: Add the runtime watcher in `ImageViewer`

**Files:**
- Modify: `src/components/ImageViewer.vue` — `watch: { ... }` block (currently lines 161–213).

**Step 1: Add the watcher**

Inside the `watch` block, after the `highlightedAnnotationId` watcher (line 210–212), add:

```js
// Switching crossOriginPolicy at runtime: OSD reads the policy
// from the viewer instance when scheduling tile fetches, so we
// mutate the live property and reload the tile source. Already-
// cached tiles cannot be "re-tainted" in place, hence the close
// + open. We preserve the current viewport bounds and re-apply
// annotations from the live, upstream-filtered list so the user
// stays exactly where they were with the same filter state.
crossOriginPolicy(newValue) {
    if (!this.osdViewer) {
        return;
    }
    this.playStop();
    const bounds = this.osdViewer.viewport.getBounds(true);
    this.osdViewer.crossOriginPolicy = newValue;
    const onOpen = () => {
        this.osdViewer.removeHandler('open', onOpen);
        this.osdViewer.viewport.fitBounds(bounds, true);
        if (this.annotorious && this.webAnnotations.length > 0) {
            this.annotorious.setAnnotations(this.webAnnotations);
            this.refreshAnnotationStyle();
        }
    };
    this.osdViewer.addHandler('open', onOpen);
    this.osdViewer.close();
    this.osdViewer.open(this.buildTileSources());
},
```

**Step 2: Build**

Run `npm run build`; expect a clean build.

**Step 3: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Soft-reload OSD when crossOriginPolicy changes"
```

---

### Task 4: Add the prop on `GlycerineViewer` and forward it to `ImageViewer`

**Files:**
- Modify: `src/components/GlycerineViewer.vue` — props block (specifically near `annotationFillOpacity` at lines 504–508) and the `<ImageViewer ... />` template element (lines 14–34).

**Step 1: Add the prop on `GlycerineViewer`**

In the `props: { ... }` object, add after `annotationFillOpacity` (just before `annotationPopupPosition`):

```js
// OpenSeadragon crossOriginPolicy. Accepts 'Anonymous',
// 'use-credentials', or false. Changes are forwarded to the
// active ImageViewer and trigger a tile-source reload.
crossOriginPolicy: {
    type: [String, Boolean],
    default: false,
    validator(value) {
        return value === false || value === 'Anonymous' || value === 'use-credentials';
    },
},
```

**Step 2: Forward the prop in the template**

In the `<ImageViewer ... />` element (starting at line 14), add a new attribute. The current template ends with `:popupPosition="settings.popupPosition.value"` at line 26, immediately followed by event listeners. Add the new attribute on the line **after** `:popupPosition` and **before** the first `@osdInitialized`:

```html
:crossOriginPolicy="crossOriginPolicy"
```

The resulting fragment looks like:

```html
:popupPosition="settings.popupPosition.value"
:crossOriginPolicy="crossOriginPolicy"
@osdInitialized="(osd) => { $emit('osdInitialized', osd, canvas) }"
```

**Step 3: Build**

Run `npm run build`; expect a clean build with no warnings.

**Step 4: Commit**

```bash
git add src/components/GlycerineViewer.vue
git commit -m "Add crossOriginPolicy prop on GlycerineViewer and forward to ImageViewer"
```

---

### Task 5: Expose the option on the JS widget

**Files:**
- Modify: `src/jslib/main.js` — the `#getRootProps()` method (currently lines 42–81).

**Step 1: Add the option**

Inside `#getRootProps()`, add a new key. Place it next to `annotationFillOpacity` (line 63) for readability:

```js
crossOriginPolicy: this.options.crossOriginPolicy,
```

The surrounding lines should look like:

```js
annotationFillOpacity: this.options.annotationFillOpacity,
annotationPopupPosition: this.options.annotationPopupPosition,
crossOriginPolicy: this.options.crossOriginPolicy,
```

**Step 2: Build the UMD widget**

Run `npm run build-lib`; confirm `jslib/` builds cleanly.

**Step 3: Commit**

```bash
git add src/jslib/main.js
git commit -m "Expose crossOriginPolicy option on the JS widget"
```

---

### Task 6: Manual browser smoke test

**Files:** none modified.

The library has no automated tests; this task verifies behavior in the browser. Ask the user to start their normal dev environment (per `CLAUDE.md`: "Always ask the user to start the testing environment manually and provide you the URL before you can start testing in the browser").

**Step 1: Ask the user to start the test page and provide the URL**

Stop and request the URL. Do not assume `npm run dev` will produce a usable page — `CLAUDE.md` notes the dev command does not work for testing this library.

**Step 2: Default-value parity check**

Without setting `crossOriginPolicy`, load any IIIF manifest. Confirm:

- The image loads.
- Annotations render and selectable.
- Light level slider, fill opacity, play controls, popup all work.

This verifies Task 2's literal swap is behavior-preserving.

**Step 3: Initial-mount value check**

Set the prop to `'Anonymous'` from the start (Vue page or widget config). Load a manifest whose tile server returns `Access-Control-Allow-Origin: *`. Confirm:

- Tiles load without CORS errors in DevTools console.
- DevTools Network tab shows tile requests with `Origin` header set (i.e. cross-origin request, no credentials).

**Step 4: Runtime change check**

Starting from `crossOriginPolicy: false`, change the value to `'Anonymous'` (e.g. via Vue reactivity in a host page, or via reassigning the property and calling Vue's reactive update path on the widget — the user can wire a button). Confirm:

- The viewer briefly clears, then re-renders with the same viewport bounds (no jump).
- DevTools Network tab shows new tile requests with the `Origin` header.
- Annotations re-appear with the same filter state. Specifically, set a non-default filter (e.g. pick a non-default annotation set or language) **before** changing the prop, and verify the same filtered subset is what re-appears, not the unfiltered set.
- Hover, select, and play of annotations still work.

**Step 5: `'use-credentials'` check**

Repeat Step 4 with `'use-credentials'`. If no suitable credentialed tile source is available, this can be a smoke check confirming no console errors and a successful reload.

**Step 6: Decision point — does Approach A work cleanly?**

If Step 4 / Step 5 reveal that Annotorious's overlay does **not** survive `close()` + `open()` (e.g. annotations don't re-paint, hover/select stops responding, console errors from the Pixi layer), escalate per the design's fallback section: change the watcher body in `src/components/ImageViewer.vue` to do a full re-init instead. Concretely:

1. Capture bounds as today.
2. `this.annotorious?.destroy?.()` and null it.
3. `this.osdViewer.destroy()` and null it.
4. Call `this.initViewer()`.
5. After the `open` event, `fitBounds(bounds, true)`.

If Approach A works, leave the implementation as-is.

**Step 7: Commit any fallback fix (if needed)**

```bash
git add src/components/ImageViewer.vue
git commit -m "Fall back to full OSD re-init for crossOriginPolicy change"
```

---

### Task 7: Update README

**Files:**
- Modify: `README.md` — the `#### Props` list (after the `autoplay` bullet at line 235).

**Step 1: Add a bullet to the Props list**

After the `autoplay` bullet (line 235), add:

```markdown
- `cross-origin-policy` (String|Boolean): Sets OpenSeadragon's `crossOriginPolicy`. 
  Accepts `'Anonymous'`, `'use-credentials'`, or `false`. Default is `false`. Changing
  the value at runtime causes the viewer to re-fetch tiles under the new policy
  while preserving viewport and annotations.
```

The `JS Widget API > Configurations` section already says all props are accepted as `camelCase` widget options, so no separate addition is needed there. The widget option is `crossOriginPolicy`.

**Step 2: Confirm rendering**

Open the README in a markdown previewer (or just visually scan the diff) — confirm the bullet sits cleanly under `autoplay`.

**Step 3: Commit**

```bash
git add README.md
git commit -m "Document crossOriginPolicy prop in README"
```

---

## Done criteria

- `crossOriginPolicy` prop accepted on both `GlycerineViewer` and `ImageViewer` with the documented validator and default.
- `crossOriginPolicy` option accepted on the standalone widget via `new GlycerineViewer(el, { crossOriginPolicy: ... })`.
- Initial mount uses the prop value in the OSD constructor.
- Runtime change reloads the tile source, preserves viewport bounds, and re-applies the live filtered annotation list.
- `npm run build` and `npm run build-lib` both succeed.
- Manual browser smoke test (Task 6) passes.
- README updated.
