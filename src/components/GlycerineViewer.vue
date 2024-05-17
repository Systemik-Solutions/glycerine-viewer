<template>
    <div v-if="manifestHasLoaded" v-bind="$attrs" class="w-full h-full relative overflow-hidden">
        <div class="gv-gallery flex flex-column justify-content-end h-full">
            <div class="gv-gallery-views w-full flex-grow-1" style="min-height:0">
                <template v-for="(canvas, index) in canvases">
                    <div class="h-full" v-show="activeIndex === index">
                        <template v-if="canvas.image">
                            <TableViewer v-if="viewMode === 'table'" :image="canvas.image.url"
                                         :plain-image="canvas.image.type === 'image'"
                                         :annotations="annotations[canvas.id]" :table-columns="tableColumns"></TableViewer>
                            <ImageViewer v-else :image="canvas.image.url"
                                         :plain-image="canvas.image.type === 'image'"
                                         :annotations="annotations[canvas.id]"
                                         :light="settings.light"
                                         :default-language="this.settings.filters.language"></ImageViewer>
                        </template>
                        <div v-else class="flex flex-column align-items-center justify-content-center w-full h-full bg-gray-900 text-color-secondary">
                            <div><i class="pi pi-image" style="font-size: 7rem"></i></div>
                            <div>Missing/Unsupported Image</div>
                        </div>
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
                        <div class="thumbnail-container bg-gray-900">
                            <a href="#" @click.prevent="activate(index)">
                                <img v-if="canvas.thumbnail" :src="canvas.thumbnail" :alt="canvas.label" />
                                <i v-else class="pi pi-image text-color-secondary" style="font-size: 3rem"></i>
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
        <div v-if="infoPanelVisibility" class="gv-info-pane">
            <div class="gv-info-header">
                <div class="gv-info-tools">
                    <span @click="this.settings.showInfoPanel = false"><i class="pi pi-times-circle"></i></span>
                </div>
                <div class="flex justify-content-between align-items-center w-full gap-2">
                    <div v-if="manifestInfo.thumbnail" class="gv-info-thumbnail flex-shrink-0">
                        <img :src="manifestInfo.thumbnail" :alt="manifestInfo.label" />
                    </div>
                    <div class="gv-info-title">{{ manifestInfo.label }}</div>
                </div>
            </div>
            <div class="gv-info-body">
                <div v-if="currentCanvasInfo?.label" class="gv-field">
                    <div class="gv-field-label">Currently Viewing</div>
                    <div class="gv-field-value">{{ currentCanvasInfo.label }}</div>
                </div>
                <div v-if="manifestInfo.requiredStatement" class="gv-field">
                    <div class="gv-field-label">{{ manifestInfo.requiredStatement.label }}</div>
                    <div class="gv-field-value">
                        <div v-if="HtmlUtility.detectHtml(manifestInfo.requiredStatement.value)"
                                  v-html="HtmlUtility.sanitizeHtml(manifestInfo.requiredStatement.value)">
                        </div>
                        <template v-else>
                            {{ manifestInfo.requiredStatement.value }}
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <div class="absolute" style="top:1rem;right:1rem">
            <Button rounded class="mr-2"
                    :icon="viewMode === 'table' ? 'pi pi-image' : 'pi pi-comment'"
                    :title="viewMode === 'table' ? 'Images' : 'Annotations'" @click="toggleViewMode" />
            <Button rounded icon="pi pi-info-circle" class="mr-2" title="About" @click="showAboutPanel = true" />
            <Button rounded icon="pi pi-cog" title="Settings" @click="showSettingsPanel = true" />
        </div>
        <Transition name="slide">
            <div v-if="showSettingsPanel" class="gv-sidebar">
                <div class="text-right">
                    <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close"
                            @click="showSettingsPanel = false" />
                </div>
                <h3><i class="pi pi-cog"></i> Settings</h3>
                <div class="p-fluid formgrid grid">
                    <div class="w-full">
                        <h4 class="pl-2">Annotation Filters</h4>
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
                    </div>
                    <div class="w-full">
                        <h4 class="pl-2">Display</h4>
                        <div v-if="viewMode === 'image'"  class="field col-12 flex align-items-center gap-4">
                            <div><i class="pi pi-sun"></i> Light</div>
                            <InputSwitch v-model="settings.light" />
                        </div>
                        <div v-if="viewMode === 'image'" class="field col-12 flex align-items-center gap-4">
                            <div><i class="pi pi-info-circle"></i> Information Panel</div>
                            <InputSwitch v-model="settings.showInfoPanel" />
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
            </div>
        </Transition>
        <Transition name="slide">
            <div v-if="showAboutPanel" class="gv-sidebar">
                <div class="text-right">
                    <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close"
                            @click="showAboutPanel = false" />
                </div>
                <ResourceInfoCard :resource-info="manifestInfo" card-title="About" />
                <ResourceInfoCard v-if="currentCanvasInfo" :resource-info="currentCanvasInfo"
                                  card-title="Canvas Information" />
                <div class="text-center mt-8 gv-powered-by">
                    <span class="mr-2">Powered by Glycerine</span>
                    <a target="_blank" class="mr-2" title="Website" href="https://glycerine.io">
                        <i class="pi pi-globe"></i>
                    </a>
                    <a target="_blank" title="GitHub" href="https://github.com/Systemik-Solutions/glycerine-viewer">
                        <i class="pi pi-github"></i>
                    </a>
                </div>
            </div>
        </Transition>
    </div>
    <div v-else class="w-full h-full bg-gray-900 overflow-hidden flex flex-column align-items-center justify-content-center gap-4">
        <img :class="{ 'gv-start-logo': true, animation: manifestIsLoading }" :src="logoPath" alt="Glycerine" />
        <div v-if="manifestHadErrors">
            <Message v-for="error in manifestErrors" style="max-width: 400px" severity="error" :closable="false">
                {{ error }}
            </Message>
        </div>
    </div>

