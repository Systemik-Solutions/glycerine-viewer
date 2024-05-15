import axios from "axios";
import ManifestParser from "@/libraries/iiif/manifest-parser.js";

/**
 * Class to load a IIIF manifest.
 */
export default class ManifestLoader {

    // The manifest URL or data object.
    #manifest;

    // The manifest data.
    #data;

    // The manifest parser.
    #parser;

    // Array of error messages.
    #errors;

    // The status of the loader. It can be 'initial', 'loading', 'loaded', or 'error'.
    #status;

    /**
     * ManifestLoader constructor.
     *
     * @param {string|Object} manifest
     *   The manifest URL or data object.
     */
    constructor(manifest) {
        this.#manifest = manifest;
        this.#data = null;
        this.#parser = null;
        this.#errors = [];
        this.#status = 'initial';
    }

    /**
     * Load the manifest.
     *
     * @returns {Promise<void>}
     */
    async load() {
        this.#status = 'loading';
        if (typeof this.#manifest === "string") {
            // Load the manifest from its URL.
            try {
                const response = await axios.get(this.#manifest, {
                    withCredentials: false,
                    headers: {
                        Accept: "application/json",
                    },
                });
                this.#data = response.data;
            } catch (error) {
                this.#addError('Failed to load manifest from its URL');
            }
        } else if (typeof this.#manifest === "object") {
            this.#data = this.#manifest;
        } else {
            this.#addError('Invalid manifest data');
        }
        // Validate the manifest data.
        if (!this.hasErrors()) {
            this.#validateManifest();
        }

        if (!this.hasErrors()) {
            // Aggregate external resources.
            await this.#aggregateResources();
            // Initialize the parser.
            this.#parser = new ManifestParser(this.#data);
            this.#status = 'loaded';
        }
    }

    /**
     * Validate the manifest.
     */
    #validateManifest() {
        if (this.#data) {
            // General validation.
            if (!this.#data['@context']) {
                this.#addError('Invalid manifest: missing context');
                return;
            }
            // Validate the version.
            if (this.#data['@context'] === 'http://iiif.io/api/presentation/2/context.json') {
                this.#addError('Invalid manifest: unsupported version (v2)');
                return;
            } else if (this.#data['@context'] !== 'http://iiif.io/api/presentation/3/context.json') {
                this.#addError(`Invalid manifest: invalid context ${this.#data['@context']}`);
                return;
            }
            // Validate the type.
            if (this.#data['type'] !== 'Manifest') {
                this.#addError(`Invalid manifest: invalid type ${this.#data['type']}`);
                return;
            }
        } else {
            this.#addError('Manifest is empty');
        }
    }

    /**
     * Aggregate external resources.
     *
     * @returns {Promise<void>}
     */
    async #aggregateResources() {
        // Aggregate external annotation page.
        if (this.#data.items) {
            for (const canvas of this.#data.items) {
                if (canvas.annotations) {
                    for (let i = 0; i < canvas.annotations.length; i++) {
                        const annoPage = canvas.annotations[i];
                        if (
                            annoPage.type === 'AnnotationPage' &&
                            !annoPage.items &&
                            annoPage.id
                        ) {
                            try {
                                const response = await axios.get(annoPage.id, {
                                    withCredentials: false,
                                    headers: {
                                        Accept: "application/json",
                                    },
                                });
                                if (response.data.type === 'AnnotationPage') {
                                    canvas.annotations[i] = response.data;
                                }
                            } catch (error) {
                                // Fail silently here as it does not affect the main functionality.
                                console.error('Failed to load annotation page', annoPage.id);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Add an error message.
     *
     * @param {string} message
     *   The error message.
     */
    #addError(message) {
        this.#errors.push(message);
        this.#status = 'error';
    }

    /**
     * Check if the loader has errors.
     *
     * @returns {boolean}
     */
    hasErrors() {
        return this.#status === 'error';
    }

    /**
     * Check if the loader has loaded the manifest successfully.
     *
     * @returns {boolean}
     */
    hasLoaded() {
        return this.#status === 'loaded';
    }

    /**
     * Check if the loader is still loading the manifest.
     *
     * @returns {boolean}
     */
    isLoading() {
        return this.#status === 'loading';
    }

    /**
     * Get the manifest data.
     *
     * @returns {Object}
     */
    getData() {
        return this.#data;
    }

    /**
     * Get the manifest parser.
     *
     * @returns {ManifestParser|null}
     */
    getParser() {
        return this.#parser;
    }

    /**
     * Get the error messages.
     *
     * @returns {Array}
     */
    getErrors() {
        return this.#errors;
    }
}
