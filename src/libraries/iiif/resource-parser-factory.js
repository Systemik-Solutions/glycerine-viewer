import ResourceParser from "@/libraries/iiif/resource-parser.js";
import ManifestParser from "@/libraries/iiif/manifest-parser.js";
import ImageParser from "@/libraries/iiif/image-parser.js";
import SpecificResourceParser from "@/libraries/iiif/specific-resource-parser.js";

/**
 * Factory class to create a parser instance.
 */
export default class ResourceParserFactory {

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
