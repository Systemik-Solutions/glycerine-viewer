# `beforeCanvasLoad` Event Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Emit a `beforeCanvasLoad` event before OpenSeadragon construction with the canvas ID and an awaitable `hooks.waitFor: Promise[]` payload, so consumers can asynchronously probe HTTP headers and set `crossOriginPolicy` before the first tile fetch.

**Architecture:** `ImageViewer.initViewer()` becomes `async`. It builds a `hooks = { waitFor: [] }` payload, emits `beforeCanvasLoad` with it, then `await Promise.all(hooks.waitFor)` followed by `await this.$nextTick()` if the consumer registered any work. Errors in awaited Promises are caught with a console warning so a failed probe doesn't brick the viewer. `GlycerineViewer` re-emits the event with `canvas.id` injected via a template handler — same wrapping pattern used today for `canvasLoaded`. The JS widget exposes the handler as `onBeforeCanvasLoad`. The same `hooks` object reference is passed end-to-end so consumer mutations on `waitFor` are visible to `ImageViewer.initViewer`.

**Tech Stack:** Vue 3 Options API, OpenSeadragon 6, Vite (library + UMD widget builds).

**No tests:** Per CLAUDE.md, this repo has no test runner and explicitly opts out of TDD. Verification is `npm run build` / `npm run build-lib` plus a manual browser smoke test in Task 6.

**Reference design:** `docs/plans/2026-05-04-before-canvas-load-event-design.md`

---

### Task 1: Declare the `beforeCanvasLoad` emit on `ImageViewer`

**Files:**
- Modify: `C:\laragon\www\glycerine-viewer\src\components\ImageViewer.vue` — `emits` array (currently lines 93–108).

**Step 1: Add the emit name**

Inside the `emits: [ ... ]` array of `ImageViewer.vue`, add a new entry **before** `'canvasLoaded'` (currently the second item) so the event order matches the lifecycle order — `beforeCanvasLoad` fires before `canvasLoaded`. The result should look like:

```js
emits: [
    // Event emitted when the OpenSeadragon viewer is initialized.
    'osdInitialized',
    // Event emitted before the OSD viewer is constructed. The
    // payload is a `hooks` object whose `waitFor` array accepts
    // Promises; OSD initialization is awaited until they resolve.
    'beforeCanvasLoad',
    // Event emitted when the canvas is loaded.
    'canvasLoaded',
    // ... unchanged below ...
],
```

Match the surrounding 4-space indent and existing comment style (one-line comments above each entry).

**Step 2: Verify build**

Run `npm run build`. Expect a clean build (only the pre-existing PrimeVue UMD-globals warnings).

**Step 3: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Declare beforeCanvasLoad emit on ImageViewer"
```

---

### Task 2: Convert `ImageViewer.initViewer()` to `async` and emit `beforeCanvasLoad`

**Files:**
- Modify: `C:\laragon\www\glycerine-viewer\src\components\ImageViewer.vue` — `initViewer()` method (currently `methods` block, around lines 288–364).

**Step 1: Change the method signature**

Change `initViewer()` to `async initViewer()`. The method currently looks like:

```js
        /**
         * Initializes the viewer.
         */
        initViewer() {
            // Initialize the OpenSeadragon viewer.
            // Force the canvas drawer: ...
            const osdConfig = {
                ...
            };
            ...
        },
```

After the change:

```js
        /**
         * Initializes the viewer.
         */
        async initViewer() {
            // Initialize the OpenSeadragon viewer.
            // Force the canvas drawer: ...
            const osdConfig = {
                ...
            };
            ...
        },
```

**Step 2: Insert the `beforeCanvasLoad` emit + await block**

Inside `async initViewer()`, **immediately above** the existing `const osdConfig = { ... };` line (i.e., before any OSD-related work begins), insert:

```js
            // Give consumers a chance to do async setup before OSD is
            // constructed (e.g., probe Access-Control-Allow-Origin so
            // crossOriginPolicy can be picked correctly per canvas).
            // Consumers push Promises into hooks.waitFor; we await
            // them all, then read the (possibly updated) prop value.
            const hooks = { waitFor: [] };
            this.$emit('beforeCanvasLoad', hooks);
            if (hooks.waitFor.length > 0) {
                try {
                    await Promise.all(hooks.waitFor);
                    await this.$nextTick();
                } catch (err) {
                    console.warn(
                        '[GlycerineViewer] beforeCanvasLoad handler rejected; ' +
                        'proceeding with current crossOriginPolicy',
                        err,
                    );
                }
            }
