<template>
    <div ref="container" class="w-full h-full bg-gray-900 anno-viewer-view"></div>
    <AnnotationPopup v-if="selectedAnnotation" :visible="showPopup" :annotation="selectedAnnotation"
                     :defaultLanguage="defaultLanguage" :cutoutImage="cutoutImage" :position="popupPosition"
                     @open="$emit('annotationPopupOpened', selectedAnnotation.id)" @close="onPopupClose" />
</template>

<script>
import { toRaw } from 'vue';
import OpenSeadragon from "openseadragon";
import { createOSDAnnotator, W3CImageFormat } from '@annotorious/openseadragon';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import Helper from "@/libraries/helper";
import AnnotationPopup from "@/components/AnnotationPopup.vue";
import HtmlUtility from "@/libraries/html-utility.js";
import ImageLoader from "@/libraries/image-loader";
import AnnotationCropper from "@/libraries/annotation-cropper";

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
        // The source image width used for cropping annotations.
        srcImageSize: {
            type: Number,
            default: 1024,
        },
        // Whether to show cutout images in annotation popups.
        showCutout: {
            type: Boolean,
            default: false,
        },
        // The annotation fill opacity (0-1).
        annotationFillOpacity: {
            type: Number,
            default: 0,
        },
        // The current play state for annotations ('playing', 'paused', 'stopped').
        playState: {
            type: String,
            default: 'stopped',
        },
        // The play speed (interval) in milliseconds.
        playSpeed: {
            type: Number,
            default: 5000,
        },
        // Whether to show the annotation popup during the play.
        playShowPopup: {
            type: Boolean,
            default: true,
        },
        // The position of the annotation popup.
        popupPosition: {
            type: String,
            default: 'bottomright',
        },
        // Sets OpenSeadragon's crossOriginPolicy. Accepts 'Anonymous',
        // 'use-credentials', or false. Changing at runtime triggers a
        // soft reload of the tile source so already-cached tiles are
        // re-fetched under the new policy.
        crossOriginPolicy: {
            type: [String, Boolean],
            default: false,
            validator(value) {
                return value === false || value === 'Anonymous' || value === 'use-credentials';
            },
        },
    },
    emits: [
        // Event emitted when the OpenSeadragon viewer is initialized.
        'osdInitialized',
        // Event emitted before the OSD viewer is constructed. The
        // payload is a `hooks` object whose `waitFor` array accepts
        // Promises; OSD initialization is awaited until they resolve.
        'beforeCanvasLoad',
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
            showPopup: false,
            selectedAnnotation: null,
            imageLoader: null,
            playConfig: {
                intervalID: null,
                currentIndex: -1,
            },
            currentlyPlayingId: null,
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
        // Images of each annotation which is an object with annotation ID as key and image encoded in Base64 as value.
        annotationImages() {
            const annotationImages = {};
            if (this.imageLoader) {
                this.annotations.forEach((annotation) => {
                    annotationImages[annotation.id] = AnnotationCropper.cropAnnotationImage(annotation, toRaw(this.imageLoader));
                });
            }
            return annotationImages;
        },
        // The cutout image for the selected annotation.
        cutoutImage() {
            if (this.showCutout && this.selectedAnnotation && this.annotationImages[this.selectedAnnotation.id]) {
                return this.annotationImages[this.selectedAnnotation.id];
            }
            return null;
        }
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
            // Stop playing if annotations changed.
            this.playStop();
        },
        // Watch for changes to the light to turn on/off the light.
        light(newValue, oldValue) {
            this.setLightLevel();
        },
        playState(newValue, oldValue) {
            if (newValue === 'playing') {
                this.playStart();
            } else if (newValue === 'paused') {
                this.playPause();
            } else if (newValue === 'stopped') {
                this.playStop();
            }
        },
        // Annotorious v3 only invokes the style function on its own state
        // transitions (hover/select). Re-applying setStyle forces it to
        // redraw when the fill opacity prop changes.
        annotationFillOpacity() {
            this.refreshAnnotationStyle();
        },
        // Same reason: the play-mode outline (yellow stroke) is driven by
        // currentlyPlayingId inside the style closure, so a change here
        // won't repaint unless we re-apply setStyle.
        currentlyPlayingId() {
            this.refreshAnnotationStyle();
        },
        // Same reason: the highlight fill opacity is driven by
        // highlightedAnnotationId inside the style closure.
        highlightedAnnotationId() {
            this.refreshAnnotationStyle();
        },
        // Switching crossOriginPolicy at runtime: OSD reads the policy
        // from the viewer instance when scheduling tile fetches, so we
        // mutate the live property and reload the tile source. Already-
        // cached tiles cannot be "re-tainted" in place, hence the close
        // + open. We preserve the current viewport bounds and re-apply
        // annotations from the live, upstream-filtered list so the user
        // stays exactly where they were with the same filter state.
        crossOriginPolicy(newValue) {
            if (!this.osdViewer) {
                return;
            }
            this.playStop();
            const bounds = this.osdViewer.viewport.getBounds(true);
            this.osdViewer.crossOriginPolicy = newValue;
            const onOpen = () => {
                this.osdViewer.removeHandler('open', onOpen);
                this.osdViewer.viewport.fitBounds(bounds, true);
                if (this.annotorious && this.webAnnotations.length > 0) {
                    this.annotorious.setAnnotations(this.webAnnotations);
                    this.refreshAnnotationStyle();
                }
            };
            this.osdViewer.addHandler('open', onOpen);
            this.osdViewer.close();
            this.osdViewer.open(this.buildTileSources());
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
    created() {
        // Load the image.
        this.loadImage(this.image);
    },
    mounted() {
        this.initViewer();
    },
    unmounted() {
        // Stop playing annotations if playing.
        this.playStop();
    },
    methods: {
        /**
         * Builds the OSD tileSources value from the current image prop.
         * Used by both initViewer() and the crossOriginPolicy watcher.
         *
         * @returns {Object|Array<string>}
         */
        buildTileSources() {
            if (this.plainImage) {
                return {
                    type: 'image',
                    url: this.image,
                    buildPyramid: false,
                };
            }
            return [this.image + '/info.json'];
        },
        /**
         * Initializes the viewer.
         */
        async initViewer() {
            // Give consumers a chance to do async setup before OSD is
            // constructed (e.g., probe Access-Control-Allow-Origin so
            // crossOriginPolicy can be picked correctly per canvas).
            // Consumers push Promises into hooks.waitFor; we await
            // them all, then read the (possibly updated) prop value.
            const hooks = { waitFor: [] };
            this.$emit('beforeCanvasLoad', hooks);
            if (hooks.waitFor.length > 0) {
                try {
                    await Promise.all(hooks.waitFor);
                    await this.$nextTick();
                } catch (err) {
                    console.warn(
                        '[GlycerineViewer] beforeCanvasLoad handler rejected; ' +
                        'proceeding with current crossOriginPolicy',
                        err,
                    );
                }
                // The component may have unmounted while we awaited the
                // consumer's hooks (e.g., the user navigated away mid-probe).
                // Bail out before OSD tries to mount on a torn-down container.
                if (!this.$refs.container) {
                    return;
                }
            }
            // Initialize the OpenSeadragon viewer.
            // Force the canvas drawer: OSD 6's default WebGL drawer competes
            // with Annotorious v3's Pixi renderer for a WebGL context, which
            // breaks annotation re-renders on hover/select on some GPUs.
            const osdConfig = {
                element: this.$refs.container,
                drawer: 'canvas',
                visibilityRatio: 1,
                crossOriginPolicy: this.crossOriginPolicy,
                prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
                showZoomControl: false,
                showHomeControl: false,
                showFullPageControl: false,
            };
            osdConfig.tileSources = this.buildTileSources();
            this.osdViewer = OpenSeadragon(osdConfig);
            // Emit the osdInitialized event.
            this.$emit('osdInitialized', this.osdViewer);
            // Apply the light-level to the OSD image canvas. Annotorious
            // layers are siblings inside .openseadragon-container, so the
            // filter dims the image only and leaves annotations unaffected.
            this.setLightLevel();
            if (this.displayAnnotations) {
                // Initialize Annotorious.
                this.annotorious = createOSDAnnotator(this.osdViewer, {
                    userSelectAction: 'SELECT',
                    adapter: W3CImageFormat(this.image),
                    style: this.buildAnnotationStyle(),
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
                this.annotorious.on('selectionChanged', (annotations) => {
                    const annotation = annotations?.[0];
                    if (!annotation) {
                        this.showPopup = false;
                        return;
                    }
                    const body = annotation.bodies?.[0] ?? annotation.body?.[0];
                    this.selectedAnnotation = body?.value ?? null;
                    this.showPopup = !!this.selectedAnnotation;
                });

                this.annotorious.on('mouseEnterAnnotation', (annotation) => {
                    this.$emit('mouseEnterAnnotation', annotation.id);
                });

                this.annotorious.on('mouseLeaveAnnotation', (annotation) => {
                    this.$emit('mouseLeaveAnnotation', annotation.id);
                });

                // Suppress OSD's click-to-zoom when the click lands on an
                // annotation. v2's SVG overlay absorbed those clicks via
                // pointer-events; v3 renders to a WebGL canvas that listens
                // through OSD's own canvas-press/release, so OSD still raises
                // canvas-click and zooms by 2x unless we opt out.
                this.osdViewer.addHandler('canvas-click', (event) => {
                    if (this.annotorious?.state?.hover?.current) {
                        event.preventDefaultAction = true;
                    }
                });
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
        buildAnnotationStyle() {
            return Helper.annotoriousStyle(() => ({
                highlightedId: this.highlightedAnnotationId,
                playingId: this.currentlyPlayingId,
                fillOpacity: this.annotationFillOpacity,
            }));
        },
        refreshAnnotationStyle() {
            if (this.annotorious) {
                this.annotorious.setStyle(this.buildAnnotationStyle());
            }
        },
        setLightLevel() {
            if (!this.$refs.container) return;
            // Annotorious v3 mounts .a9s-gl-canvas and its SVG layers as
            // siblings of OSD's tile canvas inside .openseadragon-canvas, so
            // target the tile canvas specifically — not its parent.
            const tileCanvases = this.$refs.container.querySelectorAll(
                '.openseadragon-canvas > canvas:not(.a9s-gl-canvas)'
            );
            const filter = `brightness(${this.light / 100})`;
            tileCanvases.forEach(canvas => {
                canvas.style.filter = filter;
            });
        },
        /**
         * Loads the image.
         *
         * This will load the image in the background and prepare the image for cropping.
         *
         * @param {string} image
         *   The image base URL.
         */
        async loadImage(image) {
            this.imageLoader = null;
            let imageLoader;
            if (this.plainImage) {
                imageLoader = new ImageLoader(image, null, false);
            } else {
                imageLoader = new ImageLoader(image, this.srcImageSize);
            }
            await imageLoader.load();
            this.imageLoader = imageLoader;
        },
        /**
         * Automatically plays annotations.
         */
        autoPlayAnnotations() {
            this.showPopup = false;
            this.playConfig.currentIndex = (this.playConfig.currentIndex + 1) % this.annotations.length;
            const annotation = this.annotations[this.playConfig.currentIndex];
            this.currentlyPlayingId = annotation.id;
            this.annotorious.fitBoundsWithConstraints(annotation.id);
            this.selectedAnnotation = annotation;
            if (this.playShowPopup) {
                this.showPopup = true;
            }
        },
        /**
         * Starts playing annotations.
         */
        playStart() {
            if (this.annotations.length > 0) {
                this.autoPlayAnnotations();
                this.intervalID = setInterval(this.autoPlayAnnotations, this.playSpeed);
            }
        },
        /**
         * Stops playing annotations.
         */
        playStop() {
            this.showPopup = false;
            if (this.intervalID) {
                clearInterval(this.intervalID);
            }
            this.currentlyPlayingId = null;
            this.intervalID = null;
            this.playConfig.currentIndex = -1;
        },
        /**
         * Pauses playing annotations.
         */
        playPause() {
            if (this.intervalID) {
                clearInterval(this.intervalID);
            }
            this.intervalID = null;
        },
    }
}

</script>
