import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css';
import 'primeicons/primeicons.css';

import PrimeVue from 'primevue/config';

import i18n from "@/i18n/i18n.js";

import GlycerineViewer from "@/components/GlycerineViewer.vue";

export default {
    install(app, options) {
        // Use the PrimeVue.
        app.use(PrimeVue, { ripple: true });
        // Use the i18n.
        app.use(i18n);
        // Set the viewer component.
        app.component('GlycerineViewer', GlycerineViewer);
    }
}
