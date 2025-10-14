<template>
    <div ref="container" class="w-full h-full bg-gray-900 anno-viewer-view"></div>
    <AnnotationPopup v-if="selectedAnnotation" :visible="showPopup" :annotation="selectedAnnotation"
                     :defaultLanguage="defaultLanguage"
                     @open="$emit('annotationPopupOpened', selectedAnnotation.id)" @close="onPopupClose" />
</template>

<script>
import OpenSeadragon from "openseadragon";
import Annotorious from '@recogito/annotorious-openseadragon';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';
import Helper from "@/libraries/helper";
import AnnotationPopup from "@/components/AnnotationPopup.vue";
import HtmlUtility from "@/libraries/html-utility.js";

export default {
    name: "ImageViewer",
    components: {AnnotationPopup},
    props: {
        // The image URL.
        image: {
            type: String,
            required: true,
        },
        // Whether the image is a plain image.
        plainImage: {
            type: Boolean,
            default: false,
        },
        // The annotations.
        annotations: {
            type: Array,
        },
        // The default language code.
        defaultLanguage: {
            type: String,
            default: 'en',
        },
        // Light level (0-100).
        light: {
            type: Number,
            default: 100,
        },
        // Whether to display annotations.
        displayAnnotations: {
            type: Boolean,
            default: true,
        },
        // Highlighted annotation ID.
        highlightedAnnotationId: {
            type: String,
            default: null,
        },
    },
    emits: [
        // Event emitted when the OpenSeadragon viewer is initialized.
        'osdInitialized',
        // Event emitted when the canvas is loaded.
        'canvasLoaded',
        // Event emitted when annotations are loaded. The list of raw annotation data is passed as the first argument.
        'annotationsLoaded',
        // Emitted when mouse has entered an annotation. It passes the annotation id as a parameter.
        'mouseEnterAnnotation',
        // Emitted when mouse has left an annotation. It passes the annotation id as a parameter.
        'mouseLeaveAnnotation',
        // Emitted when an annotation popup is opened. It passes the annotation id as a parameter.
        'annotationPopupOpened',
        // Emitted when an annotation popup is closed. It passes the annotation id as a parameter.
        'annotationPopupClosed',
    ],
    data() {
        return {
            // Whether to show the popup.
            showPopup: false,
            // The selected annotation for the popup.
            selectedAnnotation: null,
        }
    },
    computed: {
        // The annotations in web annotation format.
        webAnnotations() {
            const webAnnotations = [];
            if (this.annotations) {
                for (const annotation of this.annotations) {
                    if (annotation.target?.selector) {
                        webAnnotations.push({
                            '@context': 'http://www.w3.org/ns/anno.jsonld',
                            id: annotation.id,
                            type: 'Annotation',
                            body: [{
                                type: 'TextualBody',
                                value: annotation,
                            }],
                            target: annotation.target,
                        });
                    }
                }
            }
            return webAnnotations;
        },
    },
    watch: {
        // Watch for changes to the annotations to re-load annotations into Annotorious.
        annotations(newValue, oldValue) {
            if (this.annotorious) {
                this.annotorious.clearAnnotations();
                if (this.webAnnotations.length > 0) {
                    this.annotorious.setAnnotations(this.webAnnotations);
                    // Emit the annotationsLoaded event with the raw annotation data.
                    const rawAnnotations = [];
                    if (newValue && Array.isArray(newValue)) {
                        for (const annotation of newValue) {
                            rawAnnotations.push(annotation.data);
                        }
                    }
                    if (rawAnnotations > 0) {
                        this.$emit('annotationsLoaded', rawAnnotations);
                    }
                }
            }
        },
        // Watch for changes to the light to turn on/off the light.
        light(newValue, oldValue) {
            this.setLightLevel();
        },
        // Watch for changes to the highlighted annotation ID.
        highlightedAnnotationId(newValue, oldValue) {
            if (this.annotorious) {
                // Clear all highlights first.
                const highlightedElements = this.$refs.container.querySelectorAll('.highlighted');
                highlightedElements.forEach((el) => el.classList.remove('highlighted'));
                if (newValue) {
                    // Find the element with "data-id" attribute matching the highlighted annotation ID.
                    const highlightedElement = this.$refs.container.querySelector(`[data-id="${newValue}"]`);
                    // Add the "highlighted" class to the element.
                    if (highlightedElement) {
                        highlightedElement.classList.add('highlighted');
                    }
                }
            }
        },
    },
    setup() {
        return {
            // The OpenSeadragon viewer.
            osdViewer: null,
            // The Annotorious instance.
            annotorious: null,
            HtmlUtility,
        };
    },
    mounted() {
        this.initViewer();
    },
    methods: {
        /**
         * Initializes the viewer.
         */
        initViewer() {
            // Initialize the OpenSeadragon viewer.
            const osdConfig = {
                element: this.$refs.container,
                visibilityRatio: 1,
                crossOriginPolicy: false,
                prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
                showZoomControl: false,
                showHomeControl: false,
                showFullPageControl: false,
            };
            if (this.plainImage) {
                osdConfig.tileSources = {
                    type: 'image',
                    url:  this.image,
                    buildPyramid: false,
                };
            } else {
                osdConfig.tileSources = [this.image + '/info.json'];
            }
            this.osdViewer = OpenSeadragon(osdConfig);
            // Emit the osdInitialized event.
            this.$emit('osdInitialized', this.osdViewer);
            if (this.displayAnnotations) {
                // Initialize Annotorious.
                this.annotorious = Annotorious(this.osdViewer, {
                    disableEditor: true,
                    readOnly: true,
                    formatters: Helper.annotoriousFormatter(),
                });
                // Load annotations into Annotorious.
                if (this.webAnnotations.length > 0) {
                    this.annotorious.setAnnotations(this.webAnnotations);
                    // Emit the annotationsLoaded event with the raw annotation data.
                    const rawAnnotations = [];
                    for (const annotation of this.annotations) {
                        rawAnnotations.push(annotation.data);
                    }
                    this.$emit('annotationsLoaded', rawAnnotations);
                }
                // Listen for annotation selection.
                this.annotorious.on('selectAnnotation', (annotation) => {
                    window.parent.postMessage(
                        {
                            event: "Annotation selected",
                            details: annotation['id'],
                        },
                        "*"
                    );
                    this.selectedAnnotation = annotation.body[0].value;
                    this.showPopup = true;
                });

                // Listen for annotation hover on.
                this.annotorious.on('mouseEnterAnnotation', (annotation, element) => {
                    // Emit the mouseEnterAnnotation event with the annotation ID.
                    this.$emit('mouseEnterAnnotation', annotation.id);
                });

                // Listen for annotation hover off.
                this.annotorious.on('mouseLeaveAnnotation', (annotation, element) => {
                    // Emit the mouseLeaveAnnotation event with the annotation ID.
                    this.$emit('mouseLeaveAnnotation', annotation.id);
                });

                // Find the `.a9s-annotationlayer` element inside the container.
                const annotationLayer = this.$refs.container.querySelector('.a9s-annotationlayer');
                // Initialize the light level.
                this.setLightLevel();
            }
            // Emit the canvasLoaded event.
            this.$emit('canvasLoaded');
        },
        /**
         * On popup close.
         */
        onPopupClose() {
            this.annotorious.cancelSelected();
            this.showPopup = false;
            // Emit the annotationPopupClosed event with the current popup data.
            this.$emit('annotationPopupClosed', this.selectedAnnotation.id);
        },
        setLightLevel() {
            // Find the `.a9s-annotationlayer` element inside the container.
            const annotationLayer = this.$refs.container.querySelector('.a9s-annotationlayer');
            // Add the background color.
            annotationLayer.style.backgroundColor = `rgba(33,33,33,${1 - this.light / 100}`;
        }
    }
}

</script>
