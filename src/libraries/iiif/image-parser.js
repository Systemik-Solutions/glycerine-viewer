import { ResourceParser } from "@/libraries/iiif/dependency-manager.js";

/**
 * Class to parse image resources.
 */
export class ImageParser extends ResourceParser {

    /**
     * Get the static image URL.
     *
     * @returns {string|null}
     */
    getUrl() {
        return this.getID();
    }

    /**
     * Get the image format.
     *
     * @returns {string|null}
     */
    getFormat() {
        return this.data.format ? this.data.format : null;
    }

    /**
     * Get the image width.
     *
     * @returns {int|string|null}
     */
    getWidth() {
        return this.data.width ? this.data.width : null;
    }

    /**
     * Get the image height.
     *
     * @returns {int|string|null}
     */
    getHeight() {
        return this.data.height ? this.data.height : null;
    }

    /**
     * Get the image service.
     *
     * @returns {Array|null}
     */
    getService() {
        return this.data.service ? this.data.service : null;
    }

    /**
     * Get the IIIF image base URL.
     *
     * @returns {string|null}
     */
    getIIIFUrl() {
        if (this.getService()) {
            const service = this.getService()[0];
            if (
                service['@context'] === 'http://iiif.io/api/image/2/context.json' ||
                service['@context'] === 'https://iiif.io/api/image/2/context.json' ||
                service['type'] === 'ImageService2' ||
                service['@type'] === 'ImageService2' ||
                service['type'] === 'ImageService3' ||
                service['@type'] === 'ImageService3'
            ) {
                if (typeof service.id !== 'undefined') {
                    return service.id;
                }
                if (typeof service['@id'] !== 'undefined') {
                    return service['@id'];
                }
            }
        }
        return null;
    }

    /**
     * Check if the image is IIIF.
     *
     * @returns {boolean}
     */
    isIIIF() {
        return !!this.getIIIFUrl();
    }
}
