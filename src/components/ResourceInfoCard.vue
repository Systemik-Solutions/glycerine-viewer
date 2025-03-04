<template>
<div class="w-full mb-6">
    <h3 v-if="cardTitle"><i :class="`pi pi-${titleIcon}`"></i> {{ cardTitle }}</h3>
    <h4 v-if="resourceInfo.label">{{ resourceInfo.label }}</h4>
    <Panel v-if="toggleable" :header="$t('ui.details')" :toggleable="toggleable" :collapsed="collapsed">
        <ResourceInfoDetails :resource-info="resourceInfo"></ResourceInfoDetails>
    </Panel>
    <ResourceInfoDetails v-else :resource-info="resourceInfo"></ResourceInfoDetails>
</div>
</template>

<script>
import Panel from 'primevue/panel';
import ResourceInfoDetails from "@/components/ResourceInfoDetails.vue";

export default {
    name: "ResourceInfoCard",
    components: { Panel, ResourceInfoDetails },
    props: {
        // The information about the resource to display.
        resourceInfo: {
            type: Object,
            required: true
        },
        // The title of the card.
        cardTitle: {
            type: String
        },
        // The icon to display next to the title.
        titleIcon: {
            type: String,
            default: "info-circle"
        },
        // Whether the information can be expanded or collapsed.
        toggleable: {
            type: Boolean,
            default: false
        },
        // Whether the information is initially collapsed.
        collapsed: {
            type: Boolean,
            default: false
        }
    },
}
</script>
