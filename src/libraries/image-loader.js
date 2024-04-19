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
     * @param {string|number|null} width
     *   The width of the image. If not specified, the max size will be used.
     */
    constructor(image, width = null) {
        let size = 'max';
        if (width) {
            size = `${width},`;
        }
        this.#iiifSize = size;
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
        const imageURL = `${this.#image}/full/${this.#iiifSize}/0/default.jpg`;
        // Get the original image width from info.json.
        const infoURL = `${this.#image}/info.json`;
        const info = await axios.get(infoURL);
        const imageWidth = info.data.width;
        this.#imageElement = new Image();
        this.#imageElement.crossOrigin="anonymous";
        this.#imageElement.src = imageURL;
        await this.#imageElement.decode();
        this.#ratio = this.#imageElement.width / imageWidth;
        this.#loaded = true;
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
