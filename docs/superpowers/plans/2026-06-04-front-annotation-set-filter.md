# Front-facing Annotation Set Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the existing annotation-set "Show" filter as a dark, auto-hiding pill docked at the bottom-centre of the image viewer, mirroring `settings.filters.set`.

**Architecture:** A new self-contained `AnnotationSetFilter.vue` child component renders the pill (a PrimeVue `Dropdown` styled dark) and owns its own idle auto-hide behaviour. `GlycerineViewer.vue` decides whether to render it (image view + has annotations) and binds it to `settings.filters.set` via `v-model`, so the new pill and the existing Settings dropdown stay in sync automatically.

**Tech Stack:** Vue 3 (Options API), PrimeVue 3.26.1 (`Dropdown`), PrimeIcons, scoped CSS with `:deep()`.

**Testing note:** This repo has **no test runner** and `CLAUDE.md` directs **not** to use TDD here. Verification is (a) `npm run build` to catch compile errors, and (b) **manual browser checks** in a running test environment. Per `CLAUDE.md`, `npm run dev` is not a valid library test harness — **ask the user to start the testing environment and provide the URL** before any browser verification step.

---

## File Structure

- **Create:** `src/components/AnnotationSetFilter.vue` — the pill. One responsibility: render the dark dropdown control and manage its own show/auto-hide visibility. Interface: props `modelValue` + `options`; emits `update:modelValue`. Depends on `primevue/dropdown`.
- **Modify:** `src/components/GlycerineViewer.vue` — import + register the component; render it (gated) in the viewer overlay; bind `v-model="settings.filters.set"` and `:options="filterSetOptions"`.
- **Modify (i18n):** `src/i18n/langs/*.js` (all 19 files) — add one `ui.annotationSet` key for the control's accessible label/tooltip.

---

## Task 1: Create the `AnnotationSetFilter.vue` pill (static, dark, no auto-hide yet)

**Files:**
- Create: `src/components/AnnotationSetFilter.vue`

- [ ] **Step 1: Create the component file**

Create `src/components/AnnotationSetFilter.vue` with this exact content:

```vue
<template>
    <div class="gv-anno-set-filter">
        <i class="pi pi-clone gv-anno-set-filter__icon"></i>
        <Dropdown
            :modelValue="modelValue"
            :options="options"
            option-label="label"
            option-value="value"
            append-to="self"
            class="gv-anno-set-filter__dropdown"
            @update:modelValue="$emit('update:modelValue', $event)"
        />
    </div>
</template>

<script>
import Dropdown from 'primevue/dropdown';

export default {
    name: 'AnnotationSetFilter',
    components: { Dropdown },
    props: {
        // The currently selected annotation set value ('all', a set id, or 'none').
        modelValue: {
            type: [String, Number],
            default: 'all',
        },
        // The option list, same shape as GlycerineViewer's filterSetOptions:
        // [{ label: string, value: string }].
        options: {
            type: Array,
            required: true,
        },
    },
    emits: ['update:modelValue'],
};
</script>

<style scoped>
.gv-anno-set-filter {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background-color: rgba(20, 20, 20, 0.85);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    color: #fff;
    transition: opacity 0.3s ease;
}

.gv-anno-set-filter__icon {
    font-size: 1rem;
    color: #fff;
}

.gv-anno-set-filter__dropdown {
    max-width: 16rem;
}

/* Dark theming scoped to this component's dropdown only.
   The panel uses append-to="self", so it renders inside this component's
   DOM and :deep() reaches it without leaking to the Settings dropdowns. */
.gv-anno-set-filter :deep(.p-dropdown) {
    background: transparent;
    border: none;
    box-shadow: none;
}

.gv-anno-set-filter :deep(.p-dropdown:not(.p-disabled):hover) {
    border-color: transparent;
}

.gv-anno-set-filter :deep(.p-dropdown .p-dropdown-label) {
    color: #fff;
    padding: 0.1rem 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.gv-anno-set-filter :deep(.p-dropdown .p-dropdown-trigger) {
    color: #fff;
    width: 1.5rem;
}

.gv-anno-set-filter :deep(.p-dropdown-panel) {
    background: rgba(20, 20, 20, 0.97);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
}

.gv-anno-set-filter :deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item) {
    color: #fff;
}

.gv-anno-set-filter :deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover) {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
}

.gv-anno-set-filter :deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight) {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
}
</style>
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build completes with no errors (the new file is not imported anywhere yet, but this confirms the SFC parses).

- [ ] **Step 3: Commit**

```bash
git add src/components/AnnotationSetFilter.vue
git commit -m "$(cat <<'EOF'
Add AnnotationSetFilter pill component

