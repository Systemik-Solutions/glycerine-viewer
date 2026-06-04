# Front-facing Annotation Set Filter — Design

**Date:** 2026-06-04
**Status:** Approved (design phase)
**Component target:** `src/components/GlycerineViewer.vue` (+ new `src/components/AnnotationSetFilter.vue`)

## 1. Purpose & scope

The annotation-set filter (the "Show" dropdown under **Settings → Annotation Filters**, bound to
`settings.filters.set`) is one of the most frequently used controls, yet it is buried in the
Settings sidebar. This feature surfaces it as a front-facing control on the viewer so it is
visible and reachable at a glance.

The new control is a **pure mirror** of the existing state:

- Single-select, identical options to the existing `filterSetOptions` (no new filtering logic).
- Bound to the same `settings.filters.set` value, so the new control and the Settings dropdown
  stay in sync automatically — changing either updates the other.

**Out of scope:**

- The legacy Settings → Annotation Filters → Show dropdown is **unchanged** and remains in place.
- No change to the other annotation filters (language / line colour / line weight) — they stay in
  Settings only.
- No change to filtering behaviour or to `filterSetOptions`.
- Fading the whole control layer (toolbar + info card) is explicitly a *possible later phase*, not
  part of this work.

## 2. Layout & placement

A floating **pill** docked at the **bottom-centre** of the viewer area, overlaying the image.

OpenSeadragon's own navigation controls are disabled (`showZoomControl`, `showHomeControl`,
`showFullPageControl` are all `false` in `ImageViewer.vue`, and there is no navigator), so the
entire bottom band is free and the pill collides with nothing. The only occupied zones are the
top-left info card and the top-right action toolbar.

```
                          ( artwork )

                ┌──────────────────────────────┐
                │  ▦   All annotations       ▾  │
                └──────────────────────────────┘
                         bottom-centre
```

- The pill contains: a leading "layers"-style icon (a PrimeIcons glyph), the **current selection
  label**, and a dropdown caret.
- Clicking the pill opens a PrimeVue `Dropdown` option list with the same options as
  `filterSetOptions`, in the same order: **All annotations** → one entry per annotation set
  (labelled `Creator – Label`) → **No annotations**.
- The label has a **max-width with ellipsis truncation** so long `Creator – Label` strings cannot
  grow the pill unbounded; the full text is shown in the open option panel.
- The pill is visually distinct from the round action buttons — a floating elevated control (see
  §7 Styling).

## 3. States & labels

- The pill always shows the **current selection's label verbatim**, including the "All annotations"
  and "No annotations" states.
- **No special "filter active" visual state.** The label text itself is the only cue that a
  non-"All" filter is in effect. (Decision: keep it simple; do not add an accent/dot indicator and
  do not change auto-hide behaviour based on the selected value.)

## 4. Auto-hide behaviour (immersion)

The pill fades away during passive viewing to minimise its effect on the immersive experience, but
is visible by default so first-glance discoverability is preserved.

- **Visible by default** on load and after any canvas change.
- Fades out via a gentle opacity transition (~300ms) to **fully hidden** after **3 seconds** of no
  pointer movement over the viewer.
- **Reappears instantly** on any pointer movement over the viewer. Pointer movement resets the 3s
  idle timer.
- The idle timer is **suspended** (pill never fades) while any of the following is true:
  - the dropdown option panel is **open**, or
  - the pointer is **hovering the pill**, or
  - the pill has **keyboard focus**.
- The 3-second idle delay is defined as a single **named constant** so it can be tuned easily.
- **Scope: this pill only.** The top-right toolbar and the top-left info card are *not* affected by
  this auto-hide in this phase.

## 5. Visibility gating

The pill renders only when:

```
displayAnnotations && hasAnnotation && viewMode === 'image'
```

- Only in **image** view (not in the annotation **table** view — consistent with how the play
  controls are scoped to `viewMode === 'image'`).
- Only when the manifest actually has annotations.

In table view the filter remains reachable through the Settings dropdown, as today.

## 6. Component structure

`GlycerineViewer.vue` is already large (~1700 lines). Rather than inline additional template and
timer logic, the pill lives in a small, single-responsibility child component.

**New component: `src/components/AnnotationSetFilter.vue`**

- **Props:**
  - `options` — the option list (the parent passes `filterSetOptions`).
  - `modelValue` — the current selection (the parent passes `settings.filters.set`).
- **Emits:**
  - `update:modelValue` — emitted on change so the **parent remains the single source of truth**
    (`settings.filters.set`). This is what keeps the Settings dropdown in sync for free.
- **Owns internally:**
  - The pill markup, the PrimeVue `Dropdown`, and its dark styling (§7).
  - The auto-hide state: visibility, the 3s idle timer, the pointer-move listener wired to the
    viewer root element, and the open/hover/focus overrides (§4), plus the fade transition.

**Parent responsibilities (`GlycerineViewer.vue`):**

- Decide *whether* to render the component (the gating in §5).
- Pass `filterSetOptions` and bind `settings.filters.set` via `v-model`.

This keeps a clean split: the parent owns *whether* the control shows and the source-of-truth
value; the component owns *how it looks and when it fades*.

## 7. Styling / theme

The viewer surround is dark and the existing top-left info card is dark translucent. To blend in,
the pill uses a **dark theme** rather than the default (light) PrimeVue styling used in the Settings
sidebar.

- **Dark pill + dark menu.** The pill (icon, label, caret) and the open option panel use a dark
  surface with light text, matching the visual language of the info card rather than the light
  Settings sidebar. Hover and selected states in the menu use a lighter dark tint so options remain
  distinguishable.
- **Caveat 1 — readability over a variable image.** The pill overlays the artwork, which can be
  light or dark in places. Pure transparency risks light text becoming unreadable over a pale
  region. Therefore the dark surface is kept **mostly opaque** with only slight translucency, plus
  a subtle **backdrop blur and soft shadow**, so the control stays legible regardless of the image
  behind it (and remains accessible for contrast).
- **Caveat 2 — scoped styling, no leakage.** The Settings-pane dropdowns must keep their current
  default (light) appearance. The dark styling is therefore **scoped to this component only**
  (scoped CSS / `:deep()` on the component's own dropdown, or PrimeVue's pass-through `pt` API) and
  must never be applied as a global PrimeVue override. This pairs naturally with the §6 decision to
  isolate the control in its own component.
- **Menu opens upward.** Because the pill sits at the bottom, the option panel should open *above*
  the pill. PrimeVue auto-flips when there is no room below; use `append-to="self"` so the panel is
  positioned relative to the pill (consistent with the Settings dropdowns).

## 8. i18n

No new option strings are required — the option labels come from the existing `filterSetOptions`
(`ui.allAnnotations`, the per-set labels, `ui.noAnnotations`). If the pill needs an accessible
label / tooltip (e.g. an `aria-label` or `title` such as "Annotation set"), add a key to
`src/i18n/langs/en.js` first and mirror it to every other language file, per the repository i18n
convention.

## 9. Open items / future phases

- **Phase 2 (separate):** optionally fade the entire control layer (toolbar + info card + pill)
  together on a shared idle timer as an "immersive mode", as discussed but deferred.
