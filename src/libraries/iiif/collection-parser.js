import { ResourceParser } from "@/libraries/iiif/dependency-manager.js";

export class CollectionParser extends ResourceParser {

    /**
     * Get the items from the collection.
     *
     * @returns {Array|null}
     *   The list of items.
     */
    getItems() {
        return this.data.items ? this.data.items : null;
    }
}
