<template>
    <div class="w-full h-full bg-gray-900" style="overflow-y:auto" v-if="annotations && annotations.length > 0">
        <div class="p-4 my-7">
            <div ref="tableTop"></div>
            <DataTable :value="annotations" tableClass="w-full" paginator :rows="10" @page="onTablePageChange">
                <Column :header="$t('ui.image')">
                    <template #body="slotProps">
                        <template v-if="this.annotationImages[slotProps.data.id]">
                            <img style="max-width:200px" :src="this.annotationImages[slotProps.data.id]" />
                        </template>
                        <template v-else-if="this.annotationImages[slotProps.data.id] === undefined">
                            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Title') >= 0" :header="$t('ui.title')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Title">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Title">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Description') >= 0" :header="$t('ui.description')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Description">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Description">
                                <div class="mb-2" v-for="value in item"
                                     v-html="HtmlUtility.detectHtml(value) ? HtmlUtility.sanitizeHtml(value) : HtmlUtility.nl2br(value)"></div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Links') >= 0" :header="$t('ui.links')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Link">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Link">
                                <div class="mb-2" v-for="value in item">
                                    <a :href="value.url" target="_blank">{{ value.text }}</a>
                                </div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Tags') >= 0" style="width:20%" :header="$t('ui.tags')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Tag">
                            <TermTagGroup class="mb-4" :terms="getAnnotationTags(slotProps.data)" read-only />
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Notes') >= 0" :header="$t('ui.notes')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Note">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Note">
                                <div class="mb-2" v-for="value in item"
                                     v-html="HtmlUtility.detectHtml(value) ? HtmlUtility.sanitizeHtml(value) : HtmlUtility.nl2br(value)"></div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Attribution') >= 0" :header="$t('ui.attribution')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Attribution">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Attribution">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Date') >= 0" :header="$t('ui.date')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Date">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Date">
                                <div class="mb-2" v-for="value in item">{{ formatDate(value) }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Line Color') >= 0" :header="$t('ui.lineColor')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.['Line Color']">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields['Line Color']">
                                <div class="mb-2" v-for="value in item" :style="`width:20px;height:20px;background-color:${value};`"></div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Line Weight') >= 0" :header="$t('ui.lineWeight')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.['Line Weight']">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields['Line Weight']">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Comments') >= 0" :header="$t('ui.comments')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Comment">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Comment">
                                <div class="mb-2" v-for="value in item">
                                    <div v-if="value.format === 'text/html'"
                                         v-html="HtmlUtility.sanitizeHtml(value.value)"></div>
                                    <template v-else>{{ value.value }}</template>
                                </div>
                            </div>
                        </template>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
    <div v-else class="flex flex-column align-items-center justify-content-center w-full h-full bg-gray-900 text-color-secondary">
        <div><i class="pi pi-comment" style="font-size: 7rem"></i></div>
        <div>{{ $t('message.noAnnotations') }}</div>
    </div>
</template>

<script>
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';

import { toRaw } from 'vue';
import TermTagGroup from "@/components/TermTagGroup.vue";
import AnnotationCropper from "@/libraries/annotation-cropper";
import ImageLoader from "@/libraries/image-loader";
import Helper from "@/libraries/helper";
import HtmlUtility from "@/libraries/html-utility.js";

export default {
    name: "TableViewer",
    components: {TermTagGroup, DataTable, Column},
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
        // The table columns to display.
        tableColumns: {
            type: Array,
            default: () => {
                return ['Title', 'Description', 'Links', 'Tags', 'Notes', 'Comments'];
            }
        },
        srcImageSize: {
            type: Number,
            default: 1024,
        }
    },
    data() {
        return {
            // The image element.
            imageElement: null,
            // The image cropper.
            cropper: null,
            // The image ratio to the original image.
            ratio: 1,
            // The image loader.
            imageLoader: null,
        }
    },
    computed: {
        // Images of each annotation which is an object with annotation ID as key and image encoded in Base64 as value.
        annotationImages() {
            const annotationImages = {};
            if (this.imageLoader) {
                this.annotations.forEach((annotation) => {
                    annotationImages[annotation.id] = AnnotationCropper.cropAnnotationImage(annotation, toRaw(this.imageLoader));
                });
            }
            return annotationImages;
        }
    },
    watch: {
        // Load the image when the image changes.
        image(newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                this.loadImage(newValue);
            }
        }
    },
    setup() {
        return { HtmlUtility }
    },
    created() {
        // Load the image.
        this.loadImage(this.image);
    },
    methods: {
        /**
         * Gets the annotation tags.
         *
         * @param {Object} annotation
         *   The annotation object.
         * @returns {*[]}
         */
        getAnnotationTags(annotation) {
            const tags = [];
            if (typeof annotation.fields?.Tag !== "undefined") {
                for (const lang in annotation.fields.Tag) {
                    annotation.fields.Tag[lang].forEach((termValue) => {
                        const term = Helper.createTermObject(termValue);
                        tags.push(term);
                    });
                }
            }
            return tags;
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
         * Scrolls to the top of the table when the page changes.
         */
        onTablePageChange() {
            this.$nextTick(() => {
                this.$refs.tableTop.scrollIntoView({ behavior: 'smooth' });
            });
        },
        /**
         * Formats the date.
         *
         * @param {string} date
         *   The date string.
         * @returns {string}
         */
        formatDate(date) {
            return Helper.formatDate(date);
        },
    }
}
</script>

<style scoped>
.anno-table-view {
    overflow-y: auto;
}
</style>
