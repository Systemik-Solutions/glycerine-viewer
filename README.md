# Glycerine Viewer

Glycerine Viewer is an [International Image Interoperability Framework](https://iiif.io/) (IIIF) viewer optimised for 
annotations. It is built using [Vue](https://vuejs.org/) 3 and provides the Vue components and Javascript widget for 
visualising IIIF images and annotations from IIIF manifests.

The Glycerine Viewer is a component from the [Glycerine](https://glycerine.io/) project, offering a platform for 
annotating and publishing IIIF images.

- [Website](https://glycerine.io/)
- [Live Demo](https://demo.viewer.glycerine.io/)
- [Demo Source Code](https://github.com/Systemik-Solutions/glycerine-demo)

## Getting Started

### JS Widget

Glycerine Viewer provides a JavaScript widget which is packed with all required dependencies such as 
[Vue](https://vuejs.org/) and [PrimeVue](https://primevue.org/).

#### Using CDN

Include the styles and scripts via CDN in your project:

```html
<link rel="stylesheet" href="https://unpkg.com/glycerine-viewer@latest/jslib/style.css">
```

```html
<script src="https://unpkg.com/glycerine-viewer@latest/jslib/glycerine-viewer.umd.cjs"></script>
```

#### Using NPM

If your project uses a package manager like `npm`, you can install Glycerine Viewer as a dependency:

```shell
npm install glycerine-viewer
```

Then include the styles and scripts in your project:

```html
<link rel="stylesheet" href="node_modules/glycerine-viewer/jslib/style.css">
```

```html
<script src="node_modules/glycerine-viewer/jslib/glycerine-viewer.umd.cjs"></script>
```

#### Usage

The following is a simple example of using Glycerine Viewer in a web page. It creates an instance of the 
`GlycerineViewer` class and called the `init` method to mount to the container element. For more information about the
configurations and methods, refer to the [JS Widget API](#js-widget-api) section.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Glycerine Viewer</title>
  
    <!-- Include the Glycerine Viewer styles -->
    <link rel="stylesheet" href="https://unpkg.com/glycerine-viewer@latest/jslib/style.css">
</head>
<body>
<!-- Create a container for the Glycerine Viewer -->
<div id="viewer"></div>

<!-- Include the Glycerine Viewer script -->
<script src="https://unpkg.com/glycerine-viewer@latest/jslib/glycerine-viewer.umd.cjs"></script>

<script>
    // Get the container element for the viewer.
    const ele = document.getElementById('viewer')

    // Create a new GlycerineViewer instance.
    const viewer = new GlycerineViewer(ele, {
        width: '1000px',
        height: '700px',
        manifest: 'https://w3id.org/iaw/data/publications/image-sets/01hm598yb6hc3s7btmqth813mg/manifest',
    });
    
    // Initialize the viewer.
    viewer.init();
</script>
</body>
</html>
```

### Vue Component

To use Glycerine Viewer in a Vue project, run the following command with `npm` to install the Glycerine Viewer:

```shell
npm install glycerine-viewer
```

#### Use the Plugin

The easiest way to use Glycerine Viewer is to use the provided plugin. The plugin handles the import of its
dependencies and registers the Glycerine Viewer component globally.

For example, in the `main.js` file of the Vue project:

```javascript
import { createApp } from 'vue'

// Import the PrimeVue base styles.
import 'primevue/resources/primevue.min.css';

// Import the PrimeVue theme. Any PrimeVue compatible theme can be used.
import 'primevue/resources/themes/lara-light-teal/theme.css';

// Import the Glycerine Viewer styles.
import 'glycerine-viewer/style.css';

// Import the Glycerine Viewer plugin.
import { GlycerineViewerPlugin } from 'glycerine-viewer';

import App from './App.vue'

const app = createApp(App);

// Use the Glycerine Viewer plugin.
app.use(GlycerineViewerPlugin);

app.mount('#app');
```

To use the component:

```vue
<template>
    <div style="width:100%;height:600px">
        <GlycerineViewer manifest="IIIF_MANIFEST"></GlycerineViewer>
    </div>
</template>
```
> [!NOTE]
> The container `div` of the `GlycerineViewer` component is required and should have a defined width and height.

For more information about the props and events of the `GlycerineViewer` component, refer to the 
[Components](#components) section.

#### Import Manually

The Glycerine Viewer component can also be imported manually if you prefer to handle the dependencies yourself. The
Glycerine Viewer is built on top of the [PrimeVue](https://primevue.org/) suite and some other Vue libraries. Therefore, these 
dependencies must be imported into the project before using the Glycerine Viewer.

For example, in the `main.js` file of the Vue project:

```javascript
import { createApp } from 'vue'

// Import the PrimeFlex CSS.
import 'primeflex/primeflex.css';

// Import the PrimeFlex theme. Any PrimeFlex compatible theme can be used.
import 'primeflex/themes/primeone-light.css';

// Import the PrimeIcons.
import 'primeicons/primeicons.css';

// Import the PrimeVue library.
import PrimeVue from 'primevue/config';

// Import the PrimeVue theme. Any PrimeVue compatible theme can be used.
import 'primevue/resources/themes/lara-light-teal/theme.css';

// Import the Glycerine Viewer styles.
import 'glycerine-viewer/style.css';

// Import the Glycerine Viewer component.
import { GlycerineViewer, i18n } from 'glycerine-viewer';

import App from './App.vue'

const app = createApp(App);

// Use the PrimeVue library.
app.use(PrimeVue);

// Use the i18n plugin.
app.use(i18n);

// Register the Glycerine Viewer component globally.
app.component('GlycerineViewer', GlycerineViewer);

app.mount('#app');
```

## Components

### Glycerine Viewer

The `GlycerineViewer` component is the main component for visualising IIIF images and annotations from IIIF manifests.

#### Props

- `manifest`: (Required) The URL of the IIIF manifest or the object of the manifest content.
- `default-info-panel` (Boolean): The initial visibility of the info panel. Default is `true`.
- `default-show-cutout` (Boolean): Whether to display the annotation cutout by default. Default is `false`.
- `show-full-screen-button` (Boolean): The visibility of the full-screen button. Default is `true`.
- `show-index-button` (Boolean): The visibility of the index button. Default is `true`.
- `show-annotation-view-button` (Boolean): The visibility of the annotation view button. Default is `true`.
- `show-about-pane-button` (Boolean): The visibility of the About button. Default is `true`.
- `show-setting-pane-button` (Boolean): The visibility of the settings pane button. Default is `true`.
- `show-collection-pane-button` (Boolean): The visibility of the collection pane button. Default is `true`.
- `show-manifest-url` (Boolean): The visibility of the manifest URL inside the "About" panel. Default is `true`.
- `display-annotations` (Boolean): Whether to enable the annotation display and related features. Default is `true`.
- `enable-drop-manifest` (Boolean): Whether to enable the drag-and-drop feature for IIIF manifests. Default is `true`.
- `toggle-index-panel` (Boolean): This prop is used to toggle the index panel visibility. Default is `false`.
- `toggle-about-panel` (Boolean): This prop is used to toggle the about panel visibility. Default is `false`.
- `default-annotation-collection` (String): The default annotation collection `id` to be displayed. Default is `null`.
- `annotation-fill-opacity` (Number): The fill opacity of the annotations. The value should be between `0` and `1` with
one decimal place (e.g., `0`, `0.1`, `0.2`, ..., `1`). Default is `0`.

#### Emits

- `osd-initialized`: Emitted when the OpenSeadragon viewer is initialized. It passes the OpenSeadragon viewer instance
and the canvas data as parameters.
- `manifest-loaded`: Emitted when the manifest is loaded successfully. It passes the manifest data as a parameter.
- `canvas-loaded`: Emitted when a canvas is loaded. It passes the canvas id as a parameter.
- `canvas-annotations-loaded`: Emitted when the annotations of a canvas are loaded. It passes the list of annotations 
and the canvas id as parameters.
- `mouse-enter-annotation`: Emitted when mouse has entered an annotation. It passes the annotation id as a parameter.
- `mouse-leave-annotation`: Emitted when mouse has left an annotation. It passes the annotation id as a parameter.
- `annotation-popup-opened`: Emitted when an annotation popup is opened. It passes the annotation id as a parameter.
- `annotation-popup-closed`: Emitted when an annotation popup is closed. It passes the annotation id as a parameter.
- `view-mode-changed`: Emitted when the view mode is changed. It passes the new view mode as a parameter.
- `index-panel-closed`: Emitted when the index panel is closed.
- `about-panel-closed`: Emitted when the about panel is closed.

Example:

```vue
<template>
    <div style="width:100%;height:600px">
        <GlycerineViewer manifest="https://w3id.org/iaw/data/publications/image-sets/01hm598yb6hc3s7btmqth813mg/manifest"></GlycerineViewer>
    </div>
</template>
```

## JS Widget API

### Constructor

The `GlycerineViewer` constructor takes two parameters:

- `container`: The HTML element which serves as the container for the viewer.
- `config`: The configurations for the viewer which includes the options and event handlers.

```javascript
const ele = document.getElementById('viewer')
const viewer = new GlycerineViewer(ele, {
    manifest: 'https://w3id.org/iaw/data/publications/image-sets/01hm598yb6hc3s7btmqth813mg/manifest'
})
```

### Configurations

All [props](#props) from the `GlycerineViewer` component can be passed as options in the `config` object. The option
name should be the prop name in `camelCase`. For example, use the option name `defaultInfoPanel` for prop name 
`default-info-panel`. Note that the `manifest` option is required. For more information about the options, refer to the 
[Props](#props) section.

```javascript
const viewer = new GlycerineViewer(ele, {
    manifest: 'https://w3id.org/iaw/data/publications/image-sets/01hm598yb6hc3s7btmqth813mg/manifest',
    defaultInfoPanel: false,
    enableDropManifest: false,
})
```

All [events](#emits) from the `GlycerineViewer` component can be passed as event handlers in the `config` object. 
The handler name should be the event name in the format of `on<EventName>`. For example, use the handler name 
`onManifestLoaded` for the event `manifest-loaded`. For more information about the events, refer to the
[Emits](#emits) section.

```javascript
const viewer = new GlycerineViewer(ele, {
    manifest: 'https://w3id.org/iaw/data/publications/image-sets/01hm598yb6hc3s7btmqth813mg/manifest',
    defaultInfoPanel: false,
    enableDropManifest: false,
    onManifestLoaded: (data) => {
        console.log('Manifest loaded:', data);
    }
})
```

There are also some additional options that can be passed in the `config` object:

- `width`: The width of the viewer container. The value can be a string with CSS units (e.g., `1000px`, `100%`, etc.). 
Default is `100%`.
- `height`: The height of the viewer container. The value can be a string with CSS units (e.g., `700px`, `100%`, etc.).
Default is `600px`.

### Methods

There are several methods available in the `GlycerineViewer` instance to interact with the viewer.

#### init

The `init` method is used to initialize the viewer. It will mount the viewer to the container element.

#### destroy

Destroy the viewer instance and clean up the resources.

#### openManifest

Open a manifest by URL in the viewer.

Parameters:

- `url`: The URL of the IIIF manifest.

#### activateCanvas

Activate a specific canvas in the viewer.

Parameters:

- `id`: The ID of the canvas to activate.

#### highlightAnnotation

Highlight a specific annotation in the viewer.

Parameters:

- `id`: The ID of the annotation to highlight.

#### clearHighlight

Clear the highlight of all annotations in the viewer.

#### setAnnotationIdFilter

Set the ID filter for annotations in the viewer. This will filter out annotations which are not included in the provided
ID list from display.

Parameters:

- `ids`: An array of annotation IDs to filter. If set to `null`, the filter will be removed and all annotations will
be displayed. Default is `null`.

```javascript
// Set the filter.
viewer.setAnnotationIdFilter([
    'https://example.com/annotation/1',
    'https://example.com/annotation/2',
    'https://example.com/annotation/5',
]);

// Remove the filter.
viewer.setAnnotationIdFilter();
```

## IIIF Manifest

Glycerine Viewer currently supports IIIF Presentation API [2.0](https://iiif.io/api/presentation/2.0/) and 
[3.0](https://iiif.io/api/presentation/3.0/) manifests.

> [!WARNING]
> While Glycerine Viewer supports IIIF Presentation API 3.0 natively, it uses 
> [iiif/parser](https://github.com/IIIF-Commons/parser) to convert IIIF Presentation API 2.0 manifests to IIIF
> Presentation API 3.0 manifests before rendering. Some components from older versions of the IIIF Presentation API
> may not be fully supported. If you are the owner of the IIIF manifest, it is recommended to update the manifest
> to 3.0 before using it in Glycerine Viewer.

> [!TIP]
> [Glycerine](https://glycerine.io/) provides a suite of annotation tools and end-to-end workflows for researchers, 
> curators and students to collaborate on projects across repositories. It is recommended to use  
> [Glycerine Workbench](https://glycerine.io/) to create well formatted annotations and apply semantic tags from 
> domain-specific vocabularies to annotations. 

### Annotation Collection

Annotation pages can be grouped by [Annotation Collection](https://iiif.io/api/presentation/3.0/#58-annotation-collection) 
in the IIIF manifest. Then annotations can be filtered by annotation collection in the Glycerine Viewer. The
`AnnotationPage` can use the `partOf` property to specify the collection it belongs to. The `AnnotationCollection`
should have the `label` in order to provide user-friendly name for the filter options.

For example:

```json
{
    "annotations": [
        {
            "id": "https://example.com/annotationpage/1",
            "type": "AnnotationPage",
            "partOf": {
                "id": "https://example.com/annotationcollection/1",
                "type": "AnnotationCollection",
                "label": {
                    "none": [
                        "Core Annotations"
                    ]
                }
            },
            "items": ["..."]
        },
        {
            "id": "https://example.com/annotationpage/2",
            "type": "AnnotationPage",
            "partOf": {
                "id": "https://example.com/annotationcollection/2",
                "type": "AnnotationCollection",
                "label": {
                    "none": [
                        "Other Annotations"
                    ]
                }
            },
            "items": ["..."]
        }
    ]
}
```

### Selector

Glycerine Viewer supports [Fragment Selector](https://www.w3.org/TR/media-frags/) for rectangles and
[SVG selectors](https://www.w3.org/TR/SVG11/) for other shapes to specify the annotation target. The following shapes 
are supported:

- Polygon
- Rectangle
- Circle
- Ellipse

Rectangle target example:

```json
{
    "source": "https://w3id.org/iaw/data/publications/image-sets/01hgwckv6tybx0wczw981yyz9e/manifest/canvases/1",
    "selector": {
        "type": "FragmentSelector",
        "conformsTo": "http://www.w3.org/TR/media-frags/",
        "value": "xywh=415.2714538574219,412.3292541503906,525.8143615722656,497.4430847167969"
    }
}
```

Polygon target example:

```json
{
    "source": "https://w3id.org/iaw/data/publications/image-sets/01hgwckv6tybx0wczw981yyz9e/manifest/canvases/1",
    "selector": {
        "type": "SvgSelector",
        "value": "<svg><polygon points=\"137.23291015625,433.1348571777344 396.35723876953125,431.2434387207031 413.3800354003906,461.5061340332031 403.92291259765625,480.4203186035156 390.6829833984375,478.5289001464844 366.09454345703125,701.71630859375 373.66021728515625,703.6077270507812 377.44305419921875,714.9562377929688 347.18035888671875,722.5219116210938 394.4658203125,913.55517578125 313.13482666015625,974.08056640625 52.11906433105469,985.4290771484375 97.51311492919922,741.4360961914062 61.57615661621094,739.544677734375 57.79331970214844,722.5219116210938 106.97020721435547,722.5219116210938 141.0157470703125,669.5621948242188 141.0157470703125,559.8599243164062 156.1470947265625,542.837158203125 158.03851318359375,476.6374816894531 135.34149169921875,478.5289001464844 131.5586395263672,459.6147155761719 129.9687042236328,459.6147155761719\"></polygon></svg>"
    }
}
```

### Manifest Examples

The following is a list of example IIIF manifests from the [Glycerine](https://glycerine.io/) platform:

- [Gilded Bronze Reliquary Casket](https://w3id.org/iaw/data/publications/image-sets/01hr17rq63z5ycyp6dycf4w312/manifest)
- [Schist Bodhisattva Head](https://w3id.org/iaw/data/publications/image-sets/01hpwvd3qr8hkj54yqn38s0v1d/manifest)
- [Schist Lintel, Buddha and Attendants](https://w3id.org/iaw/data/publications/image-sets/01hpwv4fnt3a3d5j439jhffb1k/manifest)
- [Schist Buddha Triad (year 5)](https://w3id.org/iaw/data/publications/image-sets/01hm598yb6hc3s7btmqth813mg/manifest)

## License

Glycerine Viewer is licensed under the [MIT License](LICENSE).

## Contact

Glycerine Viewer is developed and maintained by [Systemik Solutions](https://systemiksolutions.com).
