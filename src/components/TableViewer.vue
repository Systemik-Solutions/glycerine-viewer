<template>
    <div class="w-full h-full bg-gray-900" style="overflow-y:auto">
        <div class="p-4 my-7" v-if="annotations && annotations.length > 0">
            <div ref="tableTop"></div>
            <DataTable :value="annotations" tableClass="w-full" paginator :rows="10" @page="onTablePageChange">
                <Column header="Image">
                    <template #body="slotProps">
                        <template v-if="this.annotationImages[slotProps.data.id]">
                            <img style="max-width:200px" :src="this.annotationImages[slotProps.data.id]" />
                        </template>
                        <template v-else-if="this.annotationImages[slotProps.data.id] === undefined">
                            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Title') >= 0" header="Title">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Title">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Title">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Description') >= 0" header="Description">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Description">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Description">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Links') >= 0" header="Links">
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
                <Column v-if="tableColumns.indexOf('Tags') >= 0" style="width:20%" header="Tags">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Tag">
                            <TermTagGroup class="mb-4" :terms="getAnnotationTags(slotProps.data)" read-only />
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Notes') >= 0" header="Notes">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Note">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Note">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Attribution') >= 0" header="Attribution">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Attribution">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Attribution">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Date') >= 0" header="Date">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.Date">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields.Date">
                                <div class="mb-2" v-for="value in item">{{ formatDate(value) }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Line Color') >= 0" header="Line Color">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.fields?.['Line Color']">
                            <div class="mb-2" v-for="(item, lang) in slotProps.data.fields['Line Color']">
                                <div class="mb-2" v-for="value in item">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column v-if="tableColumns.indexOf('Comments') >= 0" header="Comments">
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
        <div v-else class="p-4 mt-8 text-3xl text-center">
            There's no annotation available.
        </div>
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
            if (typeof annotation.fields?.Tag?.en !== "undefined") {
                annotation.fields.Tag.en.forEach((termValue) => {
                    const term = Helper.createTermObject(termValue);
                    tags.push(term);
                });
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
