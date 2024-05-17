import { ResourceParser, ManifestParser, ImageParser, SpecificResourceParser } from "@/libraries/iiif/dependency-manager.js";

/**
 * Factory class to create a parser instance.
 */
export class ResourceParserFactory {

    /**
     * Factory method to create a parser instance.
     *
     * @param {Object} data
     *   The resource data.
     * @returns {ResourceParser}
     */
    static create(data) {
        switch (data.type) {
            case 'Manifest':
                return new ManifestParser(data);
            case 'Image':
                return new ImageParser(data);
            case 'SpecificResource':
                return new SpecificResourceParser(data);
            default:
                return new ResourceParser(data);
        }
    }
}
