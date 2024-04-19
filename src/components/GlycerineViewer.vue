<template>
    <div class="w-full h-full relative overflow-hidden">
        <div class="gv-gallery flex flex-column justify-content-end h-full">
            <div class="gv-gallery-views w-full flex-grow-1" style="min-height:0">
                <template v-for="(canvas, index) in canvases">
                    <div class="h-full" v-show="activeIndex === index">
                        <TableViewer v-if="viewMode === 'table'" :image="canvas.iiifImage"
                                     :annotations="annotations[canvas.id]" :table-columns="tableColumns"></TableViewer>
                        <ImageViewer v-else :image="canvas.iiifImage" :annotations="annotations[canvas.id]"
                                     :light="settings.light"
                                     :default-language="this.settings.filters.language"></ImageViewer>
                    </div>
                </template>
            </div>
            <div class="anno-gallery-nav flex align-items-center justify-content-between w-full bg-black-alpha-90 p-3">
                <div>
                    <Button type="button" severity="secondary" rounded outlined icon="pi pi-arrow-left"
                            @click="activate(activeIndex - 1)" :disabled="activeIndex === 0" />
                </div>
                <div class="flex align-items-center justify-content-center flex-wrap gap-3">
                    <div class="w-7rem" v-for="(canvas, index) in canvases">
                        <div class="thumbnail-container">
                            <a href="#" @click.prevent="activate(index)">
                                <img :src="canvas.thumbnail" :alt="canvas.label" />
                            </a>
                        </div>
                    </div>
                </div>
                <div>
                    <Button type="button" severity="secondary" rounded outlined icon="pi pi-arrow-right"
                            @click="activate(activeIndex + 1)" :disabled="activeIndex === canvases.length - 1" />
                </div>
            </div>
        </div>
        <div class="absolute" style="top:1rem;right:1rem">
            <Button rounded class="mr-2"
                    :icon="viewMode === 'table' ? 'pi pi-image' : 'pi pi-table'"
                    :title="viewMode === 'table' ? 'Image View' : 'Table View'" @click="toggleViewMode" />
            <Button rounded icon="pi pi-cog" title="Settings" @click="showSidebar = true" />
        </div>
        <Transition name="slide">
            <div v-if="showSidebar" class="gv-sidebar">
                <div class="text-right">
                    <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close"
                            @click="showSidebar = false" />
                </div>
                <h4>Settings</h4>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12">
                        <label for="filterSet">Show</label>
                        <Dropdown id="filterSet" v-model="settings.filters.set" :options="filterSetOptions"
                                  option-label="label" option-value="value" />
                    </div>
                    <div class="field col-12">
                        <label for="filterLang">Language</label>
                        <Dropdown id="filterLang" v-model="settings.filters.language" :options="filterLanguageOptions"
                                  option-label="label" option-value="value" />
                    </div>
                    <div class="field col-12">
                        <label for="filterLine">Line Color</label>
                        <Dropdown id="filterLine" v-model="settings.filters.line" :options="filterLineOptions"
                                  option-label="label" option-value="value" />
                    </div>
                    <div v-if="viewMode === 'image'" class="field col-12 flex align-items-center gap-4">
                        <div><i class="pi pi-sun"></i> Light</div>
                        <InputSwitch v-model="settings.light" />
                    </div>
                    <div v-if="viewMode === 'table'" class="field col-12">
                        <div class="mb-2">Table Columns</div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Title" input-id="tcTitle"
                                      :binary="true" />
                            <label for="tcTitle">Title</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Description" input-id="tcDescription"
                                      :binary="true" />
                            <label for="tcDescription">Description</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Links" input-id="tcLinks"
                                      :binary="true" />
                            <label for="tcLinks">Links</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Tags" input-id="tcTags"
                                      :binary="true" />
                            <label for="tcTags">Tags</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Notes" input-id="tcNotes"
                                      :binary="true" />
                            <label for="tcNotes">Notes</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Attribution" input-id="tcAttribution"
                                      :binary="true" />
                            <label for="tcAttribution">Attribution</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Date" input-id="tcDate"
                                      :binary="true" />
                            <label for="tcDate">Date</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns['Line Color']" input-id="tcLineColor"
                                      :binary="true" />
                            <label for="tcLineColor">Line Color</label>
                        </div>
                        <div class="mb-1">
                            <Checkbox class="mr-2" v-model="settings.tableColumns.Comments" input-id="tcComments"
                                      :binary="true" />
                            <label for="tcComments">Comments</label>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>