</template>

<script>
import logoPath from '@/assets/logo.png';

import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import Message from 'primevue/message';

import ImageViewer from "@/components/ImageViewer.vue";
import {toRaw} from "vue";
import TableViewer from "@/components/TableViewer.vue";
import ResourceInfoCard from "@/components/ResourceInfoCard.vue";
import Language from "@/libraries/languages";
import HtmlUtility from "@/libraries/html-utility.js";
import Helper from "@/libraries/helper.js";
import { ManifestLoader } from "@/libraries/iiif/dependency-manager.js";

export default {
    name: "GlycerineViewer",
    components: {TableViewer, ImageViewer, ResourceInfoCard, Button, Dropdown, InputSwitch, Checkbox, Message},
    props: {
        // The IIIF manifest. Can be the URL of the manifest or the manifest object.
        manifest: {
            type: [Object, String],
            required: true,
        }
    },
    data() {
        return {
            // The status of the manifest. Can be 'initial', 'loading', 'loaded', or 'error'.
            manifestStatus: 'initial',
            // The manifest error messages.
            manifestErrors: [],
            // The active index of the canvas.
            activeIndex: 0,
            // The view mode. Can be 'image' or 'table'.
            viewMode: 'image',
            // Whether to show the "About" panel.
            showAboutPanel: false,
            // Whether to show the "Settings" panel.
            showSettingsPanel: false,
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
                // Whether to show the info panel.
                showInfoPanel: true,
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
            },
            // Manifest information.
            manifestInfo: {
                link: null,
                label: null,
                summary: null,
                requiredStatement: null,
                rights: null,
                metadata: null,
                rendering: null,
                homepage: null,
                seeAlso: null,
                thumbnail: null,
            },
        };
    },
    computed: {
        // Status: whether the manifest is loading.
        manifestIsLoading() {
            return this.manifestStatus === 'loading';
        },
        // Status: whether the manifest has loaded.
        manifestHasLoaded() {
            return this.manifestStatus === 'loaded';
        },
        // Status: whether the manifest had errors.
        manifestHadErrors() {
            return this.manifestStatus === 'error';
        },
        // The canvases from the manifest.
        canvases() {
            let canvases = [];
            if (this.manifestHasLoaded) {
                canvases = this.manifestLoader.getParser().getCanvases();
            }
            return canvases;
        },
        // The information of the current canvas.
        currentCanvasInfo() {
            if (this.manifestHasLoaded) {
                const parser = toRaw(this.canvases[this.activeIndex].parser);
                const canvasInfo = {
                    label: parser.getPrefLabel(),
                    summary: parser.getSummary(),
                    requiredStatement: parser.getRequiredStatement(),
                    rights: parser.getRights(),
                    metadata: parser.getMetadata(),
                    rendering: parser.getRendering(),
                    homepage: parser.getHomePage(),
                    seeAlso: parser.getSeeAlsoLinks(),
                };
                // Check whether canvasInfo has valid data.
                let hasData = false;
                for (const key in canvasInfo) {
                    if (canvasInfo[key]) {
                        hasData = true;
                        break;
                    }
                }
                if (hasData) {
                    return canvasInfo;
                }
            }
            return null;
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
            if (this.manifestHasLoaded) {
                const annoSets = this.manifestLoader.getParser().getAnnotationSets();
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
        // Whether to show the info panel.
        infoPanelVisibility() {
            return this.manifestHasLoaded && this.settings.showInfoPanel && this.viewMode === 'image';
        },
    },
    setup() {
        return {
            logoPath,
            HtmlUtility,
            Helper,
            manifestLoader: null
        };
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
            this.manifestLoader = new ManifestLoader(this.manifest);
            this.manifestStatus = 'loading';
            await this.manifestLoader.load();
            if (this.manifestLoader.hasErrors()) {
                this.manifestStatus = 'error';
                this.manifestErrors = this.manifestLoader.getErrors();
            } else if (this.manifestLoader.hasLoaded()) {
                this.manifestStatus = 'loaded';
                // Load Info Panel.
                this.loadManifestInfo();
                // Load column visibility.
                this.loadTableColumnVisibility();
            }
        },
        /**
         * Load data to the information panel.
         */
        loadManifestInfo() {
            if (this.manifestHasLoaded) {
                // Get the manifest link.
                let linkURL = null;
                if (typeof this.manifest === 'string') {
                    linkURL = this.manifest;
                }
                if (typeof this.manifest === 'object' && this.manifest.id) {
                    linkURL = this.manifest.id;
                }
                if (linkURL) {
                    this.manifestInfo.link = {
                        text: 'IIIF Manifest',
                        url: linkURL,
                    };
                }
                const parser = this.manifestLoader.getParser();
                this.manifestInfo.label = parser.getPrefLabel();
                this.manifestInfo.summary = parser.getSummary();
                this.manifestInfo.requiredStatement = parser.getRequiredStatement();
                this.manifestInfo.rights = parser.getRights();
                this.manifestInfo.metadata = parser.getMetadata();
                this.manifestInfo.rendering = parser.getRendering();
                this.manifestInfo.homepage = parser.getHomePage();
                this.manifestInfo.seeAlso = parser.getSeeAlsoLinks();
                this.manifestInfo.thumbnail = parser.getThumbnail();
            }
        },
        /**
         * Load the table column visibility based on the annotation content.
         */
        loadTableColumnVisibility() {
            const usedColNames = [];
            // Always set these invisible by default.
            const excludeColNames = ['Attribution', 'Date', 'Line Color'];
            if (this.canvases.length > 0) {
                this.canvases.forEach(canvas => {
                    if (canvas.annotations && canvas.annotations.length > 0) {
                        canvas.annotations.forEach(annotation => {
                            if (annotation.fields) {
                                for (const fieldName in annotation.fields) {
                                    let colName = fieldName;
                                    if (fieldName === 'Comment') {
                                        colName = 'Comments';
                                    } else if (fieldName === 'Note') {
                                        colName = 'Notes';
                                    } else if (fieldName === 'Link') {
                                        colName = 'Links';
                                    } else if (fieldName === 'Tag') {
                                        colName = 'Tags';
                                    }
                                    if (usedColNames.indexOf(colName) < 0) {
                                        usedColNames.push(colName);
                                    }
                                }
                            }
                        });
                    }
                });
            }
            for (const colName in this.settings.tableColumns) {
                this.settings.tableColumns[colName] = (usedColNames.indexOf(colName) > -1 && excludeColNames.indexOf(colName) < 0);
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

.gv-sidebar :deep(img) {
    max-width: 100% !important;
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

/* Info Pane */
.gv-info-pane {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 400px;
    background-color: rgba(0,0,0,0.4);
    color: white;
    max-height: 50%;
    overflow-x: hidden;
    overflow-y: auto;
}

.gv-info-pane :deep(a) {
    color: inherit !important;
}

.gv-info-pane :deep(img) {
    max-width: 100% !important;
}

.gv-info-header {
    width: 100%;
    padding: 0.8rem;
    background-color: rgba(0,0,0,0.8);
}

.gv-info-tools {
    text-align: right;
    margin-bottom: 0.5rem;
}

.gv-info-tools span {
    cursor: pointer;
    margin-left: 0.5rem;
}

.gv-info-thumbnail {
    width: 80px;
}

.gv-info-thumbnail img {
    width: 100%;
}

.gv-info-title {
    font-weight: bold;
}

.gv-info-body {
    padding: 0.8rem;
}

.gv-powered-by {
    margin-top: 2rem;
    font-size: 0.8rem;
    color: #757575;
}

.gv-powered-by a {
    color: #757575;
}

/* Start up */
.gv-start-logo {
    max-width: 200px;
    filter: grayscale(1);
}

.gv-start-logo.animation {
    transition: filter .23s ease-in-out;
    animation: pulse 4s infinite;
}

@keyframes pulse {
    0% {
        filter: grayscale(1);
    }
    100% {
        filter: grayscale(0);
    }
}
</style>