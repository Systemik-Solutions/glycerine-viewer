import ResourceParser from "@/libraries/iiif/resource-parser.js";

/**
 * Class to parse specific resources.
 */
export default class SpecificResourceParser extends ResourceParser {

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
