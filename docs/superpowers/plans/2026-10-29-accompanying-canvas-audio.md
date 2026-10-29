# Accompanying Canvas Audio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Play sound while viewing an image using canvas-level accompanyingCanvas in either direction.

**Architecture:** Preserve main media descriptors and add a separate supported companion descriptor in ManifestParser. Compose ImageViewer/TableViewer and a compact AudioViewer in GlycerineViewer; dispose Video.js players when unmounted.

**Tech Stack:** Vue 3, Video.js 8, existing IIIF parsers and Vite builds; no new dependencies.

**Spec:** ../specs/2026-10-29-accompanying-canvas-audio-design.md

## Global Constraints

- Embedded, canvas-level Image/Sound pairs only; one resource per canvas.
- Preserve main canvas identity and declared MIME types; no autoplay or looping.
- No TDD or unit-test infrastructure, per repository instructions.
- Browser checks require the user's running environment URL.
- Execute in the existing feature/canvas-soundtrack branch; leave changes reviewable without committing or publishing.

## Review Focus

- Invalid companion content must not break main media.
- Audio-main annotations must not overlay its accompanying image.
- Navigation must stop playback even when neighboring canvases share a source URL.
- Image/table switching must retain the audio player.
- Main thumbnail priority and original media descriptors must remain intact.

## Task 1: Parse supported pairs

Files: src/libraries/iiif/manifest-parser.js

- [x] Add getAccompanyingCanvas(canvas), returning null or { id, image } / { id, audio } only for supported opposite-media pairs.
- [x] Attach that descriptor in getCanvases without replacing main image/audio/video fields.
- [x] Fall back to the accompanying image thumbnail for audio-main canvases only.
- [x] Verify both directions, malformed and unsupported companions, thumbnails, MIME preservation, unchanged input, and ordinary media using a standalone parser smoke check.

## Task 2: Compose image and audio

Files: src/components/GlycerineViewer.vue, src/components/AudioViewer.vue, src/components/VideoPlayer.vue

- [x] Add computed canvasViews entries { canvas, image, audio } for rendering, keeping main event identity.
- [x] Key the canvas loop, give the image a shrinking flex area, and place a compact AudioViewer below it outside the image/table conditional.
- [x] Pass annotations only for a main image; retain audio-only and video presentation.
- [x] Add compact: Boolean = false to AudioViewer; omit the icon and full-height layout in compact mode.
- [x] Replace beforeDestroy with beforeUnmount and dispose safely. Retain the existing Video.js options and avoid proxying its player instance.
- [x] Verify component compilation and inspect lifecycle/layout conditions; browser checks remain pending the test URL.

## Task 3: Document and verify

Files: README.md, examples/accompanying-canvas/*.json, this plan

- [x] Document scope and playback behavior, and supply image-main/audio-main plus unsupported and ordinary-media example manifests.
- [x] Run npm run build and npm run build-lib, inspect outputs and git diff --check.
- [x] Review the final change against the approved design and record verification outcomes here.

## Execution record

- User approved the design. Implementation proceeds inline under the existing request; no additional approval gate.

- Parser smoke checks passed for both directions; unchanged input; primary identity and descriptors; MIME preservation; explicit main thumbnail priority; IIIF level 0, IIIF level 1, and plain-image fallback thumbnails; ordinary image/audio/video; malformed and unsupported companions; manifest-level exclusion; and non-recursive nested content.
- npm run build-all passed: UMD widget and Vue library outputs generated. The library build reported PrimeVue output.globals name warnings.
- Independent code review found no actionable issues. git diff --check passed.
- Browser validation is pending the user-provided testing URL; no browser behavior is claimed as verified. No test runner, dependencies, commits, or publishing were added.

### Browser validation follow-up

- User supplied http://localhost:5174/. The example manifests are served by Laragon Apache at http://localhost/glycerine-viewer/examples/accompanying-canvas/.
- Confirmed Apache initially returned HTTP 200 without Access-Control-Allow-Origin. Added examples/accompanying-canvas/.htaccess scoped to public JSON fixtures; confirmed HTTP 200 with Access-Control-Allow-Origin: * and reloaded the test app successfully.
- Image-main browser checks passed: image and compact controls render together, manual playback advances with paused=false, mute and seeking work, and navigation to a different canvas sharing the same track creates a different player paused at time zero.
- Image zoom and pan were exercised. A source-image EncodingError was logged during image initialization/navigation; the image rendered and remained interactive. This was not attributed to the new audio behavior or changed in this task.
- Audio-main browser checks passed: accompanying score renders while main audio canvas title remains intact; manual playback advances with paused=false, and pausing retains playback position.
- At a 390px-wide viewport the image and compact audio controls remained visible and usable. Restored the original viewport after the check.
- Browser checks for annotation-table playback continuity, failed audio presentation, manifest replacement and Vue component teardown were not exercised by the loaded examples; those paths were inspected in code and the independent review. Playback/navigation checks above are verified in-browser.

### Final scope adjustments requested by the user

- Removed the example manifests, example README, and example-only Apache CORS configuration, then removed the entire examples directory.
- Reverted the feature documentation added to README.md. The implementation and the design/validation records remain.
- The earlier fixture and README steps describe work performed during development; those artifacts are intentionally absent from the final change.
