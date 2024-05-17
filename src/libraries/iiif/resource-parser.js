import Language from "@/libraries/languages.js";
import { ResourceParserFactory, ImageParser } from "@/libraries/iiif/dependency-manager.js";

/**
 * IIIF resource parser.
 */
export class ResourceParser {

    // The resource data.
    data;

    /**
     * ResourceParser constructor.
     *
     * @param {Object} data
     *   The resource data.
     */
    constructor(data) {
        this.data = data;
    }

    /**
     * Get the resource ID.
     *
     * @returns {string|null}
     */
    getID() {
        return this.data.id ? this.data.id : null;
    }

    /**
     * Get the resource type.
     *
     * @returns {string|null}
     */
    getType() {
        return this.data.type ? this.data.type : null;
    }

    /**
     * Get the resource label.
     *
     * @returns {string|null}
     */
    getPrefLabel() {
        return this.data.label ? ResourceParser.displayLangPropertyAuto(this.data.label) : null;
    }

    /**
     * Get the resource summary.
     *
     * @returns {string|null}
     */
    getSummary() {
        return this.data.summary ? ResourceParser.displayLangPropertyAuto(this.data.summary) : null;
    }

    /**
     * Get the required statement.
     *
     * @returns {null|{label: string, value: string}}
     */
    getRequiredStatement() {
        if (this.data.requiredStatement && this.data.requiredStatement.label && this.data.requiredStatement.value) {
            return {
                label: ResourceParser.displayLangPropertyAuto(this.data.requiredStatement.label),
                value: ResourceParser.displayLangPropertyAuto(this.data.requiredStatement.value),
            };
        }
        return null;
    }

    /**
     * Get the rights.
     *
     * @returns {string|null}
     */
    getRights() {
        return this.data.rights ? this.data.rights : null;
    }

    /**
     * Get the resource metadata.
     *
     * @returns {{label: string, value: string}[]|null}
     *   A list of objects with `label` and `value` properties.
     */
    getMetadata() {
        const metadata = [];
        if (this.data.metadata) {
            for (const meta of this.data.metadata) {
                const label = ResourceParser.displayLangPropertyAuto(meta.label);
                const value = ResourceParser.displayLangPropertyAuto(meta.value);
                metadata.push({ label, value });
            }
        }
        return (metadata.length > 0) ? metadata : null;
    }