Dark, bottom-centre dropdown that mirrors an annotation-set selection.
Not yet wired into the viewer.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Integrate the pill into `GlycerineViewer.vue`

**Files:**
- Modify: `src/components/GlycerineViewer.vue` (import + register near line 388/418; render in overlay after the toolbar block at line 147)

- [ ] **Step 1: Import the component**

In `src/components/GlycerineViewer.vue`, find the block of `@/components/*.vue` imports (around line 403–408). Add this import immediately after the `ResourceInfoCard` import:

```javascript
import AnnotationSetFilter from "@/components/AnnotationSetFilter.vue";
```

- [ ] **Step 2: Register the component**

In the `components: { ... }` object (lines 416–418), add `AnnotationSetFilter` to the list. Change:

```javascript
        TableViewer, ImageViewer, ResourceInfoCard, Button, Dropdown, InputSwitch, Checkbox, Message, Listbox, Chip, TabView, TabPanel, DataTable, Column, InputText, Tree, Slider},
```

to:

```javascript
        TableViewer, ImageViewer, ResourceInfoCard, AnnotationSetFilter, Button, Dropdown, InputSwitch, Checkbox, Message, Listbox, Chip, TabView, TabPanel, DataTable, Column, InputText, Tree, Slider},
```

- [ ] **Step 3: Render the pill in the viewer overlay**

In the template, find the closing `</div>` of the toolbar block at line 147 (the `<div class="absolute" style="top:1rem;right:1rem">` ... `</div>` that holds the round action Buttons). Immediately **after** that closing `</div>` (i.e., between line 147 and the `<Transition name="slide">` at line 148), insert:

```html
            <AnnotationSetFilter
                v-if="displayAnnotations && hasAnnotation && viewMode === 'image'"
                v-model="settings.filters.set"
                :options="filterSetOptions"
            />
```

This sits inside the `ref="gViewer"` element (which is `position: relative`), so the pill's `position: absolute; bottom; left: 50%` anchors to the viewer area. `displayAnnotations`, `hasAnnotation`, `viewMode`, `settings.filters.set`, and `filterSetOptions` are all already defined on this component (used elsewhere, e.g. lines 129, 137, 168, 890).

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Manual browser verification**

Ask the user to start the test environment and provide the URL, then load a manifest that has one or more annotation sets, in **image** view. Confirm:
- A dark pill appears at the bottom-centre showing the current selection (default "All Annotations").
- Opening the pill lists: "All Annotations" → each set (`Creator – Label`) → "No Annotations".
- The option panel opens **above** the pill (auto-flipped, since the pill is near the bottom) and is dark-themed to match.
- Choosing a set updates the annotations shown on the image.
- Opening **Settings → Annotation Filters → Show** reflects the same value; changing it there updates the pill, and vice versa (two-way sync via shared `settings.filters.set`).
- Switching to the annotation **table** view hides the pill; switching back to image shows it.
- A manifest with no annotations shows **no** pill.

- [ ] **Step 6: Commit**

```bash
git add src/components/GlycerineViewer.vue
git commit -m "$(cat <<'EOF'
Surface annotation-set filter as bottom-centre pill in image view

Renders AnnotationSetFilter bound to settings.filters.set so it stays in
sync with the existing Settings dropdown. Image view only, and only when
the manifest has annotations.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add idle auto-hide behaviour to the pill

Adds: visible-by-default, fade out after 3s of no pointer movement over the viewer, instant reveal on movement, and never-hide overrides while the dropdown is open / the pill is hovered / the pill has keyboard focus.

**Files:**
- Modify: `src/components/AnnotationSetFilter.vue`

- [ ] **Step 1: Add the hidden-state class binding and interaction handlers to the template**

In `src/components/AnnotationSetFilter.vue`, replace the entire `<template>` block with:

```vue
<template>
    <div
        class="gv-anno-set-filter"
        :class="{ 'gv-anno-set-filter--hidden': !visible }"
        @mouseenter="onHoverStart"
        @mouseleave="onHoverEnd"
        @focusin="onFocusStart"
        @focusout="onFocusEnd"
    >
        <i class="pi pi-clone gv-anno-set-filter__icon"></i>
        <Dropdown
            :modelValue="modelValue"
            :options="options"
            option-label="label"
            option-value="value"
            append-to="self"
            class="gv-anno-set-filter__dropdown"
            @update:modelValue="$emit('update:modelValue', $event)"
            @show="onPanelShow"
            @hide="onPanelHide"
        />
    </div>
