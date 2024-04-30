<template>
    <div ref="container" class="w-full h-full bg-gray-900 anno-viewer-view"></div>
    <Dialog v-model:visible="showPopup" @hide="onPopupClose" modal
            :header="popupData.title[popupData.language] ?? 'Annotation'" :style="{ width: '50rem' }"
            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
            :pt="{
                mask: (options) => ({
                    style: {
                        'z-index': 1000
                    }
                }),
            }">
        <template v-if="popupHasData">
            <TabView>
                <TabPanel v-if="popupData.languages.length > 1 || popupData.description[popupData.language] || popupData.links[popupData.language]"
                          header="About">
                    <div v-if="popupData.languages.length > 0" class="p-fluid formgrid grid">
                        <div class="field col-12 flex justify-content-end">
                            <Dropdown id="anoLanguage" class="w-5 lg:w-3" v-model="popupData.language"
                                      :options="popupData.languages" option-label="name" option-value="code" />
                        </div>
                    </div>
                    <p v-if="popupData.description">{{ popupData.description[popupData.language] }}</p>
                    <div v-if="popupData.links[popupData.language] && popupData.links[popupData.language].length > 0">
                        <h5>Links</h5>
                        <ul>
                            <li v-for="link in popupData.links[popupData.language]">
                                <a :href="link.url" target="_blank">{{ link.text ? link.text : link.url }}</a>
                            </li>
                        </ul>
                    </div>
                </TabPanel>
                <TabPanel v-if="popupData.tags.length > 0" header="Tags">
                    <TermTagGroup class="mb-4" :terms="popupData.tags" read-only />
                </TabPanel>
                <TabPanel v-if="popupData.attribution || popupData.date || popupData.notes.length > 0" header="Notes">
                    <div class="mb-4" v-if="popupData.notes.length > 0">
                        <p v-for="note in popupData.notes">{{ note }}</p>
                    </div>
                    <div class="text-sm text-right" v-if="popupData.attribution">{{ popupData.attribution }}</div>
                    <div class="text-sm text-right" v-if="popupData.date">{{ formatDate(popupData.date) }}</div>
                </TabPanel>
                <TabPanel v-if="popupData.comments.length > 0" header="Comments">
                    <div class="mb-4" v-if="popupData.comments.length > 0">
                        <div class="mb-4" v-for="comment in popupData.comments">{{ comment.text }}</div>
                    </div>
                </TabPanel>
            </TabView>
        </template>
        <template #footer>
            <Button label="Close" icon="pi pi-times" @click="showPopup = false" outlined />
        </template>
    </Dialog>
</template>

<script>
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';

import OpenSeadragon from "openseadragon";
import Annotorious from '@recogito/annotorious-openseadragon';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';
import Languages from "@/libraries/languages";
import Helper from "@/libraries/helper";
import TermTagGroup from "@/components/TermTagGroup.vue";

