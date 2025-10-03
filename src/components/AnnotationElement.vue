<template>
    <div v-if="hasData" class="gv-field">
        <template v-if="element.type === 'field'">
            <div class="gv-field-label" v-if="!element.field.hideLabel">{{ element.field.name }}</div>
            <div v-for="value in element.values[language]" class="gv-field-value">
                <div v-if="element.field.format === 'link'">
                    <a :href="value.url" target="_blank">{{ value.text }}</a>
                </div>
                <div v-else-if="element.field.allowHtml" v-html="HtmlUtility.sanitizeRichHtml(value.value)"></div>
                <div v-else-if="value.format === 'text/html'" v-html="HtmlUtility.sanitizeHtml(value.value)"></div>
                <div v-else-if="element.field.format === 'long_text'" v-html="HtmlUtility.sanitizeHtml(HtmlUtility.nl2br(value.value))"></div>
                <template v-else>
                    {{ value.value }}
                </template>
            </div>
        </template>
        <template v-else-if="element.type === 'generic'">
            <div v-for="value in element.values[language]" class="gv-field-value">
                <div v-if="value.format === 'text/html'" v-html="HtmlUtility.sanitizeHtml(value.value)"></div>
                <template v-else>
                    {{ value.value }}
                </template>
            </div>
        </template>
        <template v-else-if="element.type === 'tag'">
            <TermTagGroup :terms="terms" read-only />
        </template>
    </div>
</template>

<script>
import TermTagGroup from "@/components/TermTagGroup.vue";
import HtmlUtility from "@/libraries/html-utility.js";
import Helper from "@/libraries/helper.js";

export default {
    name: "AnnotationElement",
    components: {TermTagGroup},
    props: {
        // The renderable element data. See `AnnotationParser` for the structure.
        element: {
            type: Object,
            required: true
        },
        // The display language.
        language: {
            type: String,
            default: 'en'
        }
    },
    computed: {
        // Whether the element has data to display.
        hasData() {
            if (this.element.field && this.element.field.hidden) {
                return false;
            }
            if (this.element.type === 'tag' && this.element.values && Object.keys(this.element.values).length > 0) {
                return true;
            } else {
                return this.element.values && this.element.values[this.language] && this.element.values[this.language].length > 0;
            }
        },
        // The terms for tag elements.
        terms() {
            const terms = [];
            if (this.element.type === 'tag' && this.element.values) {
                for (const lang in this.element.values) {
                    for (const value of this.element.values[lang]) {
                        const term = {
                            label: value.term_label,
                            data: {},
                        }
                        if (value.term_id) {
                            term.key = value.term_id;
                        } else {
                            term.key = Helper.generateUUID();
                        }
                        if (value.vocabulary_name) {
                            term.data.vocabTitle = value.vocabulary_name;
                        }
                        if (value.vocabulary_id) {
                            term.data.vocabID = value.vocabulary_id;
                        }
                        if (value.trace) {
                            term.data.trace = value.trace;
                        }
                        if (value.description) {
                            term.data.description = value.description;
                        }
                        if (value.data?.link) {
                            term.data.link = value.data.link;
                        }
                        terms.push(term);
                    }
                }
            }
            return terms;
        }
    },
    setup() {
        return {
            HtmlUtility,
        }
    }
}
</script>
