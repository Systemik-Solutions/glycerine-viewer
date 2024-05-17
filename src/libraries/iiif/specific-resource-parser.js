import { ResourceParser } from "@/libraries/iiif/dependency-manager.js";

/**
 * Class to parse specific resources.
 */
export class SpecificResourceParser extends ResourceParser {

    /**
     * Get the source.
     *
     * @returns {*|null}
     */
    getSource() {
        return this.data.source ? this.data.source : null;
    }

    /**
     * Get the selector.
     *
     * @returns {*|null}
     */
    getSelector() {
        return this.data.selector ? this.data.selector : null;
    }
}
