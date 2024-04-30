import axios from "axios";

/**
 * Class of image loader.
 */
export default class ImageLoader {

    /**
     * The IIIF size string.
     */
    #iiifSize;

    /**
     * Whether the image is IIIF.
     */
    #isIiif;

    /**
     * The image base URL.
     */
    #image;

    /**
     * Whether the image has been loaded.
     */
    #loaded;

    /**
     * The HTML image element.
     */
    #imageElement;

    /**
     * The ratio of the loaded image to the original image.
     */
    #ratio;

    /**
     * ImageLoader constructor.
     *
     * @param {string} image
     *   The image base URL.
     * @param {boolean} isIiif
     *   Whether the image is an IIIF image.
     * @param {string|number|null} width
     *   The width of the image. If not specified, the max size will be used. Only relevant for IIIF images.
     */
    constructor(image, width = null, isIiif = true) {
        this.#isIiif = isIiif;
        if (isIiif) {
            let size = 'max';
            if (width) {
                size = `${width},`;
            }
            this.#iiifSize = size;
        }
        this.#image = image;
        this.#loaded = false;
    }

    /**
     * Load the image.
     */
    async load() {
        if (this.#loaded) {
            return;
        }
        let imageURL;
        let imageWidth;
        if (this.#isIiif) {
            imageURL = `${this.#image}/full/${this.#iiifSize}/0/default.jpg`;
            // Get the original image width from info.json.
            const infoURL = `${this.#image}/info.json`;
            const info = await axios.get(infoURL);
            imageWidth = info.data.width;
        } else {
            imageURL = this.#image;
        }
        try {
            this.#imageElement = new Image();
            this.#imageElement.crossOrigin="anonymous";
            this.#imageElement.src = imageURL;
            await this.#imageElement.decode();
            if (this.#isIiif) {
                this.#ratio = this.#imageElement.width / imageWidth;
            } else {
                this.#ratio = 1;
            }
            this.#loaded = true;
        } catch (error) {
            // If the image is not CORS-enabled, the error will be caught here.
            console.error(error);
        }
    }

    /**
     * Get the image element.
     *
     * @returns {HTMLElement}
     */
    getImageElement() {
        return this.#imageElement;
    }

    /**
     * Get the ratio of the loaded image to the original image.
     *
     * @returns {number}
     */
    getRatio() {
        return this.#ratio;
    }

    /**
     * Whether the image has been loaded.
     *
     * @returns {boolean}
     */
    hasLoaded() {
        return this.#loaded;
    }
}
