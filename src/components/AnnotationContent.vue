<template>
    <div class="gv-annotation-content" v-if="validTabs.length > 0">
        <TabView>
            <template v-for="item in tabContent">
                <TabPanel :header="item.label">
                    <template v-for="child in item.items">
                        <AnnotationElement :element="child" :language="language" />
                    </template>
                </TabPanel>
            </template>
            <TabPanel v-if="tags" :header="$t('ui.tags')">
                <AnnotationElement :element="tags" :language="language" />
            </TabPanel>
        </TabView>
    </div>
    <div class="gv-annotation-content" v-else>
        <template v-for="item in content">
            <AnnotationElement :element="item" :language="language" />
        </template>
    </div>
</template>

<script>

import TermTagGroup from "@/components/TermTagGroup.vue";
import AnnotationElement from "@/components/AnnotationElement.vue";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import Dropdown from "primevue/dropdown";

export default {
    name: "AnnotationContent",
    components: {TermTagGroup, TabView, TabPanel, Dropdown, AnnotationElement},
    props: {
        // The renderable content of the annotation. See `AnnotationParser` for the structure.
        content: {
            type: Array,
            required: true
        },
        // The default language to use.
        language: {
            type: String,
            default: 'en'
        }
    },
    computed: {
        // Whether the content has tabs.
        hasTabs() {
            return this.content.length > 0 && this.content[0].type === 'tab';
        },
        // The valid tabs that have content to display.
        validTabs() {
            const tabNames = [];
            if (this.hasTabs) {
                for (const tab of this.content) {
                    if (tab.items && tab.items.length > 0) {
                        for (const item of tab.items) {
                            if (item.type === 'field' && item.field.hidden) {
                                continue;
                            }
                            if (item.values?.[this.language]) {
                                tabNames.push(tab.label);
                                break;
                            }
                        }
                    }
                }
            }
            return tabNames;
        },
        // The valid tab content.
        tabContent() {
            const content = [];
            if (this.hasTabs) {
                for (const tab of this.content) {
                    if (this.validTabs.includes(tab.label)) {
                        content.push(tab);
                    }
                }
            }
            return content;
        },
        // The tag element, if any.
        tags() {
            for (const item of this.content) {
                if (item.type === 'tag') {
                    return item;
                }
            }
            return null;
        }
    }
}
</script>

