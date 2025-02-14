<template>
    <div class="gv-container w-full h-full relative overflow-hidden" @dragover="onManifestDragOver($event)">
        <div ref="gViewer" v-if="manifestHasLoaded" v-bind="$attrs" class="w-full h-full relative overflow-hidden">
            <div class="gv-gallery flex flex-column justify-content-end h-full">
                <div class="gv-gallery-views w-full flex-grow-1" style="min-height:0">
                    <template v-for="(canvas, index) in canvases">
                        <div class="h-full" v-if="navigation.activeIndex === index">
                            <template v-if="canvas.image">
                                <TableViewer v-if="viewMode === 'table'" :image="canvas.image.url"
                                             :plain-image="canvas.image.type === 'image'"
                                             :annotations="annotations[canvas.id]" :table-columns="tableColumns"></TableViewer>
                                <ImageViewer v-else :image="canvas.image.url"
                                             :plain-image="canvas.image.type === 'image'"
                                             :annotations="annotations[canvas.id]"
                                             :light="settings.light"
                                             :default-language="annotationDefaultLanguage"></ImageViewer>
                            </template>
                            <template v-else-if="canvas.audio">
                                <AudioViewer :source="canvas.audio.url" />
                            </template>
                            <template v-else-if="canvas.video">
                                <VideoViewer :source="canvas.video.url" />
                            </template>
                            <div v-else class="flex flex-column align-items-center justify-content-center w-full h-full bg-gray-900 text-color-secondary">
                                <div><i class="pi pi-image" style="font-size: 7rem"></i></div>
                                <div>{{ $t('message.invalidImage') }}</div>
                            </div>
                        </div>
                    </template>
                </div>
                <div v-if="canvases.length > 1" class="anno-gallery-nav flex align-items-center justify-content-between gap-3 w-full bg-black-alpha-90 p-3">
                    <div>
                        <Button class="text-white" type="button" text rounded icon="pi pi-chevron-left"
                                @click="activate(navigation.activeIndex - 1)" :disabled="navigation.activeIndex === 0" />
                    </div>
                    <div ref="navContainer" class="anno-gallery-nav-items flex align-items-center justify-content-center flex-no-wrap w-full overflow-hidden"
                         :style="{gap: navigation.styles.gap + 'px'}">
                        <TransitionGroup name="rolling">
                            <div class="anno-gallery-nav-item flex-shrink-0" :style="{width: navigation.styles.thumbnailWidth + 'px'}"
                                 v-for="thumbnail in navThumbnails" :key="thumbnail.id">
                                <div class="thumbnail-container bg-gray-900">
                                    <a class="thumbnail-item" :class="{'thumbnail-item-active': navigation.activeIndex === thumbnail.index}" href="#" @click.prevent="activate(thumbnail.index)">
                                        <img v-if="thumbnail.image" :src="thumbnail.image" :alt="thumbnail.label" />
                                        <i v-else-if="thumbnail.type === 'Audio'" class="pi pi-volume-up text-color-secondary" style="font-size: 3rem"></i>
                                        <i v-else-if="thumbnail.type === 'Video'" class="pi pi-video text-color-secondary" style="font-size: 3rem"></i>
                                        <i v-else class="pi pi-image text-color-secondary" style="font-size: 3rem"></i>
                                    </a>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                    <div>
                        <Button class="text-white" type="button" text rounded icon="pi pi-chevron-right"
                                @click="activate(navigation.activeIndex + 1)" :disabled="navigation.activeIndex === canvases.length - 1" />
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
                        <div>
                            <div class="gv-info-title">{{ manifestInfo.label }}</div>
                            <div class="mt-2" v-if="collectionInfo">
                                {{ $t('ui.collection') }}: <a @click.prevent="showCollectionPanel = true" href="#">{{ collectionInfo.label }}</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="gv-info-body">
                    <div class="gv-field">
                        <div class="gv-field-label">{{ $t('ui.currentlyViewing') }} <span>({{ navigation.activeIndex + 1 }} of {{ canvases.length }})</span></div>
                        <div v-if="currentCanvasInfo?.label" class="gv-field-value">{{ currentCanvasInfo.label }}</div>
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
                <Button v-if="!isInFullscreen" rounded icon="pi pi-window-maximize" class="mr-2" :title="$t('ui.fullscreen')"
                        @click="toggleFullscreen" />
                <Button v-else rounded icon="pi pi-window-minimize" class="mr-2" :title="$t('ui.exitFullscreen')"
                        @click="toggleFullscreen" />
                <Button v-if="collectionInfo" rounded icon="pi pi-book" class="mr-2" :title="$t('ui.collection')"
                        @click="showCollectionPanel = true" />
                <Button rounded icon="pi pi-list" class="mr-2" :title="$t('ui.index')" @click="openIndexPanel" />
                <Button v-if="hasAnnotation" rounded class="mr-2"
                        :icon="viewMode === 'table' ? 'pi pi-image' : 'pi pi-comment'"
                        :title="viewMode === 'table' ? $t('ui.images') : $t('ui.annotations')" @click="toggleViewMode" />
                <Button rounded icon="pi pi-info-circle" class="mr-2" :title="$t('ui.about')" @click="showAboutPanel = true" />
                <Button rounded icon="pi pi-cog" :title="$t('ui.settings')" @click="showSettingsPanel = true" />
            </div>
            <Transition name="slide">
                <div v-if="showSettingsPanel" class="gv-sidebar">
                    <div class="text-right">
                        <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close"
                                @click="showSettingsPanel = false" />
                    </div>
                    <h3><i class="pi pi-cog"></i> {{ $t('ui.settings') }}</h3>
                    <div class="p-fluid formgrid grid">
                        <div class="w-full mb-2">
                            <h4 class="pl-2">{{ $t('ui.preference') }}</h4>
                            <div class="field col-12">
                                <label for="filterLang">{{ $t('ui.language') }}</label>
                                <Dropdown id="filterLang" v-model="$i18n.locale" :options="settings.language.options"
                                          option-label="label" option-value="value" append-to="self" @change="onPrefLanguageChange" />
                            </div>
                        </div>
                        <div v-if="hasAnnotation" class="w-full mb-2">
                            <h4 class="pl-2">{{ $t('ui.annotationFilters') }}</h4>
                            <div class="field col-12">
                                <label for="filterSet">{{ $t('ui.show') }}</label>
                                <Dropdown id="filterSet" v-model="settings.filters.set" :options="filterSetOptions"
                                          option-label="label" option-value="value" append-to="self" />
                            </div>
                            <div class="field col-12">
                                <label for="filterLang">{{ $t('ui.language') }}</label>
                                <Dropdown id="filterLang" v-model="settings.filters.language" :options="filterLanguageOptions"
                                          option-label="label" option-value="value" append-to="self" />
                            </div>
                            <div class="field col-12">
                                <label for="filterLine">{{ $t('ui.lineColor') }}</label>
                                <Dropdown id="filterLine" v-model="settings.filters.line" :options="filterLineOptions"
                                          option-label="label" option-value="value" append-to="self">
                                    <template #value="slotProps">
                                        <div v-if="slotProps.value" class="flex align-items-center gap-2">
                                            <div v-if="slotProps.value === 'all'">{{ $t('ui.allLineColors') }}</div>
                                            <div v-else :style="`width:100%;height:20px;background-color:${slotProps.value}`"></div>
                                        </div>
                                        <span v-else>
                                            {{ slotProps.placeholder }}
                                        </span>
                                    </template>
                                    <template #option="slotProps">
                                        <div class="flex align-items-center gap-2">
                                            <div v-if="slotProps.option.value === 'all'">{{ slotProps.option.label }}</div>
                                            <div :style="`width:100%;height:20px;background-color:${slotProps.option.value}`"></div>
                                        </div>
                                    </template>
                                </Dropdown>
                            </div>
                            <div class="field col-12">
                                <label for="filterLang">{{ $t('ui.lineWeight') }}</label>
                                <Dropdown id="filterLang" v-model="settings.filters.weight" :options="filterWeightOptions"
                                          option-label="label" option-value="value" append-to="self" />
                            </div>
                        </div>
                        <div class="w-full">
                            <h4 class="pl-2">{{ $t('ui.display') }}</h4>
                            <div v-if="viewMode === 'image'"  class="field col-12 flex align-items-center gap-4">
                                <div><i class="pi pi-sun"></i> {{ $t('ui.light') }}</div>
                                <Slider v-model="settings.light" class="w-10rem" />
                                <span>{{ settings.light }}%</span>
                            </div>
                            <div v-if="viewMode === 'image'" class="field col-12 flex align-items-center gap-4">
                                <div><i class="pi pi-info-circle"></i> {{ $t('ui.informationPanel') }}</div>
                                <InputSwitch v-model="settings.showInfoPanel" />
                            </div>
                            <div v-if="viewMode === 'table' && hasAnnotation" class="field col-12">
                                <div class="mb-2">{{ $t('ui.tableColumns') }}</div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Title" input-id="tcTitle"
                                              :binary="true" />
                                    <label for="tcTitle">{{ $t('ui.title') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Description" input-id="tcDescription"
                                              :binary="true" />
                                    <label for="tcDescription">{{ $t('ui.description') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Links" input-id="tcLinks"
                                              :binary="true" />
                                    <label for="tcLinks">{{ $t('ui.links') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Tags" input-id="tcTags"
                                              :binary="true" />
                                    <label for="tcTags">{{ $t('ui.tags') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Notes" input-id="tcNotes"
                                              :binary="true" />
                                    <label for="tcNotes">{{ $t('ui.notes') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Attribution" input-id="tcAttribution"
                                              :binary="true" />
                                    <label for="tcAttribution">{{ $t('ui.attribution') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Date" input-id="tcDate"
                                              :binary="true" />
                                    <label for="tcDate">{{ $t('ui.date') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns['Line Color']" input-id="tcLineColor"
                                              :binary="true" />
                                    <label for="tcLineColor">{{ $t('ui.lineColor') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns['Line Weight']" input-id="tcLineWeight"
                                              :binary="true" />
                                    <label for="tcLineWeight">{{ $t('ui.lineWeight') }}</label>
                                </div>
                                <div class="mb-1">
                                    <Checkbox class="mr-2" v-model="settings.tableColumns.Comments" input-id="tcComments"
                                              :binary="true" />
                                    <label for="tcComments">{{ $t('ui.comments') }}</label>
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
                    <ResourceInfoCard :resource-info="manifestInfo" :card-title="$t('ui.about')" />
                    <ResourceInfoCard v-if="currentCanvasInfo" :resource-info="currentCanvasInfo"
                                      :card-title="$t('ui.canvasInformation')" />
                    <div class="text-center mt-8 gv-powered-by">
                        <span class="mr-2">Powered by Glycerine Viewer (v{{ version }})</span>
                        <a target="_blank" class="mr-2" title="Website" href="https://glycerine.io/viewer/">
                            <i class="pi pi-globe"></i>
                        </a>
                        <a target="_blank" title="GitHub" href="https://github.com/Systemik-Solutions/glycerine-viewer">
                            <i class="pi pi-github"></i>
                        </a>
                    </div>
                </div>
            </Transition>
            <Transition name="slide">
                <div v-if="showCollectionPanel" class="gv-sidebar">
                    <div class="text-right">
                        <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close"
                                @click="showCollectionPanel = false" />
                    </div>
                    <ResourceInfoCard :resource-info="collectionInfo" :card-title="$t('ui.collection')" title-icon="book" />
                    <div v-if="collectionInfo.items.length > 0">
                        <Listbox :modelValue="collectionActiveManifest" :options="collectionInfo.items" optionLabel="label"
                                 optionValue="id" @change="switchCollectionItem" class="w-full">
                            <template #option="slotProps">
                                <span v-if="slotProps.option.type === 'Collection'"><i class="pi pi-book"></i></span>
                                <span v-else><i class="pi pi-file"></i></span>
                                {{ slotProps.option.label }}
                            </template>
                        </Listbox>
                    </div>

                </div>
            </Transition>
            <Transition name="slide">
                <div v-if="index.showIndexPanel" class="gv-sidebar">
                    <div ref="indexPanelTop"></div>
                    <div class="text-right">
                        <Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close"
                                @click="index.showIndexPanel = false" />
                    </div>
                    <h3><i class="pi pi-list"></i> {{ $t('ui.index') }}</h3>
                    <TabView class="gv-index-tabs">
                        <TabPanel :header="$t('ui.items')">
                            <DataTable :value="indexItems" tableClass="w-full" paginator :rows="index.rowsPerPage" selectionMode="single"
                                       dataKey="id" paginatorTemplate="PrevPageLink JumpToPageDropdown NextPageLink"
                                       v-model:filters="index.searchFilter" :globalFilterFields="['label']"
                                       @page="indexPanelScrollTop" v-bind:selection="activeIndexItem"
                                       @rowSelect="onIndexRowSelect" :first="indexTableFirstIndex">
                                <template #header>
                                    <div class="flex justify-content-end">
                                        <div class="p-input-icon-left w-full">
                                            <i class="pi pi-search" />
                                            <InputText v-model="index.searchFilter['global'].value" :placeholder="$t('ui.search')" class="w-full" />
                                        </div>
                                    </div>
                                </template>
                                <template #empty> {{ $t('message.noResults') }} </template>
                                <Column style="width:20%" field="thumbnail" :header="$t('ui.thumbnail')">
                                    <template #body="slotProps">
                                        <img v-if="slotProps.data.thumbnail" class="w-full" :src="slotProps.data.thumbnail" alt="" />
                                        <div v-else-if="slotProps.data.type === 'Audio'" class="thumbnail-container surface-50">
                                            <i class="pi pi-volume-up text-color-secondary" style="font-size: 1rem"></i>
                                        </div>
                                        <div v-else-if="slotProps.data.type === 'Video'" class="thumbnail-container surface-50">
                                            <i class="pi pi-video text-color-secondary" style="font-size: 1rem"></i>
                                        </div>
                                    </template>
                                </Column>
                                <Column style="width:80%" field="label" :header="$t('ui.label')">
                                    <template #body="slotProps">
                                        <span v-if="slotProps.data.label">{{ slotProps.data.label }}</span>
                                        <span v-else>NA</span>
                                    </template>
                                </Column>
                            </DataTable>
                        </TabPanel>
                        <TabPanel v-if="structureNodes.length > 0" :header="$t('ui.structures')">
                            <Tree :value="structureNodes" class="w-full" selectionMode="single"
                                  v-bind:selectionKeys="selectedStructureNodes"
                                  v-bind:expandedKeys="expandedStructureNodes"
                                  @nodeSelect="onStructureNodeSelect"></Tree>
                        </TabPanel>
                    </TabView>
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
        <div v-if="showDropZone" class="drop-zone w-full h-full overflow-hidden flex flex-column align-items-center justify-content-center gap-2"
             @dragleave="onManifestDragLeave($event)" @drop="onManifestDrop($event)" >
            <div><i class="pi pi-file" style="font-size: 5rem"></i></div>
            <div>{{ $t('ui.dropManifests') }}</div>
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
import Listbox from 'primevue/listbox';
import Chip from 'primevue/chip';
import TabView from "primevue/tabview";
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Tree from 'primevue/tree';
import Slider from "primevue/slider";

import {FilterMatchMode} from "primevue/api";

import ImageViewer from "@/components/ImageViewer.vue";
import {toRaw} from "vue";
import TableViewer from "@/components/TableViewer.vue";
import AudioViewer from "@/components/AudioViewer.vue";
import VideoViewer from "@/components/VideoViewer.vue";
import ResourceInfoCard from "@/components/ResourceInfoCard.vue";
import Language from "@/libraries/languages";
import HtmlUtility from "@/libraries/html-utility.js";
import Helper from "@/libraries/helper.js";
import { ManifestLoader, CollectionParser, ResourceParserFactory } from "@/libraries/iiif/dependency-manager.js";

export default {
    name: "GlycerineViewer",
    components: {
        AudioViewer, VideoViewer,
        TableViewer, ImageViewer, ResourceInfoCard, Button, Dropdown, InputSwitch, Checkbox, Message, Listbox, Chip, TabView, TabPanel, DataTable, Column, InputText, Tree, Slider},
    props: {
        // The IIIF manifest. Can be the URL of the manifest or the manifest object.
        manifest: {
            type: [Object, String],
            required: true,
        },
        // The default state of the info panel.
        defaultInfoPanel: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            // The IIIF manifest URL or object of the current viewing manifest.
            currentManifest: this.manifest,
            // The status of the manifest. Can be 'initial', 'loading', 'loaded', or 'error'.
            manifestStatus: 'initial',
            // The manifest error messages.
            manifestErrors: [],
            // The view mode. Can be 'image' or 'table'.
            viewMode: 'image',
            // Whether to show the "About" panel.
            showAboutPanel: false,
            // Whether to show the "Collection" panel.
            showCollectionPanel: false,
            // Whether to show the "Settings" panel.
            showSettingsPanel: false,
            // The settings.
            settings: {
                // Language settings.
                language: {
                    // The current selected language code.
                    default: null,
                    // The language options. Each item is an object with 'label' and 'value'.
                    options: [],
                },
                // Filters data.
                filters: {
                    // The annotation set filter.
                    set: 'all',
                    // The language filter.
                    language: 'all',
                    // The line color filter.
                    line: 'all',
                    // The line weight filter.
                    weight: 'all',
                },
                // Light level 0-100.
                light: 100,
                // Whether to show the info panel.
                showInfoPanel: this.defaultInfoPanel,
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
                    "Line Weight": false,
                    Comments: false,
                }
            },
            // Whether the viewer is in fullscreen mode.
            isInFullscreen: false,
            // Whether the fullscreen listener has been added to the element.
            // This is to prevent adding the same listener multiple times.
            hasAddedFullscreenListener: false,
            // The active manifest id of the current collection.
            collectionActiveManifest: null,
            // The navigation data.
            navigation: {
                // The active index of the canvas.
                activeIndex: 0,
                // The max number of visible items in the navigation.
                maxVisibleItems: 0,
                styles: {
                    // The image thumbnail width (in pixel).
                    thumbnailWidth: 110,
                    // The gap between thumbnails (in pixel).
                    gap: 15,
                }
            },
            // Index.
            index: {
                showIndexPanel: false,
                searchFilter: {
                    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                },
                rowsPerPage: 10,
            },
            // Whether to show the drop zone.
            showDropZone: false,
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
        // Manifest information.
        manifestInfo() {
            const manifestInfo = {};
            if (this.manifestHasLoaded) {
                // Get the manifest link.
                let linkURL = null;
                if (typeof this.currentManifest === 'string') {
                    linkURL = this.currentManifest;
                }
                if (typeof this.currentManifest === 'object' && this.currentManifest.id) {
                    linkURL = this.currentManifest.id;
                }
                if (linkURL) {
                    manifestInfo.link = {
                        text: 'IIIF Manifest',
                        url: linkURL,
                    };
                }
                const parser = this.manifestLoader.getParser();
                manifestInfo.label = parser.getPrefLabel(this.settings.language.default);
                manifestInfo.summary = parser.getSummary(this.settings.language.default);
                manifestInfo.requiredStatement = parser.getRequiredStatement(this.settings.language.default);
                manifestInfo.rights = parser.getRights();
                manifestInfo.metadata = parser.getMetadata(this.settings.language.default);
                manifestInfo.rendering = parser.getRendering(this.settings.language.default);
                manifestInfo.homepage = parser.getHomePage(this.settings.language.default);
                manifestInfo.seeAlso = parser.getSeeAlsoLinks(this.settings.language.default);
                manifestInfo.thumbnail = parser.getThumbnail();
                manifestInfo.provider = parser.getProvider();
            }
            return manifestInfo;
        },
        // The information of the current canvas.
        currentCanvasInfo() {
            if (this.manifestHasLoaded) {
                const parser = toRaw(this.canvases[this.navigation.activeIndex].parser);
                const canvasInfo = {
                    label: parser.getPrefLabel(this.settings.language.default),
                    summary: parser.getSummary(this.settings.language.default),
                    requiredStatement: parser.getRequiredStatement(this.settings.language.default),
                    rights: parser.getRights(),
                    metadata: parser.getMetadata(this.settings.language.default),
                    rendering: parser.getRendering(this.settings.language.default),
                    homepage: parser.getHomePage(this.settings.language.default),
                    seeAlso: parser.getSeeAlsoLinks(this.settings.language.default),
                    provider: parser.getProvider(),
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
        // The information of the collection.
        collectionInfo() {
            if (this.manifestHasLoaded && this.collectionLoader) {
                const collectionParser = this.collectionLoader.getParser();
                const collectionInfo = {
                    link: {
                        text: 'IIIF Manifest',
                        url: collectionParser.getID(),
                    },
                    label: collectionParser.getPrefLabel(this.settings.language.default),
                    summary: collectionParser.getSummary(this.settings.language.default),
                    requiredStatement: collectionParser.getRequiredStatement(this.settings.language.default),
                    rights: collectionParser.getRights(),
                    metadata: collectionParser.getMetadata(this.settings.language.default),
                    rendering: collectionParser.getRendering(this.settings.language.default),
                    homepage: collectionParser.getHomePage(this.settings.language.default),
                    seeAlso: collectionParser.getSeeAlsoLinks(this.settings.language.default),
                    provider: collectionParser.getProvider(),
                };
                // Get items.
                collectionInfo.items = [];
                const items = collectionParser.getItems();
                for (const item of items) {
                    const itemParser = ResourceParserFactory.create(item);
                    collectionInfo.items.push({
                        id: itemParser.getID(),
                        label: itemParser.getPrefLabel(this.settings.language.default),
                        type: itemParser.getType(),
                        thumbnail: itemParser.getThumbnail(),
                    });
                }
                return collectionInfo;
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
                            if (
                                this.settings.filters.weight !== 'all' &&
                                annotation.fields['Line Weight']?.en?.[0] !== this.settings.filters.weight
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
        // Whether the manifest has annotation data.
        hasAnnotation() {
            let hasAnnotation = false;
            if (this.canvases.length > 0) {
                this.canvases.forEach(canvas => {
                    if (canvas.annotations && canvas.annotations.length > 0) {
                        hasAnnotation = true;
                    }
                });
            }
            return hasAnnotation;
        },
        // The annotation set filter options.
        filterSetOptions() {
            const options = [
                { label: this.$t('ui.allAnnotations'), value: 'all' },
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
            options.push({ label: this.$t('ui.noAnnotations'), value: 'none' });
            return options;
        },
        // The language filter options.
        filterLanguageOptions() {
            const options = [
                { label: this.$t('ui.allLanguages'), value: 'all' },
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
                { label: this.$t('ui.allLineColors'), value: 'all' },
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
        // The line weight filter options.
        filterWeightOptions() {
            const options = [
                { label: this.$t('ui.allLineWeights'), value: 'all' },
            ];
            if (this.canvases.length > 0) {
                const weights = [];
                this.canvases.forEach(canvas => {
                    if (canvas.annotations && canvas.annotations.length > 0) {
                        canvas.annotations.forEach(annotation => {
                            if (annotation.fields) {
                                for (const fieldName in annotation.fields) {
                                    if (fieldName === 'Line Weight') {
                                        if (annotation.fields[fieldName].en) {
                                            const color = annotation.fields[fieldName].en[0];
                                            if (weights.indexOf(color) < 0) {
                                                weights.push(color);
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                weights.forEach(weight => {
                    options.push({ label: weight, value: weight });
                });
            }
            return options;
        },
        // Whether to show the info panel.
        infoPanelVisibility() {
            return this.manifestHasLoaded && this.settings.showInfoPanel && this.viewMode === 'image';
        },
        // The default language code for annotations.
        annotationDefaultLanguage() {
            if (this.settings.filters.language !== 'all') {
                return this.settings.filters.language;
            }
            return this.settings.language.default;
        },
        // The thumbnails to be displayed in the navigation.
        // Each item is an object with 'id', 'thumbnail', 'label', and 'index'.
        navThumbnails() {
            const thumbnails = [];
            if (this.canvases.length > 0 && this.navigation.maxVisibleItems > 0) {
                let start = Math.max(0, this.navigation.activeIndex - Math.floor(this.navigation.maxVisibleItems / 2));
                let end = Math.min(this.canvases.length, start + this.navigation.maxVisibleItems);
                // Fill from the start if it is less than the max visible items.
                if (end - start < this.navigation.maxVisibleItems) {
                    start = Math.max(0, end - this.navigation.maxVisibleItems);
                }
                for (let i = start; i < end; i++) {
                    const canvas = this.canvases[i];
                    const item = {
                        id: canvas.id,
                        image: canvas.thumbnail,
                        label: canvas.label,
                        index: i,
                    };
                    if (canvas.image) {
                        item.type = 'Image';
                    } else if (canvas.audio) {
                        item.type = 'Audio';
                    } else if (canvas.video) {
                        item.type = 'Video';
                    }
                    thumbnails.push(item);
                }
            }
            return thumbnails;
        },
        // The index items to be displayed in the index panel.
        indexItems() {
            const items = [];
            if (this.canvases.length > 0) {
                for (let i = 0; i < this.canvases.length; i++) {
                    const canvas = this.canvases[i];
                    const item = {
                        id: canvas.id,
                        label: canvas.label,
                        thumbnail: canvas.thumbnail,
                        index: i,
                    };
                    if (canvas.image) {
                        item.type = 'Image';
                    } else if (canvas.audio) {
                        item.type = 'Audio';
                    } else if (canvas.video) {
                        item.type = 'Video';
                    }
                    items.push(item);
                }
            }
            return items;
        },
        // The active index item.
        activeIndexItem() {
            if (this.indexItems[this.navigation.activeIndex]) {
                return this.indexItems[this.navigation.activeIndex];
            }
            return null;
        },
        // The first row index to display in the table. Controls the page to display.
        indexTableFirstIndex() {
            return Math.floor(this.navigation.activeIndex / this.index.rowsPerPage) * this.index.rowsPerPage;
        },
        // The nodes for the structure tree.
        structureNodes() {
            let nodes = [];
            if (this.manifestHasLoaded) {
                const canvasIDs = this.canvases.map((canvas) => canvas.id);
                // Define the traversal function.
                const createStructureTree = (structures) => {
                    const treeNodes = [];
                    for (const structure of structures) {
                        let parser = ResourceParserFactory.create(structure);
                        if (parser.getType() === 'Range') {
                            const rangeLabel = parser.getPrefLabel(this.settings.language.default);
                            if (rangeLabel) {
                                const treeNode = {
                                    key: parser.getID(),
                                    label: rangeLabel,
                                    data: {
                                        id: parser.getID(),
                                        type: parser.getType(),
                                        label: rangeLabel,
                                    },
                                };
                                if (structure.items) {
                                    const subRanges = [];
                                    for (const item of structure.items) {
                                        if (item.type === 'Range') {
                                            subRanges.push(item);
                                        } else if (item.type === 'Canvas') {
                                            const canvasID = item.id;
                                            const canvasIndex = canvasIDs.indexOf(canvasID);
                                            if (canvasIndex > -1) {
                                                if (treeNode.data.canvasIndices) {
                                                    treeNode.data.canvasIndices.push(canvasIndex);
                                                } else {
                                                    treeNode.data.canvasIndices = [canvasIndex];
                                                }
                                            }
                                        }
                                    }
                                    if (subRanges.length > 0) {
                                        treeNode.children = createStructureTree(subRanges);
                                    }
                                }
                                treeNodes.push(treeNode);
                            }
                        }
                    }
                    return treeNodes;
                };
                const parser = this.manifestLoader.getParser();
                const structures = parser.getStructures();
                if (structures) {
                    nodes = createStructureTree(structures);
                }
            }
            return nodes;
        },
        // Selected node keys in the structure tree. It is a map where the key is the node key and the value is true.
        selectedStructureNodes() {
            const selectNodeKeys = {};
            if (this.structureNodes.length > 0) {
                // Define the traversal function.
                const findSelectedNodes = (nodes) => {
                    for (const node of nodes) {
                        if (node.data.canvasIndices && node.data.canvasIndices.indexOf(this.navigation.activeIndex) > -1) {
                            selectNodeKeys[node.key] = true;
                        }
                        if (node.children) {
                            findSelectedNodes(node.children);
                        }
                    }

                };
                findSelectedNodes(this.structureNodes);
            }
            return selectNodeKeys;
        },
        // Expanded node keys in the structure tree. It is a map where the key is the node key and the value is true.
        expandedStructureNodes() {
            const expandedNodeKeys = {};
            if (this.structureNodes.length > 0) {
                // Define the traversal function.
                const expandedNodes = (nodes) => {
                    let expand = false;
                    for (const node of nodes) {
                        if (node.data.canvasIndices && node.data.canvasIndices.indexOf(this.navigation.activeIndex) > -1) {
                            expand = true;
                        }
                        if (node.children) {
                            const childExpand = expandedNodes(node.children);
                            if (childExpand) {
                                expand = true;
                                expandedNodeKeys[node.key] = true;
                            }
                        }
                    }
                    return expand;
                };
                expandedNodes(this.structureNodes);
            }
            return expandedNodeKeys;
        },
    },
    setup() {
        return {
            version: __APP_VERSION__,
            logoPath,
            HtmlUtility,
            Helper,
            manifestLoader: null,
            collectionLoader: null,
        };
    },
    mounted() {
        // Load the manifest data.
        this.loadManifest();
    },
    watch: {
        // Watch the manifest change to reset the viewer.
        manifest() {
            this.collectionLoader = null;
            this.reset();
        },
        // Init the navigation when the manifest has loaded.
        manifestHasLoaded: {
            handler(newValue, oldValue) {
                if (newValue && this.canvases && this.canvases.length > 1) {
                    this.initNavigation();
                }
            },
            flush: 'post'
        },
    },
    methods: {
        /**
         * Resets the viewer.
         *
         * @param {string|null} manifest
         *   The manifest URL or object to reset to. If it is set to null, it will reset to the original manifest.
         *
         * @returns {Promise<void>}
         */
        async reset(manifest = null) {
            // Reset the state.
            this.currentManifest = manifest ?? this.manifest;
            this.manifestStatus = 'initial';
            this.manifestErrors = [];
            this.viewMode = 'image';
            this.showAboutPanel = false;
            this.showCollectionPanel = false;
            this.showSettingsPanel = false;
            this.settings = {
                language: {
                    default: null,
                    options: [],
                },
                filters: {
                    set: 'all',
                    language: 'all',
                    line: 'all',
                    weight: 'all',
                },
                light: 100,
                showInfoPanel: true,
                tableColumns: {
                    Title: true,
                    Description: true,
                    Links: true,
                    Tags: true,
                    Notes: true,
                    Attribution: false,
                    Date: false,
                    "Line Color": false,
                    "Line Weight": false,
                    Comments: false,
                }
            };
            this.isInFullscreen = false;
            this.hasAddedFullscreenListener = false;
            this.collectionActiveManifest = null;
            this.navigation = {
                activeIndex: 0,
                maxVisibleItems: 0,
                styles: {
                    thumbnailWidth: 110,
                    gap: 15,
                }
            }
            this.index = {
                showIndexPanel: false,
                searchFilter: {
                    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                },
                rowsPerPage: 10,
            }
            // Load the manifest data.
            await this.loadManifest();
        },
        /**
         * Loads the manifest data.
         *
         * @returns {Promise<void>}
         */
        async loadManifest() {
            const manifestLoader = new ManifestLoader(this.currentManifest);
            this.manifestStatus = 'loading';
            await manifestLoader.load();
            if (manifestLoader.hasErrors()) {
                this.manifestStatus = 'error';
                this.manifestErrors = manifestLoader.getErrors();
            } else if (manifestLoader.hasLoaded()) {
                if (manifestLoader.getParser() instanceof CollectionParser) {
                    // Collection.
                    this.collectionLoader = manifestLoader;
                    // Load the first manifest from the collection.
                    const items = this.collectionLoader.getParser().getItems();
                    if (items && items.length > 0) {
                        this.currentManifest = items[0].id;
                        await this.loadManifest();
                    }
                } else {
                    // Manifest.
                    this.manifestLoader = manifestLoader;
                    this.manifestStatus = 'loaded';
                    // Load column visibility.
                    this.loadTableColumnVisibility();
                    // Load languages.
                    const langOptions = Language.uiLanguages;
                    const langOptionCodes = langOptions.map((lang) => lang.code);
                    const languages = this.manifestLoader.getParser().getLanguages();
                    for (const lang of languages) {
                        if (langOptionCodes.indexOf(lang.code) < 0) {
                            langOptions.push(lang);
                        }
                    }
                    this.settings.language.options = langOptions.map((lang) => {
                        return {label: lang.name, value: lang.code}
                    });
                    // Set default language.
                    this.settings.language.default = this.$i18n.locale;
                    // Set the start index.
                    const startCanvas = this.manifestLoader.getParser().getStartCanvas();
                    if (startCanvas) {
                        this.manifestLoader.getParser().getCanvases().forEach((canvas, index) => {
                            if (canvas.id === startCanvas) {
                                this.navigation.activeIndex = index;
                            }
                        });
                    }
                    // Set the active manifest if it is in a collection.
                    if (this.collectionLoader) {
                        this.collectionActiveManifest = this.manifestLoader.getParser().getID();
                    }
                }
            }
        },
        /**
         * Load the table column visibility based on the annotation content.
         */
        loadTableColumnVisibility() {
            const usedColNames = [];
            // Always set these invisible by default.
            const excludeColNames = ['Attribution', 'Date', 'Line Color', 'Line Weight'];
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
            this.navigation.activeIndex = index;
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
        },
        /**
         * Toggle the fullscreen mode.
         */
        toggleFullscreen() {
            const elem = this.$refs.gViewer;
            if (this.isInFullscreen) {
                // Exit the fullscreen mode.
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { /* Firefox */
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { /* IE/Edge */
                    document.msExitFullscreen();
                }
            } else {
                // Enter the fullscreen mode.
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.mozRequestFullScreen) { /* Firefox */
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE/Edge */
                    elem.msRequestFullscreen();
                }
            }
            if (!this.hasAddedFullscreenListener) {
                elem.addEventListener('fullscreenchange', () => {
                    this.isInFullscreen = document.fullscreenElement !== null;
                });
                this.hasAddedFullscreenListener = true;
            }
        },
        /**
         * Switch the collection item.
         *
         * @param event
         */
        switchCollectionItem(event) {
            if (event.value) {
                this.reset(event.value);
            }
        },
        /**
         * Initialize the navigation.
         */
        initNavigation() {
            const navContainer = this.$refs.navContainer;
            const containerWidth = navContainer.offsetWidth;
            // Calculate the max number of visible items.
            let maxCount = Math.floor(containerWidth / (this.navigation.styles.thumbnailWidth + this.navigation.styles.gap));
            // Make it an odd number if it is greater than 1.
            if (maxCount > 1 && maxCount % 2 === 0) {
                maxCount -= 1;
            }
            this.navigation.maxVisibleItems = maxCount;
        },
        /**
         * Open the index panel.
         */
        openIndexPanel() {
            this.index.searchFilter.global.value = null;
            this.index.showIndexPanel = true;
        },
        /**
         * Scroll to the top of the index panel.
         */
        indexPanelScrollTop() {
            this.$nextTick(() => {
                this.$refs.indexPanelTop.scrollIntoView({ behavior: 'smooth' });
            });
        },
        /**
         * Event handler when an index row is selected.
         *
         * @param event
         */
        onIndexRowSelect(event) {
            const selectedItem = event.data;
            for (let i = 0; i < this.indexItems.length; i++) {
                if (this.indexItems[i].id === selectedItem.id) {
                    this.activate(i);
                    break;
                }
            }
        },
        /**
         * Event handler when a structure node is selected.
         *
         * @param node
         */
        onStructureNodeSelect(node) {
            if (node.data.canvasIndices && node.data.canvasIndices.length > 0) {
                this.activate(node.data.canvasIndices[0]);
            }
        },
        /**
         * Event handler when a manifest is dropped.
         *
         * @param event
         */
        onManifestDrop(event) {
            event.preventDefault();
            const manifestUrl = event.dataTransfer.getData('text/plain');
            if (Helper.isURL(manifestUrl)) {
                this.collectionLoader = null;
                this.reset(manifestUrl);
            }
            this.showDropZone = false;
        },
        /**
         * Event handler when a manifest is dragged over.
         *
         * @param event
         */
        onManifestDragOver(event) {
            event.preventDefault();
            this.showDropZone = true;
        },
        /**
         * Event handler when a manifest is dragged out.
         *
         * @param event
         */
        onManifestDragLeave(event) {
            event.preventDefault();
            this.showDropZone = false;
        },
        /**
         * Event handler when the language is changed.
         *
         * @param event
         */
        onPrefLanguageChange(event) {
            this.settings.language.default = event.value;
            // Save the language to local storage.
            localStorage.setItem('prefLang', event.value);
        },
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

.thumbnail-item {
    opacity: 0.5;
}

.thumbnail-item-active {
    opacity: 1;
}

.thumbnail-item:hover {
    opacity: 1;
}

/* Navigation rolling animation */
.rolling-move,
.rolling-enter-active,
.rolling-leave-active {
    transition: opacity 0.5s ease;
}

.rolling-enter-from,
.rolling-leave-to {
    opacity: 0;
}

.rolling-leave-active {
    position: absolute;
}

.gv-sidebar {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 999;
    background-color: #FDFEFF;
    padding: 2rem;
    overflow-y: auto;
    box-shadow: -2px 2px 4px rgba(0,0,0,0.15);
    overflow-wrap: break-word;
}

@media (min-width: 400px) {
    .gv-sidebar {
        width: 400px;
    }
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
    width: 100%;
    top: 5rem;
    left: 0;
    background-color: rgba(0,0,0,0.4);
    color: white;
    max-height: 70%;
    overflow-x: hidden;
    overflow-y: auto;
    overflow-wrap: break-word;
    z-index: 50;
}

@media (min-width: 450px) {
    .gv-info-pane {
        width: 400px;
        top: 1rem;
        left: 1rem;
    }
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

/* Index */
.p-tabview.gv-index-tabs :deep(.p-tabview-panels) {
    padding-left: 0;
    padding-right: 0;
}

/* Drop Zone */
.drop-zone {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.5);
    border: #d0d0d0 dashed 5px;
    color: #d0d0d0;
    font-weight: bold;
    font-size: 1.5rem;
}
</style>