</template>

<script>
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';

import axios from "axios";
import ManifestParser from "@/libraries/manifest-parser";
import ImageViewer from "@/components/ImageViewer.vue";
import {toRaw} from "vue";
import TableViewer from "@/components/TableViewer.vue";
import Language from "@/libraries/languages";

export default {
    name: "GlycerineViewer",
    components: {TableViewer, ImageViewer, Button, Dropdown, InputSwitch, Checkbox},
    props: {
        // The IIIF manifest. Can be the URL of the manifest or the manifest object.
        manifest: {
            type: [Object, String],
            required: true,
        }
    },
    data() {
        return {
            // The active index of the canvas.
            activeIndex: 0,
            // The manifest data.
            manifestData: null,
            // The view mode. Can be 'image' or 'table'.
            viewMode: 'image',
            // Whether to show the sidebar.
            showSidebar: false,
            // The settings.
            settings: {
                // Filters data.
                filters: {
                    // The annotation set filter.
                    set: 'all',
                    // The language filter.
                    language: 'all',
                    // The line color filter.
                    line: 'all',
                },
                // Whether to turn on the light.
                light: true,
                // The display of table columns.
                tableColumns: {
                    Title: true,
                    Description: true,
                    Links: true,
                    Tags: true,
                    Notes: true,
                    Attribution: false,
                    Date: false,
                    "Line Color": false,
                    Comments: false,
                }
            }
        };
    },
    computed: {
        // The canvases from the manifest.
        canvases() {
            const canvases = [];
            if (this.manifestData && this.manifestParser) {
                this.manifestParser.getCanvases().forEach(canvas => {
                    if (canvas.iiifImage) {
                        canvases.push(canvas);
                    }
                });
            }
            return canvases;
        },
        // The table columns to display.
        tableColumns() {
            // Return the keys in an array where the value is true.
            return Object.keys(this.settings.tableColumns).filter(key => this.settings.tableColumns[key]);
        },
        // The annotations from the manifest. It is an object with canvas ID as key and array of annotations as value.
        annotations() {
            const annotations = {};
            if (this.canvases.length > 0) {
                this.canvases.forEach(canvas => {
                    annotations[canvas.id] = [];
                    if (canvas.annotations && canvas.annotations.length > 0) {
                        // Apply filters.
                        canvas.annotations.forEach(annotation => {
                            if (
                                this.settings.filters.set === 'none' ||
                                (this.settings.filters.set !== 'all' && annotation.group !== this.settings.filters.set)
                            ) {
                                return;
                            }
                            if (this.settings.filters.language !== 'all') {
                                const langCodes = this.getAnnotationLanguageCodes(annotation);
                                if (langCodes.indexOf(this.settings.filters.language) < 0) {
                                    return;
                                }
                            }
                            if (
                                this.settings.filters.line !== 'all' &&
                                annotation.fields['Line Color']?.en?.[0] !== this.settings.filters.line
                            ) {
                                return;
                            }
                            annotations[canvas.id].push(annotation);
                        });
                    }
                });
            }
            return annotations;
        },
        // The annotation set filter options.
        filterSetOptions() {
            const options = [
                { label: 'All annotations', value: 'all' },
            ];
            if (this.manifestData && this.manifestParser) {
                const annoSets = this.manifestParser.getAnnotationSets();
                for (const annoSet of annoSets) {
                    let label = annoSet.label ?? 'Untitled';
                    if (annoSet.creator) {
                        label = annoSet.creator + ' - ' + label;
                    }
                    options.push({ label: label, value: annoSet.id });
                }
            }
            options.push({ label: 'No annotations', value: 'none' });
            return options;
        },
        // The language filter options.
        filterLanguageOptions() {
            const options = [
                { label: 'All languages', value: 'all' },
                { label: 'English', value: 'en' },
            ];
            if (this.canvases.length > 0) {
                const langCodes = [];
                this.canvases.forEach(canvas => {
                    if (canvas.annotations && canvas.annotations.length > 0) {
                        canvas.annotations.forEach(annotation => {
                            const annotationLangCodes = this.getAnnotationLanguageCodes(annotation);
                            annotationLangCodes.forEach(langCode => {
                                if (langCode !== 'en' && langCodes.indexOf(langCode) < 0) {
                                    langCodes.push(langCode);
                                }
                            });
                        });
                    }
                });
                langCodes.forEach(langCode => {
                    const langName = Language.getLanguageName(langCode);
                    if (langName) {
                        options.push({ label: langName, value: langCode });
                    }
                });
            }
            return options;
        },
        // The line color filter options.
        filterLineOptions() {
            const options = [
                { label: 'All line colors', value: 'all' },
            ];
            if (this.canvases.length > 0) {
                const colors = [];
                this.canvases.forEach(canvas => {
                    if (canvas.annotations && canvas.annotations.length > 0) {
                        canvas.annotations.forEach(annotation => {
                            if (annotation.fields) {
                                for (const fieldName in annotation.fields) {
                                    if (fieldName === 'Line Color') {
                                        if (annotation.fields[fieldName].en) {
                                            const color = annotation.fields[fieldName].en[0];
                                            if (colors.indexOf(color) < 0) {
                                                colors.push(color);
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                colors.forEach(color => {
                    options.push({ label: color, value: color });
                });
            }
            return options;
        },
    },
    setup() {
        // Set up the manifest parser property.
        const manifestParser = null;
        return { manifestParser };
    },
    mounted() {
        // Load the manifest data.
        this.loadManifest();
    },
    methods: {
        /**
         * Loads the manifest data.
         *
         * @returns {Promise<void>}
         */
        async loadManifest() {
            if (typeof this.manifest === "string") {
                try {
                    const response = await axios.get(this.manifest, {
                        withCredentials: false,
                        headers: {
                            Accept: "application/json",
                        },
                    });
                    this.manifestData = response.data;
                    this.manifestParser = new ManifestParser(toRaw(this.manifestData));
                } catch (error) {
                    console.error(error);
                }
            } else if (typeof this.manifest === "object") {
                this.manifestData = this.manifest;
                this.manifestParser = new ManifestParser(toRaw(this.manifestData));
            }
        },
        /**
         * Activates the image at the given index.
         *
         * @param {number} index
         *   Index of the image to activate.
         */
        activate(index) {
            this.activeIndex = index;
        },
        /**
         * Toggle the view mode.
         */
        toggleViewMode() {
            this.viewMode = this.viewMode === 'image' ? 'table' : 'image';
        },
        /**
         * Get the language codes of an annotation.
         *
         * @param {Object} annotation
         *   The annotation object.
         * @returns {*[]}
         *   The language codes.
         */
        getAnnotationLanguageCodes(annotation) {
            const langCodes = [];
            if (annotation.fields) {
                for (const fieldName in annotation.fields) {
                    for (const langCode in annotation.fields[fieldName]) {
                        if (langCodes.indexOf(langCode) < 0) {
                            langCodes.push(langCode);
                        }
                    }
                }
            }
            return langCodes;
        }
    }
}
</script>

<style scoped>
.thumbnail-container {
    width: 100%;
    height: 0;
    padding-bottom: 65%;
    position: relative;
    line-height: 0;
    overflow: hidden;
}

.thumbnail-container img {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    object-fit: cover;
}

.thumbnail-container i {
    font-size: 7rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.gv-sidebar {
    height: 100%;
    width: 400px;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 999;
    background-color: #FDFEFF;
    padding: 2rem;
    overflow-y: auto;
    box-shadow: -2px 2px 4px rgba(0,0,0,0.15);
}

.slide-leave-active,
.slide-enter-active {
    transition: 0.5s;
}
.slide-enter-from {
    transform: translate(100%, 0);
}
.slide-leave-to {
    transform: translate(100%, 0);
}
</style>