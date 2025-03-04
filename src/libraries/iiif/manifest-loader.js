import axios from "axios";
import { ResourceParserFactory, ManifestParser, IiifHelper } from "@/libraries/iiif/dependency-manager.js";
import { convertPresentation2  } from '@iiif/parser/presentation-2';

/**
 * Class to load a IIIF manifest.
 */
export class ManifestLoader {

    // The manifest URL or data object.
    #manifest;

    // The IIIF Presentation API version. e.g, '2.0', '3.0'.
    #version;

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
            // Normalize the manifest.
            this.#normalizeManifest();
            // Initialize the parser.
            this.#parser = ResourceParserFactory.create(this.#data);
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
            const version = IiifHelper.detectPresentationApiVersion(this.#data);
            if (!version) {
                this.#addError('Invalid manifest: unsupported version');
                return;
            } else {
                this.#version = version;
            }

            // Converts the v2 manifest to v3.
            if (version === '2.0') {
                try {
                    this.#data = convertPresentation2(this.#data);
                } catch (error) {
                    this.#addError('Invalid manifest: failed to parse the legacy v2 format');
                    return;
                }
            }

            // Validate the type.
            if (this.#data['type'] !== 'Manifest' && this.#data['type'] !== 'Collection') {
                this.#addError(`Invalid manifest: invalid type ${this.#data['type']}`);
                return;
            }

            // Validate the collection.
            if (this.#data['type'] === 'Collection') {
                if (!this.#data.items || this.#data.items.length === 0) {
                    this.#addError('Invalid manifest: the collection is empty');
                    return;
                }
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
                                // Convert to V3 format.
                                if (this.#version === '2.0') {
                                    response.data = convertPresentation2(response.data);
                                }
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
     * Normalize the manifest.
     *
     * This method is used to normalize the manifest data. Especially, after a v2 manifest is converted to v3, some
     * remediation is needed to make it compatible with the v3 format.
     */
    #normalizeManifest() {
        if (this.#version === '2.0') {
            // Normalize the annotations.
            if (this.#data.type === 'Manifest' && this.#data.items) {
                this.#data.items.forEach((canvas) => {
                    if (canvas.annotations) {
                        canvas.annotations.forEach((annotationPage) => {
                            if (annotationPage.type === 'AnnotationPage' && annotationPage.items) {
                                annotationPage.items.forEach((annotation) => {
                                    if (annotation.type === 'Annotation') {
                                        // Only use a single motivation.
                                        if (annotation.motivation && Array.isArray(annotation.motivation)) {
                                            annotation.motivation = annotation.motivation[0];
                                        }
                                        if (annotation.body) {
                                            annotation.body.forEach((body) => {
                                                if (body.type === 'Text' && body.chars) {
                                                    // Convert the body to a TextualBody.
                                                    body.type = 'TextualBody';
                                                    body.value = body.chars;
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
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

    /**
     * Check if the manifest is a collection.
     *
     * @returns {boolean}
     */
    isCollection() {
        return this.#data && this.#data.type === 'Collection';
    }
}
