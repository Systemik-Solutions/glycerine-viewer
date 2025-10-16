import {ResourceParser, ResourceParserFactory, TemplateManager} from "@/libraries/iiif/dependency-manager.js";
import Helper from "@/libraries/helper.js";

export class AnnotationParser extends ResourceParser {

    // The template data associated with the annotation.
    #template;

    /**
     * Constructor of the AnnotationParser class.
     *
     * @param {Object} data
     *   The IIIF annotation data.
     */
    constructor(data) {
        super(data);
        if (data.generator && TemplateManager.hasTemplate(data.generator)) {
            this.#template = TemplateManager.getTemplate(data.generator);
        } else {
            this.#template = null;
        }
    }

    /**
     * Check if the annotation has a template associated.
     *
     * @returns {boolean}
     */
    hasTemplate() {
        return this.#template !== null;
    }

    /**
     * Get the template data.
     *
     * @returns {*}
     */
    getTemplate() {
        return this.#template;
    }

    /**
     * Get the template name.
     *
     * @returns {string|null}
     */
    getTemplateName() {
        if (this.hasTemplate()) {
            return this.#template.name || null;
        }
        return null;
    }

    /**
     * Find the field definition by its ID.
     *
     * @param {string} id
     *   The URI of the field.
     * @returns {null|Object}
     */
    findFieldDefinition(id) {
        if (this.hasTemplate()) {
            for (const field of this.#template.definedField) {
                if (field.id === id) {
                    return field;
                }
            }
        }
        return null;
    }

    /**
     * Find the field definition by its label.
     *
     * @param {string} label
     *   The label of the field.
     * @returns {null|Object}
     */
    findFieldDefinitionByLabel(label) {
        if (this.hasTemplate()) {
            for (const field of this.#template.definedField) {
                if (field.name === label) {
                    return field;
                }
            }
        }
        return null;
    }

