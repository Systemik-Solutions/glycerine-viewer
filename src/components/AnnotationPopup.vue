<template>
    <Dialog v-model:visible="show" modal
            :header="annotation.title?.[selectedLanguage] ?? ' '" :style="{ width: '50rem' }"
            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
            append-to="self"
            :pt="{
                mask: (options) => ({
                    style: {
                        'z-index': 1000
                    }
                }),
            }">
        <div v-if="languages.length > 0" class="p-fluid formgrid grid">
            <div class="field col-12 flex justify-content-end">
                <Dropdown id="anoLanguage" class="w-5 lg:w-3" v-model="selectedLanguage" append-to="self"
                          :options="languages" option-label="name" option-value="code" />
            </div>
        </div>
        <div v-if="cutoutImage" class="text-right mb-2">
            <img :src="cutoutImage" alt="Annotation cutout" style="max-width:50%" />
        </div>
        <AnnotationContent :content="annotation.content" :language="selectedLanguage" />
        <template #footer>
            <div v-if="annotation.templateName" class="mt-4 mb-4 text-sm">{{ $t('ui.template') }}: {{ annotation.templateName }}</div>
            <Button :label="$t('ui.close')" icon="pi pi-times" @click="show = false" outlined />
        </template>
    </Dialog>
</template>

<script>
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import AnnotationContent from "@/components/AnnotationContent.vue";
import Button from "primevue/button";
import Languages from "@/libraries/languages.js";

export default {
    name: "AnnotationPopup",
    components: {AnnotationContent, Button, Dropdown, Dialog},
    emits: [
        // Emitted when the popup is opened.
        'open',
        // Emitted when the popup is closed.
        'close',
    ],
    props: {
        // Whether the popup is visible.
        visible: {
            type: Boolean,
            default: false,
        },
        // The annotation data to display in the popup.
        annotation: {
            type: Object,
            required: true,
        },
        // The default language to use.
        defaultLanguage: {
            type: String,
            default: 'en',
        },
        // The cutout image of the annotation.
        cutoutImage: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            // Controls the visibility of the popup.
            show: false,
            // The currently selected language.
            selectedLanguage: null,
        }
    },
    computed: {
        // The list of language codes available in the annotation.
        languageCodes() {
            const codes = [];
            if (this.annotation.content) {
                for (const item of this.annotation.content) {
                    if (item.type === 'tab' && item.items) {
                        for (const child of item.items) {
                            if (child.values) {
                                for (const lang of Object.keys(child.values)) {
                                    if (!codes.includes(lang)) {
                                        codes.push(lang);
                                    }
                                }
                            }
                        }
                    } else {
                        if (item.values) {
                            for (const lang of Object.keys(item.values)) {
                                if (!codes.includes(lang)) {
                                    codes.push(lang);
                                }
                            }
                        }
                    }
                }
            }
            // Check title.
            if (this.annotation.title) {
                for (const lang of Object.keys(this.annotation.title)) {
                    if (!codes.includes(lang)) {
                        codes.push(lang);
                    }
                }
            }
            return codes;
        },
        // The list of languages available in the annotation.
        languages() {
            const languages = [];
            for (const code of this.languageCodes) {
                // Find the item from this.languages that matches the code.
                const langName = Languages.getLanguageName(code);
                if (langName) {
                    languages.push({
                        code: code,
                        name: langName,
                    });
                }
            }
            return languages;
        }
    },
    watch: {
        defaultLanguage() {
            this.setLanguage();
        },
        visible(newVal) {
            this.show = newVal;
        },
        show(newVal) {
            if (newVal) {
                this.setLanguage();
                this.$emit('open');
            } else {
                this.$emit('close');
            }
        }
    },
    mounted() {
        this.show = this.visible;
        this.setLanguage();
    },
    methods: {
        /**
         * Sets the selected language based on the default language and available languages.
         */
        setLanguage() {
            if (this.languageCodes.indexOf(this.defaultLanguage) > -1) {
                this.selectedLanguage = this.defaultLanguage;
            } else if (this.languageCodes.indexOf('en') === -1) {
                this.selectedLanguage = this.languageCodes[0];
            } else {
                this.selectedLanguage = 'en';
            }
        }
    }
}
</script>
