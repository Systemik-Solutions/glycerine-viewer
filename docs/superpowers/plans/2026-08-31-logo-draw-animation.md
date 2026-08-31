# Self-Drawing Logo Outline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the startup splash's fading raster logo with the redesigned Glycerine outline mark, animated so it draws itself from nothing to the complete outline on a loop.

**Architecture:** A new presentational component, `GlycerineLogo.vue`, inlines the brand artwork's two contour paths as SVG and animates `stroke-dashoffset` in scoped CSS. `GlycerineViewer.vue` renders it with `:animated="manifestIsLoading"` — the same condition that gates today's pulse. The old PNG and its pulse styles are removed.

**Tech Stack:** Vue 3 (Options API, `<style scoped>`), plain CSS animation. No new dependencies.

**Design spec:** `docs/superpowers/specs/2026-08-31-logo-draw-animation-design.md`

---

## Important context before you start

**There is no test runner and no linter in this repo.** `CLAUDE.md` states this explicitly and instructs *not* to follow TDD here. Verification in this plan is therefore by build success, by mechanical checks on file content, and by inspection in a running viewer — not by unit tests. Do not add a test framework.

**This is a library, not an application.** `npm run dev` is not a usable way to check your work. Per `CLAUDE.md`, when you reach Task 4 you must **ask the user to start the testing environment and give you a URL**. Do not attempt to start one yourself.

**Source artwork:** `C:\MyWork\systemik\projects\ardc_iaw\new-branding\Workbench Update files\Outline - White.svg`. Task 1 includes a check that verifies the path data you write matches this file byte for byte.