    /**
     * Get the line color of the annotation.
     *
     * @returns {null|string}
     *   The line color in hex format (e.g. #ff0000) or null if not defined.
     */
    getLineColor() {
        if (this.data.target?.styleClass) {
            if (Array.isArray(this.data.target?.styleClass)) {
                for (let className of this.data.target.styleClass) {
                    if (className.startsWith('line-color-')) {
                        return '#' + className.replace('line-color-', '');
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the line weight of the annotation.
     *
     * @returns {string|null}
     */
    getLineWeight() {
        if (this.data.target?.styleClass) {
            if (Array.isArray(this.data.target?.styleClass)) {
                for (let className of this.data.target.styleClass) {
                    if (className.startsWith('line-weight-')) {
                        return className.replace('line-weight-', '');
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the title of the annotation based on the title mask defined in the template.
     *
     * @returns {Object|null}
     *   The title object with language codes as keys and title strings as values, or null if no title mask is defined.
     */
    getTitle() {
        if (this.hasTemplate() && this.#template?.settings?.titleMask) {
            const title = {};
            let titleMask = this.#template.settings.titleMask;
            // Find the placeholders {field_name} in the title mask and replace them with the corresponding field values.
            const body = this.parseBody();
            const regex = /\{([^\}]+)\}/g;
            let match;
            while ((match = regex.exec(titleMask)) !== null) {
                const field = this.findFieldDefinitionByLabel(match[1]);
                if (field) {
                    if (body[field.id] && body[field.id].values) {
                        // Replace the placeholder with the value of the field.
                        for (const lang in body[field.id].values) {
                            if (!(lang in title)) {
                                title[lang] = titleMask;
                            }
                            title[lang] = title[lang].replace(match[0], body[field.id].values[lang][0].value);
                        }
                    } else {
                        // Replace the placeholder with an empty string.
                        for (const lang in title) {
                            title[lang] = title[lang].replace(match[0], '');
                        }
                        titleMask = titleMask.replace(match[0], '');
                    }
                }
            }
            if (Object.keys(title).length < 1) {
                title['en'] = titleMask;
            }
            return title;
        }
        return null;
    }

    /**
     * Get the renderable content of the annotation.
     *
     * @returns {Array}
     */
    getContent() {
        const content = [];
        const body = this.parseBody();
        if (this.hasTemplate() && this.#template?.settings?.structure) {
            for (const item of this.#template.settings.structure) {
                if (item.type === 'ItemList') {
                    const tab = {
                        type: 'tab',
                        label: item.name,
                        items: [],
                    }
                    for (const child of item.itemListElement) {
                        if (body[child.id]) {
                            tab.items.push(body[child.id]);
                        } else {
                            tab.items.push({
                                type: 'field',
                                field: this.findFieldDefinition(child.id),
                                values: null,
                            });
                        }
                    }
                    content.push(tab);
                } else {
                    if (body[item.id]) {
                        content.push(body[item.id]);
                    } else {
                        content.push({
                            type: 'field',
                            field: this.findFieldDefinition(item.id),
                            values: null,
                        });
                    }
                }
            }
        } else {
            for (const fieldID in body) {
                if (fieldID === 'generic' || fieldID === 'tags') {
                    continue;
                }
                content.push(body[fieldID]);
            }
            if (body.generic) {
                content.push(body.generic);
            }
        }
        if (body.tags) {
            content.push(body.tags);
        }
        return content;
    }

    /**
     * Get all language codes used in the annotation body.
     *
     * @returns {Array}
     */
    getLanguageCodes() {
        const languages = new Set();
        if (!this.data.body) {
            return [];
        }
        if (!Array.isArray(this.data.body)) {
            this.data.body = [this.data.body];
        }
        for (const item of this.data.body) {
            if (item.language) {
                languages.add(item.language);
            }
        }
        return Array.from(languages);
    }

    /**
     * Parse the body of the annotation.
     *
     * @returns {Object}
     *   An object with field IDs as keys. It can also contain 'generic' and 'tags' keys for generic values and tags respectively.
     */
    parseBody() {
        const data = {};
        const tags = {};
        const genericValues = {};
        let tagLinkedSource = null;
        if (!this.data.body) {
            return data;
        }
        if (!Array.isArray(this.data.body)) {
            this.data.body = [this.data.body];
        }
        for (const item of this.data.body) {
            if (item.type === 'TextualBody') {
                const lang = item.language || 'en';
                // Parse tags.
                if (this.data.motivation === 'tagging' || item.purpose === 'tagging') {
                    if (!(lang in tags)) {
                        tags[lang] = [];
                    }
                    tags[lang].push(this.parseTag(item));
                    continue;
                }
                if (this.hasTemplate() && item.generator) {
                    const field = this.findFieldDefinition(item.generator);
                    if (field) {
                        if (!(field.id in data)) {
                            data[field.id] = {
                                type: 'field',
                                field: field,
                                values: {},
                            };
                        }
                        if (!(lang in data[field.id].values)) {
                            data[field.id].values[lang] = [];
                        }
                        data[field.id].values[lang].push(this.parseFieldValue(item, field));
                    }
                } else {
                    // Parse generic values.
                    if (!(lang in genericValues)) {
                        genericValues[lang] = [];
                    }
                    genericValues[lang].push(this.parseGenericValue(item));
                }
            } else if (item.type === 'Image') {
                // Handle the image type annotation and make it as a generic value.
                const imageParser = ResourceParserFactory.create(item);
                if (!genericValues['en']) {
                    genericValues['en'] = [];
                }
                genericValues['en'].push({
                    format: 'text/html',
                    value: `<img src="${imageParser.getUrl()}" alt="Annotation Image">`,
                });
            } else if (item.type === 'SpecificResource' && this.data.motivation.toLowerCase() === 'tagging') {
                // Handle the tagging annotation with the linked `SpecificResource`.
                if (item.source && Helper.isURL(item.source)) {
                    tagLinkedSource = item.source;
                }
            }
        }
        if (Object.keys(genericValues).length > 0) {
            data.generic = {
                type: 'generic',
                values: genericValues,
            };
        }
        if (Object.keys(tags).length > 0) {
            // Add the linked source to the tag value.
            if (tagLinkedSource) {
                for (const lang in tags) {
                    for (const tag of tags[lang]) {
                        if (!tag.data) {
                            tag.data = {};
                        }
                        tag.data.link = tagLinkedSource;
                    }
                }
            }
            data.tags = {
                type: 'tag',
                values: tags,
            };
        }
        return data;
    }

    /**
     * Parse a field value.
     *
     * @param {Object} item
     *   A single annotation body item.
     * @param {Object} field
     *   The field definition.
     * @returns {Object}
     *   The parsed field value.
     */
    parseFieldValue(item, field) {
        const value = {};
        const parser = new DOMParser();
        const doc = parser.parseFromString(item.value, 'text/html');
        switch (field.format) {
            case 'link':
                // Find the `.field-value a` element.
                const a = doc.querySelector('.field-value a');
                if (a) {
                    value.text = a.textContent;
                    value.url = a.getAttribute('href');
                }
                break;
            default:
                // Find the `.field-value` element.
                const container = doc.querySelector('.field-value');
                if (field.allowHtml) {
                    value.format = 'text/html';
                    value.value = container.innerHTML;
                } else {
                    value.format = 'text/plain';
                    value.value = container.textContent;
                }
        }
        return value;
    }

    /**
     * Parse a generic value.
     *
     * A generic value is a value that is not associated with any field in the template.
     *
     * @param {Object} item
     *   A single annotation body item.
     * @returns {Object}
     */
    parseGenericValue(item) {
        const value = {};
        if (item.format === 'text/html') {
            value.format = 'text/html';
        } else {
            value.format = 'text/plain';
        }
        value.value = item.value;
        return value;
    }

    /**
     * Parse a tag value.
     *
     * @param {Object} item
     *   A single annotation body item.
     * @returns {Object}
     */
    parseTag(item) {
        const tag = {};
        if (item.format === 'text/html') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(item.value, 'text/html');
            // Find the span element.
            const span = doc.querySelector('span');
            if (span) {
                // Find the `a` element inside the span.
                const a = span.querySelector('a');
                if (a) {
                    // Set the term id to the href attribute of the `a` element.
                    tag.term_id = a.getAttribute('href');
                    // Set the term label to the text content of the `a` element.
                    tag.term_label = a.textContent;
                } else {
                    // Set the term label to the text content of the span element.
                    tag.term_label = span.textContent;
                }
                // Get the `data-vocab-name` attribute of the span element if it exists.
                if (span.hasAttribute('data-vocab-label')) {
                    tag.vocabulary_name = span.getAttribute('data-vocab-label');
                }
                // Get the `data-vocab-id` attribute of the span element if it exists.
                if (span.hasAttribute('data-vocab-id')) {
                    tag.vocabulary_id = span.getAttribute('data-vocab-id');
                }
                // Loop through the `data-broader-label-{index}` attributes of the span element.
                const trace = [];
                let index = 1;
                while (span.hasAttribute(`data-broader-label-${index}`)) {
                    const broader = {};
                    broader.label = span.getAttribute(`data-broader-label-${index}`);
                    if (span.hasAttribute(`data-broader-id-${index}`)) {
                        broader.key = span.getAttribute(`data-broader-id-${index}`);
                    }
                    trace.push(broader);
                    index++;
                }
                if (trace.length > 0) {
                    tag.trace = trace;
                }
            } else {
                // Set the term label to the text content of the root element.
                tag.term_label = doc.documentElement.textContent;
            }

        } else {
            tag.term_label = item.value;
        }
        return tag;
    }
}
