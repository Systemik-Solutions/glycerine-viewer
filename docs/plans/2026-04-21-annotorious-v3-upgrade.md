# Annotorious v3 Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `@recogito/annotorious-openseadragon` v2 with `@annotorious/openseadragon` v3 inside `src/components/ImageViewer.vue`, moving all visual state into v3's `style` function and deleting v2-specific CSS.

**Architecture:** Single integration site (`ImageViewer.vue`) + one styler in `helper.js`. Use `createOSDAnnotator` with `W3CImageFormat` adapter so existing W3C-shaped annotations pass through unchanged. Use `userSelectAction: 'SELECT'` to preserve click-to-select-without-edit behavior. Move per-annotation color, hover/selected/highlighted/play-mode visuals, and the light-level tint out of CSS/DOM queries and into reactive JS.

**Tech Stack:** Vue 3, OpenSeadragon 3.1, `@annotorious/openseadragon` 3.x, Vite 5, PrimeVue 3.

**Reference design:** `docs/plans/2026-04-21-annotorious-v3-upgrade-design.md`

**Project-specific conventions:**
- No test runner, no TDD (per `CLAUDE.md`). Verification is `npm run dev` + manual smoke test, and `npm run build-all` for build checks.
- Commits are frequent; each task ends with one commit.
- Windows dev box, bash shell. Use forward slashes in paths.

---

## Task 1: Swap the npm dependency

**Files:**
- Modify: `package.json` (dependencies block, lines 41-54)
- Modify: `package-lock.json` (auto, via npm)

**Step 1: Remove v2 and install v3**

Run:
```bash
npm uninstall @recogito/annotorious-openseadragon
npm install @annotorious/openseadragon
```

Expected: `package.json` no longer lists `@recogito/annotorious-openseadragon`. It now lists `@annotorious/openseadragon` at `^3.x.y` (whatever the current latest 3.x is).

**Step 2: Verify the resolved version and entry files exist**

Run:
```bash
ls node_modules/@annotorious/openseadragon/dist/
ls node_modules/@annotorious/openseadragon/ | grep -i css
```

Expected: a `dist/` directory with the ESM bundle, and a CSS file at `@annotorious/openseadragon/annotorious-openseadragon.css` (confirm the exact path printed — adjust later imports if the path differs).

If the CSS path differs from `@annotorious/openseadragon/annotorious-openseadragon.css`, note the real path — it will be used in Task 3.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Swap annotorious-openseadragon v2 for @annotorious/openseadragon v3"
```

---

## Task 2: Update Vite library-build externals and UMD globals

**Files:**
- Modify: `vite.config.js:28-50`

**Step 1: Replace the external entry and the globals map**

In `vite.config.js`:

Change line 30 from:
```js
                '@recogito/annotorious-openseadragon',
```
to:
```js
                '@annotorious/openseadragon',
```

Change line 49 from:
```js
                    '@recogito/annotorious-openseadragon': 'Annotorious',
```
to:
```js
                    '@annotorious/openseadragon': 'AnnotoriousOSD',
```

Leave `vite-jslib.config.js` untouched — it bundles everything and has no per-package externals for Annotorious.

**Step 2: Verify no other references**

Run:
```bash
grep -rn "recogito/annotorious" . --include="*.js" --include="*.json" --include="*.vue" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=jslib
```

Expected: no matches. If any remain, update them in the same commit.

**Step 3: Commit**

```bash
git add vite.config.js
git commit -m "Rename Annotorious external and UMD global for v3 package"
```

---

## Task 3: Replace the Annotorious import and init call in ImageViewer.vue

**Files:**
- Modify: `src/components/ImageViewer.vue:11-12` (imports)
- Modify: `src/components/ImageViewer.vue:265-269` (init block)

**Step 1: Replace the imports**

In `src/components/ImageViewer.vue`, replace lines 11-12:

```js
import Annotorious from '@recogito/annotorious-openseadragon';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';
```

with:

```js
import { createOSDAnnotator, W3CImageFormat } from '@annotorious/openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
```

(If Task 1 Step 2 found a different CSS path, use that path instead.)

**Step 2: Replace the init call (lines 265-269)**

Replace:
```js
this.annotorious = Annotorious(this.osdViewer, {
    disableEditor: true,
    readOnly: true,
    formatters: Helper.annotoriousFormatter(),
});
```

with:
```js
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