**Conventions in this codebase:** 4-space indent. Local component imports use double quotes (`from "@/components/Foo.vue"`); package imports use single quotes. Props carry a `//` comment above them describing what they do.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/components/GlycerineLogo.vue` | **New.** Renders the brand mark as inline SVG and owns the draw animation. Knows nothing about loading, manifests, or the viewer. One prop: `animated`. |
| `src/components/GlycerineViewer.vue` | **Modified.** Renders `GlycerineLogo` on the splash, passes `manifestIsLoading`, and supplies size and colour via the existing `.gv-start-logo` class. |
| `src/assets/logo.png` | **Deleted.** The old brand raster; no referents remain after Task 2. |

`GlycerineLogo.vue` is internal. Do **not** add it to the public exports in `src/main.js`.

---

## Task 1: Create the GlycerineLogo component

**Files:**
- Create: `src/components/GlycerineLogo.vue`

- [ ] **Step 1: Create the component file**

Create `src/components/GlycerineLogo.vue` with exactly this content. The two `d` attributes are long — copy them verbatim, do not retype or reformat them, and do not insert line breaks inside them.

```vue
<template>
    <svg
        class="gv-logo"
        viewBox="0 0 386.45 383.05"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Glycerine"
    >
        <!-- The outer and inner edges of the mark's outline ribbon, taken verbatim from the brand
             artwork (Outline - White.svg). Their real lengths differ (1064.61 and 1020.34), so
             pathLength normalises both to 1000 and a single keyframe set drives them together. -->
        <path
            class="gv-logo__stroke"
            :class="{ 'is-animated': animated }"
            pathLength="1000"
            d="M142.42,36.02c19.32,1.6,33.11,23.53,26.47,41.69-2.07,6.79-7.17,11.91-11.47,17.36-2.94,3.96-2.86,9.55-1.54,14.3.83,2.7,2.81,4.72,4.85,6.61,6.58,5.84,10.69,14,10.73,22.95-.34,7.68.54,16.1,7.09,21.17,11.42,9.21,36.55,11.01,45.51-2.54,3.65-6.23.61-13.92,1.89-20.67,1.73-11.73,9.83-21.74,21.28-25.6,23.43-8.24,47.04,13.69,41.24,37.3-3.02,13.6-15.66,24.17-29.67,24.59-5.64-.19-10.64,1.21-16.02,3.73-4.14,1.83-8.51,3.88-12.29,6.69-4.92,3.54-5.84,9.74-6.3,15.37-.71,6.56-3.43,12.66-7.91,17.41-8.43,7.46-4.14,14.32.39,22.45,3.51,5,7.14,10.04,8.1,16.27,1.38,13.28,12.15,17.51,24.06,18.61,6.52,1.2,13.01-.34,19.56-.36,10.13.33,19.71,5.74,25.3,14.19,13.58,20.02-.28,47.63-24.01,49.36-14.71,1.54-28.62-8.41-33.02-22.55-1.41-4.44-2.94-10-4.89-14.1-4-7.74-13.34-12.48-22.04-12.15-4.76-.09-9.22,1.57-13.99,1.46-11.24.03-22.03-7.14-26.53-17.46-5.87-12.31-.3-26.08,6.87-36.54,2.9-3.84,3.65-9.23,1.78-13.71-2.86-5.4-8.38-9.16-10.35-15.12-1.64-4.3-2.04-8.8-1.66-13.45.22-2.69.26-5.64-.88-8.07-3.51-7.34-12.01-13.01-20.11-14.42-9.28-.71-18.99-2.97-25.62-10.03-10.12-9.82-11.77-26.79-3.76-38.34,2.07-3.16,5.3-5.76,7.43-8.79,3.25-4.96,4.16-12.72-.18-17.51-1.52-1.75-3.52-3.12-5.25-4.69-5.38-4.8-9.18-11.5-10.32-18.55-3.38-20.49,14.34-39.16,34.97-36.9l.29.03Z"
        />
        <path
            class="gv-logo__stroke"
            :class="{ 'is-animated': animated }"
            pathLength="1000"
            d="M238.18,279.14c-8.73-2.26-16.62-7.79-19.17-16.75-1.41-5.67-2.19-11.69-6.16-16.29-5.11-7.76-11.92-18.49-7.22-28.02,1.75-3.58,5.21-6.02,7.46-9.21,6.84-9.4,1.51-21.75,11.5-30,4.45-3.51,10.12-5.93,15.22-8.48,3.92-1.79,7.99-3.58,12.44-4.2,4.22-.48,8.6.02,12.68-1.4,6.8-2.12,12.42-7.25,15.16-13.78,7.86-18.04-8.62-38.3-28.2-33.56-8.72,1.96-15.87,8.91-18.14,17.53-2.39,8.84,1.94,19.45-3.96,27.36-5.97,8.49-18.99,13-29.77,12.35-11-1.02-23.04-4.02-30.12-13.06-3.05-3.89-4.66-8.48-5.42-13.36-.74-6.25.69-13.02-2.44-18.79-4.66-9.77-13.61-10.47-14.1-23.32-.92-8.57,1.11-13.48,6.87-19.37,7.18-7.27,10.8-18.36,6.75-28.08-4.63-12.54-20.11-19.18-32.24-13.79-12.96,5.12-19.23,21.33-12.54,33.85,5.26,10.44,16.47,11.2,16.15,25.35-.01,4.52-1.22,9.04-3.48,12.85-2.33,3.79-6.3,6.39-8.49,10.34-7.76,12.29-1.3,29.58,12.43,34.11,4.82,1.84,10.29,1.35,15.21,2.78,12.72,3.51,26.56,14.62,24.62,28.93-1.43,10.68,3.58,15.83,10.09,23.21,3.47,5.33,3.75,12.24,1.64,18.09-6.51,12.27-16.41,23.94-7.33,38.08,4.84,7.71,15,11.41,23.79,9.25,3.45-.74,6.9-1.08,10.48-.78,10.88.24,22.35,6.86,26.71,16.97,1.83,4.18,3.53,8.62,4.69,13.1,2.34,9.31,9.81,16.54,19.18,18.31,30.05,5.14,41.23-36.72,12.68-47.33-7.33-2.9-14.38.07-21.94-.54-5.05-.38-10.09-.98-14.75-2.24l-.27-.07Z"
        />
    </svg>
