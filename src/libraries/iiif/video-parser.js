import { AudioParser } from "@/libraries/iiif/dependency-manager.js";

/**
 * Class to parse video resources.
 */
export class VideoParser extends AudioParser {

    /**
     * Get the video width.
     *
     * @returns {int|string|null}
     */
    getWidth() {
        return this.data.width ? this.data.width : null;
    }

    /**
     * Get the video height.
     *
     * @returns {int|string|null}
     */
    getHeight() {
        return this.data.height ? this.data.height : null;
    }
}