</template>
```

- [ ] **Step 2: Replace the `<script>` block with the auto-hide logic**

Replace the entire `<script>` block with:

```vue
<script>
import Dropdown from 'primevue/dropdown';

// Milliseconds of pointer inactivity before the pill fades out. Tune here.
const IDLE_HIDE_DELAY = 3000;

export default {
    name: 'AnnotationSetFilter',
    components: { Dropdown },
    props: {
        // The currently selected annotation set value ('all', a set id, or 'none').
        modelValue: {
            type: [String, Number],
            default: 'all',
        },
        // The option list, same shape as GlycerineViewer's filterSetOptions:
        // [{ label: string, value: string }].
        options: {
            type: Array,
            required: true,
        },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            visible: true,
            isPanelOpen: false,
            isHovering: false,
            isFocused: false,
            hideTimer: null,
            activityTarget: null,
            onActivity: null,
        };
    },
    mounted() {
        // Reveal on any pointer movement over the whole viewer. Fall back to
        // window if the container can't be found.
        this.activityTarget = this.$el.closest('.gv-container') ?? window;
        this.onActivity = () => this.reveal();
        this.activityTarget.addEventListener('mousemove', this.onActivity);
        this.scheduleHide();
    },
    beforeUnmount() {
        if (this.activityTarget && this.onActivity) {
            this.activityTarget.removeEventListener('mousemove', this.onActivity);
        }
        this.clearHideTimer();
    },
    methods: {
        reveal() {
            this.visible = true;
            this.scheduleHide();
        },
        scheduleHide() {
            this.clearHideTimer();
            this.hideTimer = setTimeout(() => {
                // Overrides: never hide while open, hovered, or focused.
                if (!this.isPanelOpen && !this.isHovering && !this.isFocused) {
                    this.visible = false;
                }
            }, IDLE_HIDE_DELAY);
        },
        clearHideTimer() {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
        },
        onPanelShow() {
            this.isPanelOpen = true;
            this.visible = true;
            this.clearHideTimer();
        },
        onPanelHide() {
            this.isPanelOpen = false;
            this.scheduleHide();
        },
        onHoverStart() {
            this.isHovering = true;
            this.visible = true;
            this.clearHideTimer();
        },
        onHoverEnd() {
            this.isHovering = false;
            this.scheduleHide();
        },
        onFocusStart() {
            this.isFocused = true;
            this.visible = true;
            this.clearHideTimer();
        },
        onFocusEnd() {
            this.isFocused = false;
            this.scheduleHide();
        },
    },
};
</script>
```

- [ ] **Step 3: Add the hidden-state CSS rule**

In the `<style scoped>` block, immediately after the `.gv-anno-set-filter { ... }` rule, add:

```css
.gv-anno-set-filter--hidden {
    opacity: 0;
    pointer-events: none;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Manual browser verification**

In the running test environment (image view, manifest with annotation sets), confirm:
- The pill is visible on load, then **fades out ~3s after the mouse stops moving** over the viewer.
- Moving the mouse anywhere over the viewer **instantly brings it back**.
- While the pill is faded out, opening it is impossible (pointer-events disabled) — but a mouse move first reveals it, then it opens normally.
- It does **not** fade while: the dropdown panel is open, the mouse is hovering the pill, or the pill has keyboard focus (tab to it and leave the mouse still — it stays).
- After closing the panel / moving the mouse off / blurring, the 3s idle countdown resumes.

- [ ] **Step 6: Commit**

```bash
git add src/components/AnnotationSetFilter.vue
git commit -m "$(cat <<'EOF'
Add idle auto-hide to annotation-set filter pill

Pill is visible by default and fades after 3s of no pointer movement over
the viewer; reveals instantly on movement. Never hides while the dropdown
is open, the pill is hovered, or it has keyboard focus.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Add accessible label (i18n) and apply it to the pill

Adds a `ui.annotationSet` string and uses it as the dropdown's `aria-label` and the pill's `title` tooltip.

**Files:**
- Modify: `src/i18n/langs/en.js`
- Modify: `src/i18n/langs/{da,de,el,es,fi,fr,hi,it,ja,ko,nl,no,pl,pt,ru,sv,vi,zh}.js`
- Modify: `src/components/AnnotationSetFilter.vue`

- [ ] **Step 1: Add the key to English first**

In `src/i18n/langs/en.js`, find the line `noAnnotations: 'No Annotations',` (line 13). Add a new line immediately after it:

```javascript
        annotationSet: 'Annotation Set',
```

- [ ] **Step 2: Mirror the key to every other language file**

In **each** of these 18 files, find the `noAnnotations:` line in the `ui` object and add `annotationSet: 'Annotation Set',` on the line immediately after it (English value as the initial translation — translators can refine later; missing keys otherwise fall back to showing the raw key):

`src/i18n/langs/da.js`, `de.js`, `el.js`, `es.js`, `fi.js`, `fr.js`, `hi.js`, `it.js`, `ja.js`, `ko.js`, `nl.js`, `no.js`, `pl.js`, `pt.js`, `ru.js`, `sv.js`, `vi.js`, `zh.js`

(If a given file uses a different key ordering and has no `noAnnotations` line adjacent, place `annotationSet: 'Annotation Set',` anywhere inside that file's `ui: { ... }` object.)

- [ ] **Step 3: Apply the label to the pill's dropdown and root**

In `src/components/AnnotationSetFilter.vue`, update the `<template>`:

Add `:title="$t('ui.annotationSet')"` to the root `<div class="gv-anno-set-filter" ...>` (alongside the existing class/`:class`/event handlers), and add `:aria-label="$t('ui.annotationSet')"` to the `<Dropdown ...>` (alongside its existing attributes). The resulting template is:

```vue
<template>
    <div
        class="gv-anno-set-filter"
        :class="{ 'gv-anno-set-filter--hidden': !visible }"
        :title="$t('ui.annotationSet')"
        @mouseenter="onHoverStart"
        @mouseleave="onHoverEnd"
        @focusin="onFocusStart"
        @focusout="onFocusEnd"
    >
        <i class="pi pi-clone gv-anno-set-filter__icon"></i>
        <Dropdown
            :modelValue="modelValue"
            :options="options"
            option-label="label"
            option-value="value"
            append-to="self"
            class="gv-anno-set-filter__dropdown"
            :aria-label="$t('ui.annotationSet')"
            @update:modelValue="$emit('update:modelValue', $event)"
            @show="onPanelShow"
            @hide="onPanelHide"
        />
    </div>
</template>
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Manual browser verification**

In the running test environment, hover the pill and confirm a tooltip "Annotation Set" appears (English locale). Optionally switch the UI language in Settings and confirm the control still works (label falls back to "Annotation Set" until translated).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/langs src/components/AnnotationSetFilter.vue
git commit -m "$(cat <<'EOF'
Add i18n label for annotation-set filter pill

New ui.annotationSet key (mirrored to all locales) used as the pill's
aria-label and tooltip.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Full build of both outputs**

Run: `npm run build-all`
Expected: both the library (`dist/`) and the UMD widget (`jslib/`) build with no errors.

- [ ] **Step 2: End-to-end manual check**

In the running test environment, run through the §Task 2 and §Task 3 manual checks once more in a single session to confirm nothing regressed: sync with Settings, image-only gating, no-annotation manifests, auto-hide + overrides.

---

## Notes / out of scope (from the design spec)

- The legacy Settings → Annotation Filters → Show dropdown is intentionally **unchanged**.
- Fading the whole control layer (toolbar + info card) together ("immersive mode") is a **future phase**, not part of this plan.
- No new filtering logic; the pill reuses `filterSetOptions` and `settings.filters.set` verbatim.