    /**
     * Get the metadata value by label.
     *
     * @param {string} label
     *   The metadata label.
     * @param {boolean} matchLanguage
     *   Whether to return the metadata value matching the metadata label language. If false, the metadata value
     *   of all languages will be combined.
     * @returns {string|null|string[]}
     */
    getMetadataValue(label, matchLanguage = true) {
        if (this.data.metadata) {
            for (const metadata of this.data.metadata) {
                const labelData = metadata.label;
                let metaLangCode = null;
                for (const langCode in labelData) {
                    if (labelData[langCode].indexOf(label) >= 0) {
                        metaLangCode = langCode;
                        break;
                    }
                }
                if (metaLangCode) {
                    if (matchLanguage) {
                        if (metadata.value[metaLangCode]) {
                            return metadata.value[metaLangCode].join('; ');
                        }
                    } else {
                        return ResourceParser.displayLangPropertyCombined(metadata.value);
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the thumbnail URL.
     *
     * @param {number} width
     *   The thumbnail width. Only used for IIIF images.
     * @returns {null|string}
     *   The thumbnail URL.
     */
    getThumbnail(width = 80) {
        return this.getImagePropertyValue('thumbnail', width);
    }

    /**
     * Get the URL of an image type property such as "logo" and "thumbnail".
     *
     * @param {string} propName
     *   The property name.
     * @param {number} width
     *   The image width. Only used for IIIF images.
     * @returns {null|string}
     *   The image URL.
     */
    getImagePropertyValue(propName, width = 80) {
        if (this.data[propName]) {
            for (const image of this.data[propName]) {
                const imageParser = ResourceParserFactory.create(image);
                if (imageParser instanceof ImageParser) {
                    if (imageParser.isIIIF()) {
                        // Use the IIIF image service and set the width.
                        return `${imageParser.getIIIFUrl()}/full/${width},/0/default.jpg`
                    } else {
                        // Use the static image URL.
                        return imageParser.getUrl();
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the list of renderings.
     *
     * @returns {null|{label: string, value: string, format: string, type: string}[]}
     *   A list of rendering objects.
     */
    getRendering() {
        return this.#getLinkingPropertyValue('rendering', 'Alternative Representation');
    }

    /**
     * Get the list of homepages.
     *
     * @returns {null|{label: string, value: string, format: string, type: string}[]}
     *   A list of homepage objects.
     */
    getHomePage() {
        return this.#getLinkingPropertyValue('homepage', 'Homepage');
    }

    /**
     * Get the list of see also links.
     *
     * @returns {{label: string, value: string, format: string, type: string}[]|null}
     *   A list of see also objects.
     */
    getSeeAlsoLinks() {
        return this.#getLinkingPropertyValue('seeAlso', 'See Also');
    }

    /**
     * Get the value of a linking property such as "seeAlso", "rendering", "homepage".
     *
     * @param {string} propName
     *   The property name.
     * @param {string} defaultLabel
     *   The default label if the value has no label.
     *
     * @returns {null|{label: string, value: string, format: string, type: string}[]}
     *   A list of value objects.
     */
    #getLinkingPropertyValue(propName, defaultLabel) {
        if (this.data[propName]) {
            const items = [];
            for (const value of this.data[propName]) {
                let label = null;
                if (value.label) {
                    label = ResourceParser.displayLangPropertyAuto(value.label);
                }
                const item = {
                    label: label ?? defaultLabel,
                    value: value.id,
                };
                if (value.format) {
                    item.format = value.format;
                }
                if (value.type) {
                    item.type = value.type;
                }
                items.push(item);
            }
            return items;
        }
        return null;
    }

    /**
     * Get the list of providers.
     *
     * @returns {Array|null}
     *   The list of providers.
     */
    getProvider() {
        return this.data.provider ? this.data.provider : null;
    }

    /**
     * Get the value display for a multi-language property value.
     *
     * @param {Object} propValue
     *   The property value object.
     * @param {string} langCode
     *   The language code of the value.
     * @returns {string|null}
     */
    static displayLangProperty(propValue, langCode) {
        return propValue[langCode] ? propValue[langCode].join('; ') : null;
    }

    /**
     * Get the combined value display for a multi-language property value.
     *
     * @param {Object} propValue
     *   The property value object.
     * @param {boolean} showLangName
     *   Whether to show the language name in the value display.
     * @returns {string[]}
     *   The combined value display which is an array of value display for each language.
     */
    static displayLangPropertyCombined(propValue, showLangName = true) {
        const display = [];
        for (const langCode in propValue) {
            let langName = Language.getLanguageName(langCode);
            if (!langName) {
                langName = 'Unknown Language';
            }
            let displayItem = showLangName ? `(${langName}) ` : '';
            displayItem += propValue[langCode].join('; ');
            display.push(displayItem);
        }
        return display;
    }

    /**
     * Get the value display for a multi-language property using the automatic language selection.
     *
     * @param {Object} propValue
     *   The property value object.
     * @param {string|null} prefLangCode
     *   The preferred language code.
     * @returns {string|null}
     */
    static displayLangPropertyAuto(propValue, prefLangCode = null) {
        const processLanguages = [];
        if (prefLangCode) {
            processLanguages.push(prefLangCode);
        }
        processLanguages.push('en');
        processLanguages.push('none');
        for (const langCode of processLanguages) {
            const prefLangValue = this.displayLangProperty(propValue, langCode);
            if (prefLangValue) {
                return prefLangValue;
            }
        }
        // Use the first language value as a fallback.
        return this.displayLangProperty(propValue, Object.keys(propValue)[0]);
    }
}