Note: `Helper.annotoriousStyle` and the reactive `currentlyPlayingId` don't exist yet — they land in Tasks 6 and 7. The dev server will error until those tasks complete; that's expected.

**Step 3: No verification yet**

The file is in a broken intermediate state. Do not run `npm run dev` between this task and Task 7. Continue to Task 4.

**Step 4: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Switch ImageViewer to v3 createOSDAnnotator + W3CImageFormat"
```

---

## Task 4: Update the selectAnnotation event handler

**Files:**
- Modify: `src/components/ImageViewer.vue:281-284`

**Step 1: Replace the selection handler**

In `src/components/ImageViewer.vue`, replace lines 281-284:

```js
this.annotorious.on('selectAnnotation', (annotation) => {
    this.selectedAnnotation = annotation.body[0].value;
    this.showPopup = true;
});
```

with:

```js
this.annotorious.on('selectionChanged', (annotations) => {
    const annotation = annotations?.[0];
    if (!annotation) {
        this.showPopup = false;
        return;
    }
    const body = annotation.bodies?.[0] ?? annotation.body?.[0];
    this.selectedAnnotation = body?.value ?? null;
    this.showPopup = !!this.selectedAnnotation;
});
```

Rationale: v3's `selectionChanged` fires with an array (empty array on deselect). The body accessor tries `bodies` first (v3 adapter shape) then falls back to `body` (W3C passthrough), which absorbs Unknown #2 in the design doc.

**Step 2: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Migrate selectAnnotation to v3 selectionChanged"
```

---

## Task 5: Update the mouse enter/leave event handler signatures

**Files:**
- Modify: `src/components/ImageViewer.vue:287-296`

**Step 1: Drop the unused DOM-element second argument**

Replace lines 287-296:

```js
// Listen for annotation hover on.
this.annotorious.on('mouseEnterAnnotation', (annotation, element) => {
    // Emit the mouseEnterAnnotation event with the annotation ID.
    this.$emit('mouseEnterAnnotation', annotation.id);
});

// Listen for annotation hover off.
this.annotorious.on('mouseLeaveAnnotation', (annotation, element) => {
    // Emit the mouseLeaveAnnotation event with the annotation ID.
    this.$emit('mouseLeaveAnnotation', annotation.id);
});
```

with:

```js
this.annotorious.on('mouseEnterAnnotation', (annotation) => {
    this.$emit('mouseEnterAnnotation', annotation.id);
});

this.annotorious.on('mouseLeaveAnnotation', (annotation) => {
    this.$emit('mouseLeaveAnnotation', annotation.id);
});
```

**Step 2: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Drop unused element arg from mouseEnter/Leave handlers"
```

---

## Task 6: Replace `annotoriousFormatter` with `annotoriousStyle` in helper.js

**Files:**
- Modify: `src/libraries/helper.js:53-88`

**Step 1: Replace the formatter method with the v3 styler**

In `src/libraries/helper.js`, replace the entire `annotoriousFormatter` static method (lines 53-88) with:

```js
    /**
     * Create the Annotorious v3 style function.
     *
     * @param {function(): {highlightedId: string|null, playingId: string|null, fillOpacity: number}} getState
     *   Returns the current reactive style inputs each time the styler is invoked.
     *
     * @returns {function(annotation, state): object}
     */
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

            const isSelected = !!(state?.selected ?? state?.isSelected);
            const isHover = !!(state?.hovered ?? state?.isHovered);
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

The `state?.selected ?? state?.isSelected` pattern absorbs Unknown #1 from the design doc — whichever key v3 actually uses, we pick it up. Once verified during smoke testing, the unused alias can be removed in a follow-up (not part of this plan).

**Step 2: Verify no other callers of the old method**

Run:
```bash
grep -rn "annotoriousFormatter" . --include="*.js" --include="*.vue" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=jslib
```

Expected: no matches (the only caller was the init block we already rewrote in Task 3).

**Step 3: Commit**

```bash
git add src/libraries/helper.js
git commit -m "Replace annotoriousFormatter with v3 annotoriousStyle"
```

---

