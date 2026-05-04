# `beforeCanvasLoad` event — design

## Goal

Emit a new event `beforeCanvasLoad` from `GlycerineViewer` (mirrored on
`ImageViewer`) before OpenSeadragon is constructed, with the canvas ID
as a parameter. The consumer can attach asynchronous work (e.g., a HEAD
request to inspect `Access-Control-Allow-Origin`) to the event payload;
OSD initialization waits for that work to complete before reading
`crossOriginPolicy`. The result: a consumer can pick the right CORS
mode per canvas and have OSD use it on the first tile fetch — no
post-init reload, no wasted requests.

## Event signature

`GlycerineViewer` emit: `before-canvas-load`. Payload:

- `canvasId: String` — same canvas ID flavor used by `canvasLoaded`.
- `hooks: { waitFor: Promise[] }` — the consumer pushes Promises into
  `hooks.waitFor`. `ImageViewer.initViewer()` awaits `Promise.all(...)`
  before constructing OSD.

`ImageViewer` emit: `beforeCanvasLoad` with payload `(hooks)` only —
no canvas ID, since `ImageViewer` does not carry one. `GlycerineViewer`
wraps the inner emit at the template level (mirrors how `canvasLoaded`
works today), substituting the bare emit for one that carries
`canvas.id`. The same `hooks` object reference flows through unchanged,
so any `waitFor.push(...)` a consumer does mutates the array that
`ImageViewer` awaits.

### Consumer usage

```html
<GlycerineViewer
  :cross-origin-policy="policy"
  @before-canvas-load="(canvasId, hooks) => hooks.waitFor.push(probeAndSetPolicy(canvasId))"
/>
```

```js
async function probeAndSetPolicy(canvasId) {
    const url = canvasIdToImageUrl(canvasId);
    const headers = await fetch(url, { method: 'HEAD' }).then(r => r.headers);
    policy.value = headers.get('Access-Control-Allow-Origin') === '*' ? 'Anonymous' : false;
}
```

JS widget consumer:

```js
new GlycerineViewer(el, {
    manifest: '...',
    onBeforeCanvasLoad: (canvasId, hooks) => {
        hooks.waitFor.push(probeAndSetPolicy(canvasId));
    },
});
```

The widget consumer mutates `widget.rootProps.crossOriginPolicy = ...`
to drive the prop value (same pattern the runtime watcher relies on).

## Why an array, not a callback

`hooks.waitFor` is a plain array. Equivalent power to an `until(p)`
callback or a Promise-collector closure, but with one fewer indirection
and visibly mutable from the consumer side — no hidden state, no
naming bikeshed about `until` / `wait` / `block`.

## `ImageViewer.initViewer()` becomes async

Method signature changes from `initViewer()` to `async initViewer()`.
The new flow:

```js
async initViewer() {
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
    // existing OSD construction follows here, reading this.crossOriginPolicy
}
```

Design notes:

- **Empty `waitFor`** (no consumer registered, or a synchronous-only
  consumer) is the existing behavior — we skip both the `await` and the
  `$nextTick`, and `initViewer()` runs effectively synchronously.
- **`$nextTick` after `Promise.all`** is a safety belt. Vue 3 props
  read live values from the parent's reactive source, so a ref the
  consumer flipped from inside their resolved Promise should already
  be visible via `this.crossOriginPolicy`. The `$nextTick` makes the
  contract robust against future Vue reactivity changes and makes the
  intent explicit at the call site.
- **`try / catch`** prevents a rejected consumer probe from bricking
  the viewer. On rejection we log a warning and proceed with the
  current `crossOriginPolicy` — the consumer still gets a working
  viewer, just possibly under the wrong CORS mode.
- **`mounted()` is unchanged.** Vue does not await values returned from
  lifecycle hooks, but that does not matter — `mounted()` just calls
  `this.initViewer()` and ignores the returned Promise. There is no
  code after that call in `mounted()` today.

## `GlycerineViewer` wiring

Add `'beforeCanvasLoad'` to the component's `emits` array.

Add an event listener on the `<ImageViewer>` template element,
immediately above the existing `@canvasLoaded` line:

```html
@beforeCanvasLoad="(hooks) => { $emit('beforeCanvasLoad', canvas.id, hooks) }"
@canvasLoaded="() => { $emit('canvasLoaded', canvas.id) }"
```

The same `hooks` object reference is forwarded to the consumer — they
push Promises into `hooks.waitFor` and `ImageViewer` awaits them.

## JS widget

Add to `src/jslib/main.js`'s `#getRootProps()`:

```js
onBeforeCanvasLoad: this.options.onBeforeCanvasLoad,
```

Place it next to the other `on*` handlers, near `onCanvasLoaded`.

## Documentation

`README.md` updates:

- Add a `before-canvas-load` bullet to the **Emits** section under
  `### Glycerine Viewer`. Document the signature
  `(canvasId, hooks)`, explain the `hooks.waitFor` mechanism, and
  show the CORS-probe example. Note that OSD construction is awaited
  until all pushed Promises resolve.
- The widget side does not need a separate documentation entry — the
  existing convention "all events are accepted as `on<EventName>`
  handlers" covers it.

## Edge cases

- **Multiple consumers / multiple Promises.** Both/all are awaited
  via `Promise.all`. If any reject, the catch falls through and we
  init with the current policy.
- **Handler throws synchronously.** Vue's `$emit` will propagate the
  throw. We do not catch synchronous throws — that is a programming
  error in the consumer, and silently swallowing it would hide bugs.
  Async rejections (the documented contract) are caught.
- **Probe never resolves.** OSD never initializes. The consumer is
  responsible for adding a timeout in their probe — we do not impose
  one (YAGNI; we can add one later if real-world usage shows it
  matters).
- **`crossOriginPolicy` runtime change after `beforeCanvasLoad`.** The
  existing watcher (added in the previous branch task) handles this
  the same way it handles any other runtime change — soft reload via
  `viewer.close()` + `viewer.open(buildTileSources())`.

## Out of scope

- No `setCrossOriginPolicy` or other imperative method on the JS
  widget — `widget.rootProps.crossOriginPolicy = ...` continues to be
  the public mutation path.
- No timeout on `Promise.all`.
- No analogous `hooks` payload on `canvasLoaded` — there is no
  use case for awaiting after canvas load.

## Files touched

- `src/components/ImageViewer.vue` — add the emit, convert
  `initViewer()` to `async`, add the `await Promise.all` block.
- `src/components/GlycerineViewer.vue` — add `'beforeCanvasLoad'` to
  `emits`, add the template handler that re-emits with `canvas.id`.
- `src/jslib/main.js` — add `onBeforeCanvasLoad` to `#getRootProps()`.
- `README.md` — document the event under **Emits**.
