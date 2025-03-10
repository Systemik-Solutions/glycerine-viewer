<template>
    <div v-if="resourceInfo.link" class="gv-field">
        <div class="gv-field-label">{{ resourceInfo.link.text }}</div>
        <div class="gv-field-value">
            <a target="_blank" :href="resourceInfo.link.url">{{ resourceInfo.link.url }}</a>
        </div>
    </div>
    <div v-if="resourceInfo.summary" class="gv-field">
        <div class="gv-field-label">{{ $t('ui.summary') }}</div>
        <div class="gv-field-value">
            <div v-if="HtmlUtility.detectHtml(resourceInfo.summary)"
                 v-html="HtmlUtility.sanitizeHtml(resourceInfo.summary)">
            </div>
            <template v-else>
                {{ resourceInfo.summary }}
            </template>
        </div>
    </div>
    <div v-if="resourceInfo.requiredStatement" class="gv-field">
        <div class="gv-field-label">{{ resourceInfo.requiredStatement.label }}</div>
        <div class="gv-field-value">
            <div v-if="HtmlUtility.detectHtml(resourceInfo.requiredStatement.value)"
                 v-html="HtmlUtility.sanitizeHtml(resourceInfo.requiredStatement.value)">
            </div>
            <template v-else>
                {{ resourceInfo.requiredStatement.value }}
            </template>
        </div>
    </div>
    <div v-if="resourceInfo.rights" class="gv-field">
        <div class="gv-field-label">{{ $t('ui.rights') }}</div>
        <div class="gv-field-value">
            <template v-if="Helper.isURL(resourceInfo.rights)">
                <a :href="resourceInfo.rights">{{ resourceInfo.rights }}</a>
            </template>
            <template v-else>
                {{ resourceInfo.rights }}
            </template>
        </div>
    </div>
    <template v-if="resourceInfo.metadata">
        <div class="gv-field" v-for="metadata in resourceInfo.metadata">
            <div class="gv-field-label">{{ metadata.label }}</div>
            <div class="gv-field-value">
                <div v-if="HtmlUtility.detectHtml(metadata.value)"
                     v-html="HtmlUtility.sanitizeHtml(metadata.value)">
                </div>
                <template v-else>
                    {{ metadata.value }}
                </template>
            </div>
        </div>
    </template>
    <div v-if="resourceInfo.rendering" class="gv-field">
        <div class="gv-field-label">{{ $t('ui.altRepresentation') }}</div>
        <div class="gv-field-value">
            <div v-for="rendering in resourceInfo.rendering">
                <a target="_blank" :href="rendering.value">{{ rendering.label }}</a>
            </div>
        </div>
    </div>
    <div v-if="resourceInfo.homepage" class="gv-field">
        <div class="gv-field-label">{{ $t('ui.homepage') }}</div>
        <div class="gv-field-value">
            <div v-for="homepage in resourceInfo.homepage">
                <a target="_blank" :href="homepage.value">{{ homepage.label }}</a>
            </div>
        </div>
    </div>
    <div v-if="resourceInfo.seeAlso" class="gv-field">
        <div class="gv-field-label">{{ $t('ui.seeAlso') }}</div>
        <div class="gv-field-value">
            <div v-for="seeAlsoLink in resourceInfo.seeAlso">
                <a target="_blank" :href="seeAlsoLink.value">{{ seeAlsoLink.label }}</a>
            </div>
        </div>
    </div>
    <div v-if="resourceInfo.provider" class="gv-field">
        <div class="gv-field-label mb-1">{{ $t('ui.provider') }}</div>
        <div class="gv-field-value">
            <div v-for="provider in resourceInfo.provider" class="mb-3">
                <AgentCard class="w-full" :agent="provider"></AgentCard>
            </div>
        </div>
    </div>
</template>

<script>
import HtmlUtility from "@/libraries/html-utility.js";
import Helper from "@/libraries/helper.js";
import AgentCard from "@/components/AgentCard.vue";

export default {
    name: "ResourceInfoDetails",
    components: {
        AgentCard
    },
    props: {
        // The information about the resource to display.
        resourceInfo: {
            type: Object,
            required: true
        },
    },
    setup() {
        return {
            HtmlUtility,
            Helper,
        }
    }
}
</script>


