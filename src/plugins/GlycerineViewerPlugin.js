import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css';
import 'primeicons/primeicons.css'

import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/aura-light-green/theme.css'

import GlycerineViewer from "@/components/GlycerineViewer.vue";

export default {
    install(app, options) {
        // Use the PrimeVue.
        app.use(PrimeVue, { ripple: true });
        // Set the viewer component.
        app.component('GlycerineViewer', GlycerineViewer);
    }
}
