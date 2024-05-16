<template>
<div class="w-full mb-6">
    <h3 v-if="cardTitle"><i class="pi pi-info-circle"></i> {{ cardTitle }}</h3>
    <h4 v-if="resourceInfo.label">{{ resourceInfo.label }}</h4>
    <div v-if="resourceInfo.link" class="gv-field">
        <div class="gv-field-label">{{ resourceInfo.link.text }}</div>
        <div class="gv-field-value">
            <a target="_blank" :href="resourceInfo.link.url">{{ resourceInfo.link.url }}</a>
        </div>
    </div>
    <div v-if="resourceInfo.summary" class="gv-field">
        <div class="gv-field-label">Summary</div>
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
        <div class="gv-field-label">Rights</div>
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
        <div class="gv-field-label">Alternative Representation</div>
        <div class="gv-field-value">
            <div v-for="rendering in resourceInfo.rendering">
                <a target="_blank" :href="rendering.value">{{ rendering.label }}</a>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import HtmlUtility from "@/libraries/html-utility.js";
import Helper from "@/libraries/helper.js";

export default {
    name: "ResourceInfoCard",
    props: {
        // The information about the resource to display.
        resourceInfo: {
            type: Object,
            required: true
        },
        // The title of the card.
        cardTitle: {
            type: String
        }
    },
    setup() {
        return {
            HtmlUtility,
            Helper,
        }
    }
}
</script>