## Task 7: Introduce `currentlyPlayingId` and remove `.play-highlight` DOM toggling

**Files:**
- Modify: `src/components/ImageViewer.vue:109-123` (data block)
- Modify: `src/components/ImageViewer.vue:342-366` (autoPlayAnnotations)
- Modify: `src/components/ImageViewer.vue:378-391` (playStop)

**Step 1: Add `currentlyPlayingId` to the `data()` object**

In `data()` (line 109), add a field so the block becomes:

```js
    data() {
        return {
            showPopup: false,
            selectedAnnotation: null,
            imageLoader: null,
            playConfig: {
                intervalID: null,
                currentIndex: -1,
            },
            currentlyPlayingId: null,
        }
    },
```

**Step 2: Replace `autoPlayAnnotations` body**

Replace the current `autoPlayAnnotations` method (lines 343-366):

```js
autoPlayAnnotations() {
    this.showPopup = false;
    this.playConfig.currentIndex = (this.playConfig.currentIndex + 1) % this.annotations.length;
    const annotation = this.annotations[this.playConfig.currentIndex];

    if (this.$refs.container) {
        // Clear the "play-highlight" class from all annotations.
        const playHighlights = this.$refs.container.querySelectorAll('.play-highlight');
        playHighlights.forEach(el => el.classList.remove('play-highlight'));

        // Highlight the current annotation.
        const annotationElement = this.$refs.container.querySelector(`.a9s-annotation[data-id='${annotation.id}']`);
        if (annotationElement) {
            // Add the "play-highlight" class to the annotation element.
            annotationElement.classList.add('play-highlight');
        }
    }

    this.annotorious.fitBoundsWithConstraints(annotation.id);
    this.selectedAnnotation = annotation;
    if (this.playShowPopup) {
        this.showPopup = true;
    }
},
```

with:

```js
autoPlayAnnotations() {
    this.showPopup = false;
    this.playConfig.currentIndex = (this.playConfig.currentIndex + 1) % this.annotations.length;
    const annotation = this.annotations[this.playConfig.currentIndex];
    this.currentlyPlayingId = annotation.id;
    this.annotorious.fitBounds(annotation.id);
    this.selectedAnnotation = annotation;
    if (this.playShowPopup) {
        this.showPopup = true;
    }
},
```

Two things changed: the DOM-query block is gone (style function handles it), and `fitBoundsWithConstraints` is now `fitBounds`.

**Step 3: Replace `playStop` body**

Replace lines 379-391:

```js
playStop() {
    this.showPopup = false;
    if (this.intervalID) {
        clearInterval(this.intervalID);
    }
    // Clear the "play-highlight" class from all annotations.
    if (this.$refs.container) {
        const playHighlights = this.$refs.container.querySelectorAll('.play-highlight');
        playHighlights.forEach(el => el.classList.remove('play-highlight'));
    }
    this.intervalID = null;
    this.playConfig.currentIndex = -1;
},
```

with:

```js
playStop() {
    this.showPopup = false;
    if (this.intervalID) {
        clearInterval(this.intervalID);
    }
    this.currentlyPlayingId = null;
    this.intervalID = null;
    this.playConfig.currentIndex = -1;
},
```

**Step 4: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Drive play-mode highlight via reactive state instead of DOM class toggling"
```

---

## Task 8: Remove the `highlightedAnnotationId` DOM-toggling watcher

**Files:**
- Modify: `src/components/ImageViewer.vue:190-205`

**Step 1: Delete the watcher block**

Remove lines 190-205 entirely:

```js
// Watch for changes to the highlighted annotation ID.
highlightedAnnotationId(newValue, oldValue) {
    if (this.annotorious) {
        // Clear all highlights first.
        const highlightedElements = this.$refs.container.querySelectorAll('.highlighted');
        highlightedElements.forEach((el) => el.classList.remove('highlighted'));
        if (newValue) {
            // Find the element with "data-id" attribute matching the highlighted annotation ID.
            const highlightedElement = this.$refs.container.querySelector(`[data-id="${newValue}"]`);
            // Add the "highlighted" class to the element.
            if (highlightedElement) {
                highlightedElement.classList.add('highlighted');
            }
        }
    }
},
```

The `highlightedAnnotationId` prop is already passed into the `getState` closure in Task 3; the style function reads it directly. Verify by re-reading the `watch: { … }` block after deletion — only `annotations`, `light`, and `playState` watchers should remain.

**Step 2: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Remove DOM class-toggling watcher for highlightedAnnotationId"
```