```

Make sure indentation matches the surrounding method body (12 spaces — three 4-space indent levels: `<script>`, `methods`, method body).

Do NOT change anything else in `initViewer()`. The OSD constructor reads `this.crossOriginPolicy` as it does today; after the await, that getter returns the (possibly updated) prop value.

**Step 3: Verify build**

Run `npm run build`. Expect a clean build.

**Step 4: Commit**

```bash
git add src/components/ImageViewer.vue
git commit -m "Emit beforeCanvasLoad and await consumer hooks before OSD init"
```

---

### Task 3: Wire `beforeCanvasLoad` through `GlycerineViewer`

**Files:**
- Modify: `C:\laragon\www\glycerine-viewer\src\components\GlycerineViewer.vue` — `<ImageViewer>` template element (around lines 14–34) and the `emits` array (currently lines 546–569).

**Step 1: Add the emit declaration**

In the `emits: [ ... ]` array, add a new entry **before** `'canvasLoaded'` (currently the third item, after `'osdInitialized'` and `'manifestLoaded'`):

```js
        // Emitted before a canvas is loaded into the OSD viewer. Passes
        // the canvas id and a `hooks` object. Push a Promise into
        // `hooks.waitFor` to make OSD initialization wait for async setup
        // (e.g., a HEAD request to pick the right crossOriginPolicy).
        'beforeCanvasLoad',
```

The result should look like:

```js
emits: [
    // Emitted when the OpenSeadragon viewer is initialized. ...
    'osdInitialized',
    // Emitted when the manifest is loaded successfully. ...
    'manifestLoaded',
    // Emitted before a canvas is loaded into the OSD viewer. ...
    'beforeCanvasLoad',
    // Emitted when a canvas is loaded. It passes the canvas id ...
    'canvasLoaded',
    ...
],
```

**Step 2: Add the template handler**

In the `<ImageViewer ... />` element (top of the template, around lines 14–34), the existing event handlers begin with `@osdInitialized` and `@canvasLoaded`. Add a new handler **immediately above** `@canvasLoaded`:

```html
                                             @beforeCanvasLoad="(hooks) => { $emit('beforeCanvasLoad', canvas.id, hooks) }"
```

Match the indentation of the surrounding handlers exactly. The result fragment:

```html
@osdInitialized="(osd) => { $emit('osdInitialized', osd, canvas) }"
@beforeCanvasLoad="(hooks) => { $emit('beforeCanvasLoad', canvas.id, hooks) }"
@canvasLoaded="() => { $emit('canvasLoaded', canvas.id) }"
```

The same `hooks` object reference flows through unchanged — any `waitFor.push(...)` the consumer does mutates the array `ImageViewer.initViewer` is awaiting.

**Step 3: Verify build**

Run `npm run build`. Expect a clean build.

**Step 4: Commit**

```bash
git add src/components/GlycerineViewer.vue
git commit -m "Forward beforeCanvasLoad through GlycerineViewer with canvas id"
```

---

### Task 4: Expose `onBeforeCanvasLoad` on the JS widget

**Files:**
- Modify: `C:\laragon\www\glycerine-viewer\src\jslib\main.js` — `#getRootProps()` method (around lines 42–82).

**Step 1: Add the option**

Inside `#getRootProps()`, add a new key for `onBeforeCanvasLoad`. Place it **immediately above** `onCanvasLoaded` (mirrors the event lifecycle order — before-canvas precedes canvas-loaded). Do not change any other key:

```js
            onBeforeCanvasLoad: this.options.onBeforeCanvasLoad,
            onCanvasLoaded: this.options.onCanvasLoaded,
```

**Step 2: Build the UMD widget**

Run `npm run build-lib`. Confirm the widget builds cleanly.

**Step 3: Commit**

```bash
git add src/jslib/main.js
git commit -m "Expose onBeforeCanvasLoad handler on the JS widget"
```

---

### Task 5: Update README

**Files:**
- Modify: `C:\laragon\www\glycerine-viewer\README.md` — `#### Emits` section (currently lines 241–255).

**Step 1: Add a bullet to the Emits list**

Insert a new bullet **immediately above** the `canvas-loaded` bullet (currently around line 246):

```markdown
- `before-canvas-load`: Emitted before the OpenSeadragon viewer is constructed for a canvas. It passes the canvas
id and a `hooks` object. Push a Promise into `hooks.waitFor` to make OSD initialization wait for asynchronous setup —
for example, a HEAD request to inspect `Access-Control-Allow-Origin` and set the `cross-origin-policy` prop before the
first tile fetch. Multiple Promises can be pushed; OSD waits for all of them via `Promise.all`. If a Promise rejects,
a warning is logged and the viewer continues with the current `cross-origin-policy`.
```

Match the existing flush-left wrap convention (no indented continuation lines — see neighbouring bullets like `default-annotation-language` in the Props section).

**Step 2: Verify visually**

Read the README around the new bullet (lines 244–252 after edit) to confirm placement and formatting.

**Step 3: Commit**

```bash
git add README.md
git commit -m "Document beforeCanvasLoad event in README"
```

---

### Task 6: Manual browser smoke test

**Files:** none modified.

