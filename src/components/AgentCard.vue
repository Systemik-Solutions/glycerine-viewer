<template>
    <Panel v-if="label" :header="label" toggleable collapsed>
        <img class="w-full mb-3" v-if="logo" :src="logo" :alt="label" />
        <div v-if="homepage">
            <div class="mb-2" v-for="link in homepage">
                <a :href="link.value" target="_blank">{{ link.label }}</a>
            </div>
        </div>
        <div v-if="seeAlso">
            <div class="mb-2" v-for="link in seeAlso">
                <a :href="link.value" target="_blank">{{ link.label }}</a>
            </div>
        </div>
    </Panel>
</template>

<script>
import { ResourceParserFactory } from "@/libraries/iiif/dependency-manager.js";
import {toRaw} from "vue";
import Panel from 'primevue/panel';

export default {
    name: "AgentCard",
    components: {
        Panel
    },
    props: {
        // The agent resource object from the IIIF manifest.
        agent: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            // The agent's name.
            label: null,
            // The agent's homepage.
            homepage: null,
            // The agent's logo URL.
            logo: null,
            // List of see also links.
            seeAlso: null,
        }
    },
    mounted() {
        // Load the agent information.
        this.loadAgentInfo();
    },
    methods: {
        /**
         * Load the agent information.
         */
        loadAgentInfo() {
            const parser = ResourceParserFactory.create(toRaw(this.agent));
            this.label = parser.getPrefLabel();
            this.homepage = parser.getHomePage();
            this.logo = parser.getLogo(300);
            this.seeAlso = parser.getSeeAlsoLinks();
        }
    }
}
</script>
