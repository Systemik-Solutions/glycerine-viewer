import axios from "axios";

export class TemplateManager {

    // Store the loaded templates keyed by their URIs.
    static #templates = {};

    /**
     * Load a template from a given URL and store it.
     *
     * @param {string} url
     * @returns {Promise<boolean>}
     */
    static async loadTemplate(url) {
        try {
            const response = await axios.get(url, {
                withCredentials: false,
                headers: {
                    Accept: "application/json",
                },
            });
            this.#templates[url] = response.data;
            return true;
        } catch (error) {
            console.error(`Failed to load template from ${url}:`, error);
            return false;
        }
    }

    /**
     * Add a template directly by its data.
     *
     * @param {Object} template
     */
    static addTemplate(template) {
        this.#templates[template.id] = template;
    }

    /**
     * Check if a template with the given ID exists.
     *
     * @param {string} id
     *   The URI of the template.
     * @returns {boolean}
     */
    static hasTemplate(id) {
        return id in this.#templates;
    }

    /**
     * Get a template by its ID.
     *
     * @param {string} id
     *   The URI of the template.
     * @returns {Object|undefined}
     */
    static getTemplate(id) {
        return this.#templates[id];
    }

    /**
     * Get all loaded templates.
     *
     * @returns {Array}
     */
    static getAllTemplates() {
        return Object.values(this.#templates);
    }

    /**
     * Clear all loaded templates.
     */
    static clear() {
        this.#templates = {};
    }

}