</template>

<script>
export default {
    name: 'GlycerineLogo',
    props: {
        // Whether the outline continuously draws itself. When false it renders complete and static.
        animated: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style scoped>
.gv-logo {
    display: block;
    height: auto;
}

.gv-logo__stroke {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
}

/* Draw the outline from nothing (2400ms), hold it complete (900ms), then let the line keep
   travelling forward and slide out of frame (1400ms), followed by an empty beat (500ms). */
.gv-logo__stroke.is-animated {
    stroke-dasharray: 1000;
    animation: gv-logo-draw 5.2s linear infinite;
}

@keyframes gv-logo-draw {
    0% {
        stroke-dashoffset: 1000;
    }
    46.15% {
        stroke-dashoffset: 0;
    }
    63.46% {
        stroke-dashoffset: 0;
    }
    90.38% {
        stroke-dashoffset: -1000;
    }
    100% {
        stroke-dashoffset: -1000;
    }
}

@media (prefers-reduced-motion: reduce) {
    .gv-logo__stroke.is-animated {
        stroke-dasharray: none;
        animation: none;
    }
}
</style>
```

Notes on why this is shaped the way it is, so you don't "improve" it into breaking:

- **`pathLength="1000"` is load-bearing.** The two contours are genuinely different lengths (1064.61 and 1020.34 user units). Normalising both to 1000 is what lets one `@keyframes` block drive both and finish them together. Do not remove it and do not substitute the real lengths.
- **No `width` in `.gv-logo`.** The consumer sets the width (Task 2 sets `200px` via `.gv-start-logo`). Adding a width here would collide at equal specificity.
- **`stroke: currentColor`** so the consumer sets the colour. Do not hardcode `#f1f1ed` in this file.
- The keyframe percentages are the 5200ms timeline from the spec: 2400ms draw = 46.15%, +900ms hold = 63.46%, +1400ms travel out = 90.38%, +500ms empty = 100%.

- [ ] **Step 2: Verify the path data matches the source artwork exactly**

This guards against a transcription slip in the 2,400+ characters of curve data.

Run:

```bash
node -e "
const fs=require('fs');
const src='C:/MyWork/systemik/projects/ardc_iaw/new-branding/Workbench Update files/Outline - White.svg';
const od=[...fs.readFileSync(src,'utf8').matchAll(/<path[^>]*\sd=\"([^\"]+)\"/g)][0][1];
const [OUTER,INNER]=od.split(/(?=M)/).filter(Boolean);
const comp=fs.readFileSync('src/components/GlycerineLogo.vue','utf8');
console.log('outer path matches source:', comp.includes(OUTER));
console.log('inner path matches source:', comp.includes(INNER));
"
```

Expected output:

```
outer path matches source: true
inner path matches source: true
```

If either prints `false`, the path data was altered. Re-copy it from this plan; do not attempt to hand-patch the difference.

- [ ] **Step 3: Verify the library build succeeds**

Run: `npm run build`

Expected: build completes and writes to `dist/`, with no error mentioning `GlycerineLogo`. The component is not imported by anything yet, so this only confirms the file parses as a valid SFC.

- [ ] **Step 4: Commit**

```bash
git add src/components/GlycerineLogo.vue
git commit -m "Add GlycerineLogo component with self-drawing outline animation"
```

---

## Task 2: Render the new logo on the startup splash

**Files:**
- Modify: `src/components/GlycerineViewer.vue` (template line 377; imports around lines 393 and 418; `components` at 426-428; `setup()` at 1206; styles at 1956-1974)

Line numbers shift as you edit. Match on the quoted strings below rather than jumping to line numbers.

- [ ] **Step 1: Replace the splash `<img>` with the component**

Find (line 377):

```html
            <img :class="{ 'gv-start-logo': true, animation: manifestIsLoading }" :src="logoPath" alt="Glycerine" />
```

Replace with:

```html
            <GlycerineLogo class="gv-start-logo" :animated="manifestIsLoading" />
```

- [ ] **Step 2: Remove the old logo import**

Find (line 392-394, immediately after the opening `<script>` tag):

```js
<script>
import logoPath from '@/assets/logo.png';

import Button from 'primevue/button';
```

Replace with:

```js
<script>
import Button from 'primevue/button';
```

- [ ] **Step 3: Add the GlycerineLogo import**

Find (line 418, the last of the local component imports):

```js
import AnnotationSetFilter from "@/components/AnnotationSetFilter.vue";
```

Replace with:

```js
import AnnotationSetFilter from "@/components/AnnotationSetFilter.vue";
import GlycerineLogo from "@/components/GlycerineLogo.vue";
```

- [ ] **Step 4: Register the component**

Find (line 428):

```js
        TableViewer, ImageViewer, ResourceInfoCard, AnnotationSetFilter, Button, Dropdown, InputSwitch, Checkbox, Message, Listbox, Chip, TabView, TabPanel, DataTable, Column, InputText, Tree, Slider},
```

Replace with:

```js
        TableViewer, ImageViewer, ResourceInfoCard, AnnotationSetFilter, GlycerineLogo, Button, Dropdown, InputSwitch, Checkbox, Message, Listbox, Chip, TabView, TabPanel, DataTable, Column, InputText, Tree, Slider},
```

- [ ] **Step 5: Remove `logoPath` from `setup()`**

Find (lines 1203-1210):

```js
    setup() {
        return {
            version: __APP_VERSION__,
            logoPath,
            HtmlUtility,
            Helper,
```

Replace with:

```js
    setup() {
        return {
            version: __APP_VERSION__,
            HtmlUtility,
            Helper,
```

- [ ] **Step 6: Replace the startup styles**

Find (lines 1956-1974):

```css
/* Start up */
.gv-start-logo {
    max-width: 200px;
    filter: grayscale(1);
}

.gv-start-logo.animation {
    transition: filter .23s ease-in-out;
    animation: pulse 4s infinite;
}

@keyframes pulse {
    0% {
        filter: grayscale(1);
    }
    100% {
        filter: grayscale(0);
    }
}
```

Replace with:

```css
/* Start up */
.gv-start-logo {
    width: 200px;
    color: #f1f1ed;
}
```

`.gv-start-logo` keeps its name and position and becomes the splash's sizing and colour hook. This block is inside `<style scoped>`, but a child component's root element still receives the parent's scope attribute, so the rule reaches the `<svg>` without `:deep()`.

The mark is square (386.45 × 383.05), so `width: 200px` renders it at roughly 200 × 200. That is deliberately more visual presence than the old raster, which was 500 × 303 and rendered at about 200 × 121. This is the size the design was reviewed at.

- [ ] **Step 7: Verify no dangling references to the old logo remain in the viewer**

Run:

```bash
grep -n "logoPath\|logo.png\|gv-start-logo\|keyframes pulse\|GlycerineLogo" src/components/GlycerineViewer.vue
```

Expected: exactly four lines — the `GlycerineLogo` import, the `GlycerineLogo` registration in `components`, the `<GlycerineLogo class="gv-start-logo" …>` tag, and the `.gv-start-logo` CSS rule. **No** hit for `logoPath`, `logo.png`, or `keyframes pulse`.

- [ ] **Step 8: Verify the library build succeeds**

Run: `npm run build`

Expected: build completes with no error. A failure mentioning `logoPath is not defined` means Step 2 or Step 5 was applied but not the other.

- [ ] **Step 9: Commit**

```bash
git add src/components/GlycerineViewer.vue
git commit -m "Draw the new logo outline on the startup splash"
```

---

## Task 3: Remove the retired logo asset

**Files:**
- Delete: `src/assets/logo.png`

- [ ] **Step 1: Confirm the asset has no remaining referents**

Run:

```bash
grep -rn "logo.png" src/ README.md vite.config.js vite-jslib.config.js package.json
```

Expected: no output at all (grep exits 1). If anything is found, stop and resolve that reference before deleting the file.

- [ ] **Step 2: Delete the file**

```bash
git rm src/assets/logo.png
```

- [ ] **Step 3: Verify the library build still succeeds**

Run: `npm run build`

Expected: build completes with no error. A failure resolving `@/assets/logo.png` means Step 1 missed a referent — restore with `git checkout src/assets/logo.png` and investigate.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove the retired logo raster"
```

---

## Task 4: Verify both builds and the running viewer

No code changes in this task — it is the acceptance pass for §8 of the design spec.

- [ ] **Step 1: Verify both build targets**

Run: `npm run build-all`

Expected: both the UMD widget build (`jslib/`) and the library build (`dist/`) complete with no error. This matters because the two Vite configs differ — `vite.config.js` externalizes dependencies while `vite-jslib.config.js` bundles everything — and the logo must work in both.

- [ ] **Step 2: Confirm the artwork actually reached both bundles**

Run:

```bash
grep -rl "M142.42,36.02" dist/ jslib/
```

Expected: at least one file under `dist/` (the library build emits `glycerine-viewer.es.js` and `glycerine-viewer.umd.js`) and at least one under `jslib/`. This confirms the inline SVG was compiled into both outputs rather than being dropped or emitted as a separate asset.

- [ ] **Step 3: Ask the user to start the testing environment**

This is a library, so `npm run dev` is not a usable check. Ask the user to start their testing environment and give you the URL. Wait for it — do not try to start one yourself.

- [ ] **Step 4: Check the loading state**

Load a manifest in the running viewer and watch the splash while it loads.

Expected:
- The outline draws from nothing to complete, holds briefly, then the line keeps travelling forward and slides away, and the cycle repeats — roughly every 5.2 seconds.
- Both contours are drawn as thin off-white hairlines on the dark splash background.
- The two lines start at opposite ends of the mark and run counter to each other. **This is intended** — it is the chosen "A1 / opposed" choreography, not a bug.

- [ ] **Step 5: Check the completed outline**

Pause on a frame where the outline is fully drawn (the ~900ms hold), or compare against the source artwork opened directly in a browser.

Expected: both contours are fully closed with no gap anywhere. A short unclosed gap would mean `pathLength` was not honoured — report it rather than working around it.

- [ ] **Step 6: Check the resting states**

Expected:
- Once a manifest has loaded, the splash is replaced by the viewer as before.
- In the manifest-error state, the outline is complete and static, with the error messages below it — unchanged layout, just a static outline where the grayscale raster used to be.

- [ ] **Step 7: Check reduced motion**

Enable "Show animations in Windows" → Off (Settings → Accessibility → Visual effects), or use the browser devtools "Emulate CSS prefers-reduced-motion: reduce" rendering option. Reload the viewer and load a manifest.

Expected: the outline is complete and static while loading — no drawing, no dashes.

- [ ] **Step 8: Report results**

Report what you actually observed for each of Steps 4-7. If anything failed, say so plainly with what you saw. Do not claim the animation works without having watched it.

---

## Notes for the reviewer

- **No new props, emits, or i18n keys**, so the three-way sync between `GlycerineViewer.vue`, `src/jslib/main.js`, and `README.md` described in `CLAUDE.md` does not apply. `src/jslib/main.js` and `README.md` are untouched by this plan, and that is correct.
- **`GlycerineLogo` is internal** and deliberately absent from `src/main.js`'s public exports.
- **The wordmark and the solid mark are out of scope.** `Logos White.svg` and `Solid White.svg` are not used.
