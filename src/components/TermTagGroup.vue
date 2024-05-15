<template>
    <div>
        <div v-if="terms && terms.length > 0" class="term-tag-group flex flex-wrap gap-2">
            <div v-for="term in terms" :key="term.key" class="p-chip p-component"
                 :class="{active:activeTerm && (activeTerm.key === term.key)}" :aria-label="term.label">
                <div class="p-chip-text" @click="selectTerm(term)">{{ term.label }}</div>
                <span v-if="!readOnly" tabindex="0" class="p-chip-remove-icon pi pi-times-circle"
                      @click="removeTag(term)"></span>
            </div>
        </div>
        <div v-if="activeTerm && activeTerm.data && (activeTerm.data.vocabTitle || activeTerm.data.trace)"
             class="text-sm flex flex-wrap gap-2 mt-4">
            <span>{{ activeTerm.data.vocabTitle }}</span>
            <template v-if="activeTerm.data.trace">
                <template v-for="parentTerm in activeTerm.data.trace">
                    <span>&gt;</span>
                    <span>{{ parentTerm.label }}</span>
                </template>
            </template>
            <span>&gt;</span>
            <span>{{ activeTerm.label }}</span>
        </div>
        <div v-if="activeTerm && activeTerm.data?.description" class="mt-5">
            {{ activeTerm.data.description }}
        </div>
        <div v-if="activeTermUrl" class="text-sm mt-5">
            <a :href="activeTermUrl" target="_blank">Tag Details</a>
        </div>
    </div>
</template>

<script>
import Helper from "@/libraries/helper.js";

export default {
    name: "TermTagGroup",
    props: {
        // Array of terms.
        terms: {
            type: Array,
            required: true,
        },
        // Whether the component is read only.
        readOnly: {
            type: Boolean,
            default: false,
        }
    },
    emits: [
        // Fired when the close button on a tag is clicked. Accepts the term as the parameter.
        'tagRemove'
    ],
    data() {
        return {
            // The currently selected term.
            activeTerm: null,
        }
    },
    computed: {
        // The URL of the active term.
        activeTermUrl() {
            if (this.activeTerm) {
                if (this.activeTerm.data?.link) {
                    // Use the term link.
                    return this.activeTerm.data.link;
                }
                if (Helper.isURL(this.activeTerm.key)) {
                    // Use the term ID if it is a URI.
                    return this.activeTerm.key;
                }
            }
            return null;
        }
    },
    methods: {
        /**
         * Selects a term.
         *
         * @param {Object} term
         */
        selectTerm(term) {
            if (this.activeTerm && this.activeTerm.key === term.key) {
                this.activeTerm = null;
            } else {
                this.activeTerm = term;
            }
        },
        /**
         * Removes a tag.
         *
         * @param {Object} term
         */
        removeTag(term) {
            this.activeTerm = null;
            this.$emit('tagRemove', term);
        }
    }
}
</script>

<style scoped>
.term-tag-group .p-chip.active {
    background-color: var(--surface-500);
}

.term-tag-group .p-chip .p-chip-text {
    cursor: pointer;
}
</style>