export default {
    name: "ImageViewer",
    components: {TermTagGroup, Dialog, TabView, TabPanel, Dropdown, Button},
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
        // Whether to turn on the light.
        light: {
            type: Boolean,
            default: true,
        }
    },
    data() {
        return {
            // Whether to show the popup.
            showPopup: false,
            // The popup data.
            popupData: {
                // The current language code.
                language: 'en',
                // Available annotation languages.
                languages: [],
                // Annotation titles. Keyed by language code.
                title: {},
                // Annotation descriptions. Keyed by language code.
                description: {},
                // Annotation links. Keyed by language code.
                links: {},
                // Attribution.
                attribution: null,
                // Date.
                date: null,
                // Notes.
                notes: [],
                // Tags.
                tags: [],
                // Comments.
                comments: [],
            }
        }
    },
    computed: {
        // The annotations in web annotation format.
        webAnnotations() {
            if (this.annotations) {
                return this.annotations.map((annotation) => {
                    return {
                        context: 'http://www.w3.org/ns/anno.jsonld',
                        id: annotation.id,
                        type: 'Annotation',
                        body: [{
                            type: 'TextualBody',
                            value: annotation,
                        }],
                        target: annotation.target,
                    };
                });
            }
            return [];
        },
        // Whether the popup has valid data.
        popupHasData() {
            return this.popupData.description[this.popupData.language] || this.popupData.attribution || this.popupData.date ||
                this.popupData.notes.length > 0 || this.popupData.links[this.popupData.language] || this.popupData.languages.length > 1
                || this.popupData.tags.length > 0 || this.popupData.comments.length > 0;
        },
    },
    watch: {
        // Watch for changes to the annotations to re-load annotations into Annotorious.
        annotations(newValue, oldValue) {
            if (this.annotorious) {
                this.annotorious.clearAnnotations();
                if (this.webAnnotations.length > 0) {
                    this.annotorious.setAnnotations(this.webAnnotations);
                }
            }
        },
        // Watch for changes to the light to turn on/off the light.
        light(newValue, oldValue) {
            // Find the `.a9s-annotationlayer` element inside the container.
            const annotationLayer = this.$refs.container.querySelector('.a9s-annotationlayer');
            if (newValue) {
                // Turn on the light. Remove the class `bg-gray-900` from the annotation layer.
                annotationLayer.classList.remove('bg-gray-900');
            } else {
                // Turn off the light. Add the class `bg-gray-900` to the annotation layer.
                annotationLayer.classList.add('bg-gray-900');
            }
        }
    },
    setup() {
        return {
            // The OpenSeadragon viewer.
            osdViewer: null,
            // The Annotorious instance.
            annotorious: null,
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
            // Initialize Annotorious.
            this.annotorious = Annotorious(this.osdViewer, {
                disableEditor: true,
                readOnly: true,
                formatters: Helper.annotoriousFormatter(),
            });
            // Load annotations into Annotorious.
            if (this.webAnnotations.length > 0) {
                this.annotorious.setAnnotations(this.webAnnotations);
            }
            // Listen for annotation selection.
            this.annotorious.on('selectAnnotation', (annotation) => {
                this.openPopup(annotation);
            });
        },
        /**
         * Opens the popup.
         *
         * @param {Object} annotation
         *   The annotation.
         */
        openPopup(annotation) {
            this.loadPopupData(annotation);
            this.showPopup = true;
        },
        /**
         * On popup close.
         */
        onPopupClose() {
            this.annotorious.cancelSelected();
        },
        /**
         * Initializes the popup data.
         */
        initPopupData() {
            this.popupData = {
                language: 'en',
                languages: [],
                title: {},
                description: {},
                links: {},
                attribution: null,
                date: null,
                notes: [],
                tags: [],
                comments: [],
            };
        },
        /**
         * Loads the popup data from an annotation.
         *
         * @param {Object} annotation
         */
        loadPopupData(annotation) {
            this.initPopupData();
            if (typeof annotation.body[0] !== "undefined") {
                const annotationData = annotation.body[0].value;
                if (annotationData.fields) {
                    // Load languages.
                    const langCodes = this.getAnnotationLanguageCodes(annotationData);
                    if (langCodes.indexOf(this.defaultLanguage) > -1) {
                        this.popupData.language = this.defaultLanguage;
                    } else if (langCodes.indexOf('en') === -1) {
                        this.popupData.language = langCodes[0];
                    } else {
                        this.popupData.language = 'en';
                    }
                    for (const code of langCodes) {
                        // Find the item from this.languages that matches the code.
                        const langName = Languages.getLanguageName(code);
                        if (langName) {
                            this.popupData.languages.push({
                                code: code,
                                name: langName,
                            });
                        }
                    }
                    // Load language enabled fields.
                    for (const code of langCodes) {
                        if (typeof annotationData.fields.Title?.[code] !== "undefined") {
                            this.popupData.title[code] = annotationData.fields.Title[code][0];
                        }
                        if (typeof annotationData.fields.Description?.[code] !== "undefined") {
                            this.popupData.description[code] = annotationData.fields.Description[code][0];
                        }
                        if (typeof annotationData.fields.Link?.[code] !== "undefined") {
                            this.popupData.links[code] = annotationData.fields.Link[code];
                        }
                    }
                    // Load other fields.
                    if (typeof annotationData.fields.Attribution?.en !== "undefined") {
                        this.popupData.attribution = annotationData.fields.Attribution.en[0];
                    }
                    if (typeof annotationData.fields.Date?.en !== "undefined") {
                        this.popupData.date = annotationData.fields.Date.en[0];
                    }
                    if (typeof annotationData.fields.Note?.en !== "undefined") {
                        this.popupData.notes = annotationData.fields.Note.en;
                    }
                    // Load tags.
                    if (typeof annotationData.fields.Tag?.en !== "undefined") {
                        annotationData.fields.Tag.en.forEach((termValue) => {
                            const term = Helper.createTermObject(termValue);
                            this.popupData.tags.push(term);
                        });
                    }
                    // Load comments.
                    if (typeof annotationData.fields.Comment !== "undefined") {
                        for (const code in annotationData.fields.Comment) {
                            annotationData.fields.Comment[code].forEach((comment) => {
                                this.popupData.comments.push({
                                    language: code,
                                    text: comment,
                                });
                            });
                        }
                    }
                }
            }
        },
        /**
         * Gets the annotation language codes.
         *
         * @param {Object} annotation
         *   The annotation.
         * @returns {Array}
         *  List of language codes.
         */
        getAnnotationLanguageCodes(annotation) {
            let languageCodes = [];
            const languageEnabledFields = ['Title', 'Description', 'Link'];
            if (annotation.fields) {
                for (const fieldName in annotation.fields) {
                    if (languageEnabledFields.indexOf(fieldName) === -1) {
                        continue;
                    }
                    const field = annotation.fields[fieldName];
                    if (field) {
                        for (const langCode in field) {
                            if (languageCodes.indexOf(langCode) === -1) {
                                languageCodes.push(langCode);
                            }
                        }
                    }
                }
            }
            return languageCodes;
        },
        /**
         * Formats a date.
         *
         * @param {String} date
         *   The date.
         * @returns {String}
         *   The formatted date.
         */
        formatDate(date) {
            return Helper.formatDate(date);
        },
    }
}

</script>
