import { createApp, reactive } from 'vue'

// Import the PrimeVue base styles.
import 'primevue/resources/primevue.min.css';

// Import the PrimeVue theme. Any PrimeVue compatible theme can be used.
import 'primevue/resources/themes/lara-light-blue/theme.css';

// Import the Style sheets.
import "video.js/dist/video-js.min.css";
import '@/assets/styles.css';

// Import the Glycerine Viewer plugin.
import GlycerineViewerPlugin from '@/plugins/GlycerineViewerPlugin.js'

// Import the Glycerine Viewer component.
import GV from "@/components/GlycerineViewer.vue";

export default class GlycerineViewer {
    /**
     * @constructor
     * @param {HTMLElement} element
     *   The DOM element of the container.
     * @param {Object} options
     *   The options for the viewer.
     */
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        // Extract the props for the root component and make them reactive.
        this.rootProps = reactive(this.#getRootProps());
        this.app = createApp(GV, this.rootProps);
        this.app.use(GlycerineViewerPlugin);
        this.rootComponent = null;
    }

    /**
     * Get the root props for the editor.
     *
     * @returns {Object}
     */
    #getRootProps() {
        return {
            manifest: this.options.manifest,
            defaultInfoPanel: this.options.defaultInfoPanel,
            defaultShowCutout: this.options.defaultShowCutout,
            showFullScreenButton: this.options.showFullScreenButton,
            showIndexButton: this.options.showIndexButton,
            showAnnotationViewButton: this.options.showAnnotationViewButton,
            showAboutPaneButton: this.options.showAboutPaneButton,
            showSettingPaneButton: this.options.showSettingPaneButton,
            showCollectionPaneButton: this.options.showCollectionPaneButton,
            showPlayControls: this.options.showPlayControls,
            showManifestUrl: this.options.showManifestUrl,
            displayAnnotations: this.options.displayAnnotations,
            enableDropManifest: this.options.enableDropManifest,
            toggleIndexPanel: this.options.toggleIndexPanel,
            toggleAboutPanel: this.options.toggleAboutPanel,
            defaultAnnotationCollection: this.options.defaultAnnotationCollection,
            defaultAnnotationLanguage: this.options.defaultAnnotationLanguage,
            defaultLineColor: this.options.defaultLineColor,
            defaultLineWeight: this.options.defaultLineWeight,
            annotationFillOpacity: this.options.annotationFillOpacity,
            annotationPopupPosition: this.options.annotationPopupPosition,
            playSpeed: this.options.playSpeed,
            playShowPopup: this.options.playShowPopup,
            lightLevel: this.options.lightLevel,
            autoplay: this.options.autoplay,
            onOsdInitialized: this.options.onOsdInitialized,
            onManifestLoaded: this.options.onManifestLoaded,
            onCanvasLoaded: this.options.onCanvasLoaded,
            onCanvasAnnotationsLoaded: this.options.onCanvasAnnotationsLoaded,
            onMouseEnterAnnotation: this.options.onMouseEnterAnnotation,
            onMouseLeaveAnnotation: this.options.onMouseLeaveAnnotation,
            onAnnotationPopupOpened: this.options.onAnnotationPopupOpened,
            onAnnotationPopupClosed: this.options.onAnnotationPopupClosed,
            onViewModeChanged: this.options.onViewModeChanged,
            onIndexPanelClosed: this.options.onIndexPanelClosed,
            onAboutPanelClosed: this.options.onAboutPanelClosed,
        }
    }

    /**
     * Initialize the editor.
     */
    init() {
        // Set the width of the container;
        if (this.options.width) {
            this.element.style.width = this.options.width;
        } else {
            this.element.style.width = "100%";
        }
        // Set the height of the container;
        if (this.options.height) {
            this.element.style.height = this.options.height;
        } else {
            // Set default to 600px.
            this.element.style.height = "600px";
        }
        // Mount the app.
        this.rootComponent = this.app.mount(this.element);
    }

    /**
     * Open a manifest in the viewer.
     *
     * @param {string} url
     *   The URL of the IIIF manifest to open.
     * @returns {Promise<void>}
     */
    async openManifest(url) {
        await this.rootComponent.openManifest(url);
    }

    /**
     * Activate a canvas by its ID.
     *
     * @param {string} id
     */
    activateCanvas(id) {
        this.rootComponent.activateCanvas(id);
    }

    /**
     * Highlight an annotation by its ID.
     *
     * @param {string} id
     */
    highlightAnnotation(id) {
        this.rootComponent.highlightAnnotation(id);
    }

    /**
     * Clear the highlighted annotation.
     */
    clearHighlight() {
        this.rootComponent.clearHighlight();
    }

    /**
     * Set the annotation filter by IDs.
     *
     * @param {array|null} ids
     *   The array of annotation IDs to filter. If set to null, no filter is applied.
     */
    setAnnotationIdFilter(ids = null) {
        this.rootComponent.setUserAnnotationFilter(ids);
    }

    /**
     * Destroy the editor instance.
     */
    destroy() {
        if (this.app) {
            this.app.unmount();
            this.app = null;
        }
    }
}
