import { ResourceParser } from "@/libraries/iiif/dependency-manager.js";

export class AgentParser extends ResourceParser {

    /**
     * Get the logo of the agent.
     *
     * @param {number} width
     *   The width of the logo. Only used for IIIF images.
     * @returns {string|null}
     *   The logo URL.
     */
    getLogo(width = 80) {
        return this.getImagePropertyValue('logo', width);
    }
}