Per CLAUDE.md: ask the user to start the test environment manually and provide the URL.

**Step 1: Ask the user for the URL**

Stop and ask the user to start their normal Vue test page (or JS-widget host page) and paste the URL.

**Step 2: Default behavior — no handler registered**

Without registering any `before-canvas-load` handler, load any IIIF manifest. Confirm:

- The viewer mounts and renders as today.
- DevTools console shows no warnings about `beforeCanvasLoad`.
- This validates the empty-`waitFor` fast path (`hooks.waitFor.length === 0` skips the await + nextTick entirely).

**Step 3: Sync handler — no Promise pushed**

Register a handler that does nothing:

```js
@before-canvas-load="(canvasId, hooks) => { console.log('before-canvas-load', canvasId); }"
```

Confirm:

- The console log fires before any tile fetch in DevTools Network tab.
- Tiles still load.
- Same fast path as Step 2 (no `waitFor` mutation).

**Step 4: Async handler — successful probe**

Register a handler that pushes a Promise that flips the `crossOriginPolicy` ref after a short delay:

```js
@before-canvas-load="(canvasId, hooks) => {
    hooks.waitFor.push(new Promise(resolve => {
        setTimeout(() => {
            policy.value = 'Anonymous';
            resolve();
        }, 200);
    }));
}"
```

Confirm:

- The first batch of tile requests in DevTools Network tab is delayed by ~200ms.
- The first tile requests carry an `Origin` header (i.e., crossOrigin is honored on the **first** fetch — no reload after).
- The runtime watcher does NOT fire (no second batch of tile requests with a different policy).

**Step 5: Async handler — rejecting Promise**

Register a handler that pushes a rejecting Promise:

```js
@before-canvas-load="(canvasId, hooks) => {
    hooks.waitFor.push(Promise.reject(new Error('probe failed')));
}"
```

Confirm:

- The viewer still mounts.
- DevTools console shows the warning `[GlycerineViewer] beforeCanvasLoad handler rejected; proceeding with current crossOriginPolicy` and the underlying error.
- Tiles load with whatever `crossOriginPolicy` was set on mount (likely `false`).

**Step 6: JS widget — `onBeforeCanvasLoad` option**

In a JS-widget host page, register the handler via the constructor option:

```js
const viewer = new GlycerineViewer(el, {
    manifest: '...',
    onBeforeCanvasLoad: (canvasId, hooks) => {
        hooks.waitFor.push(probeAndSetPolicy(canvasId, viewer));
    },
});
async function probeAndSetPolicy(canvasId, viewer) {
    // ... probe, then:
    viewer.rootProps.crossOriginPolicy = 'Anonymous';
}
```

Confirm:

- The handler fires before tile fetches.
- `viewer.rootProps.crossOriginPolicy = 'Anonymous'` is reflected on the first tile fetch.
- No `osdInitialized` is emitted twice (since OSD is constructed once).

**Step 7: Multi-canvas navigation (if the manifest has multiple canvases)**

Switch between canvases using the index panel. Confirm `before-canvas-load` fires once per canvas mount, with the correct `canvasId` each time. (Each canvas mount creates a new `ImageViewer`, so each fires its own event.)

**Step 8: Decision**

If any of the above fail, stop and report findings. The most likely failure mode is that `this.crossOriginPolicy` does not see the parent's updated value after `await Promise.all` — if so, the `await this.$nextTick()` line was inserted exactly to handle that, so the diagnosis would be a Vue 3 reactivity edge case worth investigating. If everything passes, proceed to commit log review.

---

### Task 7: Final review

**Files:** none modified.

**Step 1: Skim the full branch diff**

```bash
git log --oneline main..HEAD
git diff main..HEAD -- src/ README.md
```

Confirm all 5 commits are present, the diff is scoped to the four expected files (`ImageViewer.vue`, `GlycerineViewer.vue`, `main.js`, `README.md`) plus the design+plan docs, and no incidental changes leaked in.

**Step 2: Both builds clean**

```bash
npm run build
npm run build-lib
```

Confirm both succeed with no new warnings.

**Step 3: No commit if no changes**

This task does not produce a commit unless the diff review surfaced something that needs fixing.

---

## Done criteria

- `beforeCanvasLoad` emit declared on both `ImageViewer` and `GlycerineViewer`.
- `ImageViewer.initViewer()` is `async`, awaits `Promise.all(hooks.waitFor)` when populated, falls back gracefully on rejection.
- `GlycerineViewer` template re-emits with `canvas.id` injected.
- `onBeforeCanvasLoad` exposed on the JS widget via `#getRootProps()`.
- README documents the event under the Emits section with the `hooks.waitFor` mechanism explained.
- Manual smoke test (Task 6) passes for: no handler / sync handler / async-success / async-reject / JS widget / multi-canvas navigation.
- `npm run build` and `npm run build-lib` both clean.
