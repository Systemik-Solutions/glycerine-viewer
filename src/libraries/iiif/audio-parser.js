import { ResourceParser } from "@/libraries/iiif/dependency-manager.js";

/**
 * Class to parse audio resources.
 */
export class AudioParser extends ResourceParser {

    /**
     * Get the audio URL.
     *
     * @returns {string|null}
     */
    getUrl() {
        return this.getID();
    }

    /**
     * Get the audio format.
     *
     * @returns {string|null}
     */
    getFormat() {
        return this.data.format ? this.data.format : null;
    }

    /**
     * Get the audio duration.
     *
     * @returns {number|null}
     */
    getDuration() {
        return this.data.duration ? this.data.duration : null;
    }
}