---

## Task 9: Move the light-level tint from the annotation layer to the container

**Files:**
- Modify: `src/components/ImageViewer.vue:298-302` (remove the now-orphaned lookup in initViewer)
- Modify: `src/components/ImageViewer.vue:315-320` (rewrite `setLightLevel`)

**Step 1: Rewrite `setLightLevel`**

Replace lines 315-320:

```js
setLightLevel() {
    // Find the `.a9s-annotationlayer` element inside the container.
    const annotationLayer = this.$refs.container.querySelector('.a9s-annotationlayer');
    // Add the background color.
    annotationLayer.style.backgroundColor = `rgba(33,33,33,${1 - this.light / 100}`;
},
```

with:

```js
setLightLevel() {
    if (!this.$refs.container) return;
    this.$refs.container.style.backgroundColor = `rgba(33, 33, 33, ${1 - this.light / 100})`;
},
```

Note: the original code had a missing closing paren on `rgba(...` — keep the fix.

**Step 2: Remove the orphaned `annotationLayer` lookup in `initViewer`**

Lines 298-301 currently read:

```js
// Find the `.a9s-annotationlayer` element inside the container.
const annotationLayer = this.$refs.container.querySelector('.a9s-annotationlayer');
// Initialize the light level.
this.setLightLevel();
```

Replace with:

```js
this.setLightLevel();
```

**Step 3: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Apply light-level tint to container instead of annotation layer"
```

---

## Task 10: Delete v2-specific CSS rules

**Files:**
- Modify: `src/assets/styles.css` (lines 11-116 — everything from `/* Annotorious styles */` through the end of the point-annotation block)

**Step 1: Remove all `.a9s-*`, `.rdwb-ano-shape*`, `.outline-*`, `.ano-layer-fill-*`, `.play-highlight`, `.highlighted` rules**

Open `src/assets/styles.css`. Keep:
- Lines 1-10 (`.gv-field`, `.gv-field-label`)
- Lines 117-155 (`.p-dialog-mask` override, `.gv-annotation-content` rules)

Delete everything between (inclusive) the `/* Annotorious styles */` comment on line 11 and the end of the point-annotation block on line 116.

After the edit, the file should open with `.gv-field { … }` and transition directly to `/* Override the PrimeVue dialog mask z-index … */`.

**Step 2: Verify no orphan references**

Run:
```bash
grep -n "a9s-\|rdwb-ano-shape\|ano-layer-fill\|play-highlight\|\.highlighted\|outline-normal\|outline-light\|outline-dark" src/ -r
```

Expected: no matches under `src/`. If any appear, they were missed in Tasks 7-9 — fix them in this same commit.

**Step 3: Commit**

```bash
git add src/assets/styles.css
git commit -m "Delete v2 Annotorious CSS now replaced by v3 style function"
```

---

## Task 11: Smoke-test in dev and verify state shape

**Files:** none — this is manual verification only.

**Step 1: Start the dev server**

Run:
```bash
npm run dev
```

Expected: Vite starts on a local port with no Annotorious-related errors in the terminal or browser console. If init fails with an OSD-version error, STOP — this would mean Unknown #3 from the design doc triggered; confirm with the user before bumping OSD.

**Step 2: Verify `AnnotationState` shape (Unknown #1)**

Temporarily add a `console.log('ann state', annotation.id, state)` at the top of `annotoriousStyle`'s returned function. Load a manifest, hover over an annotation, click one. Check the console for which keys are actually populated (`selected`/`hovered` vs `isSelected`/`isHovered`).

If the real keys are `selected`/`hovered`: remove the `?? state?.isSelected` / `?? state?.isHovered` aliases from `helper.js`.
If the real keys are `isSelected`/`isHovered`: flip the priority so the `is*` form is first.
Remove the temporary `console.log`.

**Step 3: Verify body shape (Unknown #2)**

In the `selectionChanged` handler, add a `console.log('sel', annotations[0])` once. Click an annotation. Check whether `.bodies` or `.body` is populated on the object. Remove the unused fallback branch from both `helper.js` and `ImageViewer.vue`'s selection handler. Remove the temporary `console.log`.

**Step 4: Smoke-test the golden path**

Against a manifest that contains rectangle, polygon/SVG, and point annotations, verify:
- Annotations render with their per-annotation color (the `lineColor`/`lineWeight` from the annotation body).
- Hover over an annotation → stroke turns `#fff000`; leaving reverts.
- Click an annotation → popup opens, stroke stays yellow.
- Close popup → de-selects, stroke reverts.
- Set `highlightedAnnotationId` externally (e.g. via the side panel if available) → matching shape fills at 20% opacity.
- Start autoplay → each annotation in turn gets the yellow stroke and popup; stopping clears.
- Light slider → darkens container behind the image; annotations remain visible.
- `displayAnnotations=false` → no annotation layer visible.
- Switch canvas → annotations re-load cleanly (`watch.annotations` fires `clearAnnotations` + `setAnnotations`).
- Empty annotation list → no errors.

**Step 5: Commit any cleanups from steps 2-3**

If state/body shape is now known and the fallbacks were removed:

```bash
git add src/libraries/helper.js src/components/ImageViewer.vue
git commit -m "Pin to verified v3 AnnotationState and body property names"
```

If no cleanup was needed (both fallbacks stay because either shape might appear), skip the commit.

---

## Task 12: Verify both library builds

**Files:** none — this is build verification only.

**Step 1: Run the library build**

```bash
npm run build
```

Expected: `dist/glycerine-viewer.es.js`, `dist/glycerine-viewer.umd.js`, and `dist/style.css` produced with no errors. Warnings about `@annotorious/openseadragon` being externalized are fine.

**Step 2: Run the standalone widget build**

```bash
npm run build-lib
```

Expected: `jslib/` produced with no errors. `@annotorious/openseadragon` is bundled in this output (no externals).

**Step 3: Smoke-test the UMD widget**

Either use an existing `jslib` test HTML page in this repo, or quickly drop a minimal one that does:

```html
<script src="./jslib/glycerine-viewer.umd.js"></script>
<div id="v" style="width:800px;height:600px"></div>
<script>
  new GlycerineViewer(document.getElementById('v'), {
    manifestUrl: 'https://<a public IIIF manifest with annotations>',
  }).init();
</script>
```

Open the file, confirm the viewer initializes and annotations render.

**Step 4: Verify `dist/style.css` contains the v3 CSS**

```bash
grep -c "annotorious\|a9s\|annotation" dist/style.css || true
```

Expected: some matches from the v3 package's own CSS (bundled into `style.css` via Vite's lib CSS extraction). If zero, the CSS import in `ImageViewer.vue` may not have resolved — investigate before shipping.

