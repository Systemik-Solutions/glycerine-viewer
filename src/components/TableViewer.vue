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
                <Column :header="$t('ui.title')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.title">
                            <div class="mb-2" v-for="(value, lang) in slotProps.data.title">
                                <div class="mb-2">{{ value }}</div>
                            </div>
                        </template>
                    </template>
                </Column>
                <Column :header="$t('ui.template')">
                    <template #body="slotProps">
                        <template v-if="slotProps.data.templateName">
                            <div class="mb-2">{{ slotProps.data.templateName }}</div>
                        </template>
                    </template>
                </Column>
                <Column :header="$t('ui.details')">
                    <template #body="slotProps">
                        <Button :label="$t('ui.details')" outlined @click="openPopup(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
    <div v-else class="flex flex-column align-items-center justify-content-center w-full h-full bg-gray-900 text-color-secondary">
        <div><i class="pi pi-comment" style="font-size: 7rem"></i></div>
        <div>{{ $t('message.noAnnotations') }}</div>
    </div>
    <AnnotationPopup v-if="selectedAnnotation" :visible="showPopup" :annotation="selectedAnnotation"
                     :defaultLanguage="defaultLanguage"
                     @close="showPopup = false" />
</template>

<script>
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Button from 'primevue/button';

import { toRaw } from 'vue';
import TermTagGroup from "@/components/TermTagGroup.vue";
import AnnotationCropper from "@/libraries/annotation-cropper";
import ImageLoader from "@/libraries/image-loader";
import HtmlUtility from "@/libraries/html-utility.js";
import AnnotationPopup from "@/components/AnnotationPopup.vue";

export default {
    name: "TableViewer",
    components: {AnnotationPopup, TermTagGroup, DataTable, Column, Button},
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
        srcImageSize: {
            type: Number,
            default: 1024,
        },
        // The default language code.
        defaultLanguage: {
            type: String,
            default: 'en',
        },
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
            // Whether to show the popup.
            showPopup: false,
            // The selected annotation for the popup.
            selectedAnnotation: null,
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
         * Opens the popup for the annotation.
         *
         * @param {Object} annotation
         *   The annotation.
         */
        openPopup(annotation) {
            this.selectedAnnotation = annotation;
            this.showPopup = true;
        }
    }
}
</script>

<style scoped>
.anno-table-view {
    overflow-y: auto;
}
</style>
