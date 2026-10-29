# Image and audio accompanying canvases

Date: 2026-10-29  
Status: Approved by the user on 2026-10-29.

## Purpose

Allow someone to listen to a sound track while viewing and interacting with an
image, using the IIIF Presentation 3 `accompanyingCanvas` property. Support both
an image canvas with accompanying audio and an audio canvas with an accompanying
image, including cookbook recipe 0014.

References:

- [IIIF accompanyingCanvas](https://iiif.io/api/presentation/3.0/#accompanyingcanvas)
- [Cookbook recipe 0014](https://iiif.io/api/cookbook/recipe/0014-accompanyingcanvas/)

## Approaches

1. **Recommended: compose the existing image viewer and Video.js audio player.**
   Retain OpenSeadragon image interaction and the existing audio control style.
   Add a compact presentation to AudioViewer so its large audio-only placeholder
   does not consume the image area. This requires fixing the existing VideoPlayer
   cleanup hook, which currently uses Vue 2's `beforeDestroy` in this Vue 3 project.
2. **Alternative: introduce native HTML audio controls for accompanying audio.**
   This needs less player integration but creates a second playback implementation
   and browser-dependent controls beside the existing Video.js audio viewer.

The user approved the recommended approach.

## Supported manifest content

This iteration reads `accompanyingCanvas` directly on a top-level canvas in
`Manifest.items`. The accompanying canvas and its painting annotation pages must
be embedded in the manifest, as in the cookbook example.

| Main canvas content | Accompanying content | Result |
| --- | --- | --- |
| Image, including IIIF images | Sound | Interactive image with audio controls below |
| Sound | Image, including IIIF images | Interactive accompanying image with audio controls below |
| Image or Sound | Missing, invalid, or unsupported content | Existing main canvas presentation |
| Video or another unsupported main type | Any | Existing main canvas presentation |

Support one image and one sound resource per pair, following the existing
single-resource canvas model. No playlists, multiple simultaneous tracks, Choice
selection, mixing, time offsets, or timed synchronization are added. Preserve the
declared audio MIME type: the cookbook uses a Sound resource with `video/mp4`.

Manifest-, Range-, and Collection-level accompanying canvases, external resource
fetching for accompanying canvases, nested accompanying canvases, and other media
pairs are outside this iteration. They are not required for the two requested
canvas arrangements.

## Viewer behavior

- The image occupies the available viewing area. A compact audio control strip
  sits immediately below it, above canvas navigation, without covering the image.
- Reuse Video.js audio-only controls for play/pause, seeking, and volume. Playback
  starts only when the user requests it; it does not autoplay or loop.
- Image zooming, panning, annotations on the main image canvas, and switching
  between image and annotation table views continue to work. Switching those
  views does not restart the audio.
- Audio playback is independent of the existing annotation slideshow controls
  and `autoplay` option, which continue to refer to annotation playback.
- Changing the active canvas, replacing the manifest, or destroying the viewer
  disposes the player and stops the sound. Returning to a canvas starts paused
  at the beginning. Stable canvas keys prevent player reuse across canvases.
- A media playback failure uses the player's existing error presentation. The
  image remains usable. An unsupported companion does not replace the main media.
- For an audio main canvas, the accompanying image is presented as an illustration.
  Importing annotation pages from that accompanying image and displaying temporal
  audio annotations over the image are outside this iteration.

## Canvas identity and integration

The main canvas remains the navigation item: preserve its ID, label, metadata,
ordering, imperative activation behavior, and event identity. An accompanying
canvas does not become an extra navigation entry. Use an explicit main-canvas
thumbnail when present; otherwise an accompanying image can supply the thumbnail
for an audio canvas.

Extend ManifestParser's canvas descriptors with a separate companion descriptor
containing its ID and supported media. Preserve the existing `image`, `audio`,
and `video` fields as main content, so parser consumers can still distinguish
main and accompanying content. Do not mutate the input manifest or recursively
parse companions. Continue importing parser classes through dependency-manager.js.

GlycerineViewer resolves the display image and audio from that pair and composes
the existing components. Annotations belong only to the main image, when present;
audio-main annotations are not passed to its accompanying image.

No new root props, widget options, events, or imperative APIs are necessary.
The feature is driven by manifest content and works through the shared root in
both distributions. Document supported content and limitations in README.md.

## Validation after approval and implementation

Run both `npm run build` and `npm run build-lib`. No unit-test runner or TDD work
is added, following repository instructions.

Prepare example manifests for the cookbook direction and its image-main reverse,
plus an unsupported companion and ordinary image/audio/video regression cases.
Inspect parser results for main identity, companion media, thumbnails, and
unchanged input data.

Browser validation requires the user to start their testing environment and
provide its URL. Check both pair directions, playback controls, image interaction,
table switching, navigation while playing (including identical audio URLs on
different canvases), manifest replacement, viewer destruction, narrow layouts,
and failed audio loading. Build success alone does not establish browser success.

## Approval

The user approved the recommended approach, canvas-level embedded-content scope,
and behavior above with “Looks good”.
