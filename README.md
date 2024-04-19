# Glycerine Viewer

Glycerine Viewer is an [International Image Interoperability Framework](https://iiif.io/) (IIIF) viewer optimised for 
annotations. It is built using [Vue](https://vuejs.org/) 3 and provides the Vue components for visualising IIIF images 
and annotations from IIIF manifests.

The Glycerine Viewer is a component from the [Glycerine](https://glycerine.io/) project, offering a platform for 
annotating and publishing IIIF images.

## Getting Started

### Prerequisites

Glycerine Viewer is a Vue 3 component, so it must be used in a Vue 3 project.

### Installation

To install the Glycerine Viewer, run the following command with `npm`:

```shell
npm install glycerine-viewer
```

## Usage

### Use the Plugin

The easiest way to use Glycerine Viewer is to use the provided plugin. The plugin handles the import of its
dependencies and registers the Glycerine Viewer component globally.

For example, in the `main.js` file of the Vue project:

```javascript
import { createApp } from 'vue'

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
    <GlycerineViewer style="width:800px;height:600px;" manifest="IIIF_MANIFEST"></GlycerineViewer>
</template>
```

### Import Manually

The Glycerine Viewer component can also be imported manually if you prefer to handle the dependencies yourself. The
Glycerine Viewer is built on top of the [PrimeVue](https://primevue.org/) suite. Therefore, these dependencies must be
imported into the project before using the Glycerine Viewer.

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
import 'primevue/resources/themes/aura-light-green/theme.css';

// Import the Glycerine Viewer styles.
import 'glycerine-viewer/style.css';

// Import the Glycerine Viewer component.
import { GlycerineViewer } from 'glycerine-viewer';

import App from './App.vue'

const app = createApp(App);

// Use the PrimeVue library.
app.use(PrimeVue);

// Register the Glycerine Viewer component globally.
app.component('GlycerineViewer', GlycerineViewer);

app.mount('#app');
```

## Components

### Glycerine Viewer

The `GlycerineViewer` component is the main component for visualising IIIF images and annotations from IIIF manifests.
It accepts the following props:

- `manifest`: (Required) The URL of the IIIF manifest or the object of the manifest content.

Example:

```vue
<template>
    <GlycerineViewer style="width:800px;height:600px;" manifest="https://purl.stanford.edu/kd477fk6947/iiif3/manifest"></GlycerineViewer>
</template>
```

## License

Glycerine Viewer is licensed under the [MIT License](LICENSE).

## Contact

Glycerine Viewer is developed and maintained by [Systemik Solutions](https://systemiksolutions.com).