**Step 5: Commit any fixups**

If no fixups needed, skip. Otherwise:

```bash
git add -A
git commit -m "Fixups from build verification"
```

---

## Task 13: Update the README if user-facing docs reference v2

**Files:**
- Modify: `README.md` (if applicable)

**Step 1: Check for Annotorious references in README**

```bash
grep -n -i "annotorious\|recogito" README.md
```

If no matches, skip Steps 2-3 and move on.

**Step 2: Update any peer-dependency or install instructions**

If the README instructs consumers to install `@recogito/annotorious-openseadragon` as a peer, change it to `@annotorious/openseadragon` at `^3.x`. Check the CSS-import instructions similarly (the path changes to `@annotorious/openseadragon/annotorious-openseadragon.css`).

**Step 3: Commit**

```bash
git add README.md
git commit -m "Update README for Annotorious v3 peer dependency"
```

---

## Final verification

Before declaring the upgrade complete:

1. `git log --oneline main..HEAD` — commit sequence reads as a clean migration story.
2. `npm run dev` — golden-path smoke test passes end-to-end.
3. `npm run build-all` — both builds succeed.
4. No `@recogito/annotorious-openseadragon` references anywhere under `src/`, config files, or docs.
5. No `.a9s-*` / `.rdwb-ano-shape` / `.ano-layer-fill` / `.play-highlight` / `.highlighted` references in `src/`.

If all pass, the branch is ready for review.
