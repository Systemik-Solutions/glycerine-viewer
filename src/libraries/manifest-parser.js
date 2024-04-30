/**
 * A class to parse IIIF manifest data.
 */
export default class ManifestParser {

    // The manifest data.
    #data;

    /**
     * Constructor
     *
     * @param {Object} data
     *   The manifest data.
     */
    constructor(data) {
        this.#data = data;
    }

    /**
     * Get the canvases data from the manifest.
     *
     * @returns {*[]}
     *   A list of canvases. Each element contains the canvas `id`, `label`, `description`, `image`, `thumbnail`,
     *   and `annotations`.
     */
    getCanvases() {
        const canvases = [];
        if (Array.isArray(this.#data.items)) {
            this.#data.items.forEach(item => {
                if (item.type === 'Canvas') {
                    const canvas = {
                        id: item.id,
                    }
                    if (typeof item.label !== 'undefined') {
                        canvas.label = this.getPropertyDisplayValue(item, 'label');
                    }
                    if (typeof item.summary !== 'undefined') {
                        canvas.description = this.getPropertyDisplayValue(item, 'summary');
                    }
                    const image = this.getCanvasImage(item);
                    if (image) {
                        canvas.image = image;
                    }
                    const thumbnail = this.getCanvasThumbnail(item);
                    if (thumbnail) {
                        canvas.thumbnail = thumbnail;
                    }
                    const annotations = this.getCanvasAnnotations(item);
                    if (annotations.length > 0) {
                        canvas.annotations = annotations;
                    }
                    canvases.push(canvas);
                }
            });
        }
        return canvases;
    }

    /**
     * Get the image object from the canvas.
     *
     * @param {Object} canvas
     *   The canvas data from the manifest.
     * @returns {Object|null}
     *   The IIIF image object containing the `type`("image" or "iiif") and `url`.
     */
    getCanvasImage(canvas) {
        let image = null;
        if (Array.isArray(canvas.items)) {
            canvas.items.forEach(anoPage => {
                if (anoPage.type === 'AnnotationPage') {
                    if (Array.isArray(anoPage.items)) {
                        anoPage.items.forEach(anno => {
                            if (
                                anno.type === 'Annotation' &&
                                anno.motivation === 'painting' &&
                                typeof anno.body !== 'undefined' &&
                                anno.body.type === 'Image'
                            ) {
                                if (typeof anno.body.service !== 'undefined') {
                                    // Handle IIIF image.
                                    const service = anno.body.service[0];
                                    if (
                                        service['@context'] === 'http://iiif.io/api/image/2/context.json' ||
                                        service['type'] === 'ImageService2' ||
                                        service['@type'] === 'ImageService2' ||
                                        service['type'] === 'ImageService3' ||
                                        service['@type'] === 'ImageService3'
                                    ) {
                                        image = {
                                            type: 'iiif',
                                        };
                                        if (typeof service.id !== 'undefined') {
                                            image.url = service.id;
                                        }
                                        if (typeof service['@id'] !== 'undefined') {
                                            image.url = service['@id'];
                                        }
                                    }
                                } else {
                                    // Handle plain image.
                                    image = {
                                        type: 'image',
                                        url: anno.body.id,
                                    };
                                }
                            }
                        });
                    }
                }
            });
        }
        return image;
    }

    /**
     * Get the canvas thumbnail URL.
     *
     * @param {Object} canvas
     *   The canvas data from the manifest.
     * @returns {*|null|string}
     *   The thumbnail URL.
     */
    getCanvasThumbnail(canvas) {
        if (Array.isArray(canvas.thumbnail)) {
            const thumbnail = canvas.thumbnail[0];
            if (thumbnail.type === 'Image' && typeof thumbnail.id !== 'undefined') {
                return thumbnail.id;
            }
        }
        const image = this.getCanvasImage(canvas);
        if (image !== null) {
            if (image.type === 'iiif') {
                return `${image.url}/full/80,/0/default.jpg`;
            } else {
                return image.url;
            }
        }
        return null;
    }

    /**
     * Get the property display value.
     *
     * @param {Object} data
     *   The data object from the manifest.
     * @param {string} property
     *   The property name.
     * @param {string} language
     *   The language code. If it is set to `null`, the function will use its own judgement to get the value.
     * @returns {*|null}
     *   The display value of the property.
     */
    getPropertyDisplayValue(data, property, language = null) {
        if (typeof data[property] !== 'undefined') {
            if (language) {
                if (typeof data[property][language] !== 'undefined') {
                    return data[property][language][0];
                }
            } else {
                if (typeof data[property] === 'string') {
                    return data[property];
                }
                if (Array.isArray(data[property])) {
                    return data[property][0];
                }
                if (typeof data[property].en !== 'undefined') {
                    return data[property].en[0];
                }
                if (typeof data[property].none !== 'undefined') {
                    return data[property].none[0];
                }
                if (Object.keys(data[property]).length > 0) {
                    return data[property][Object.keys(data.label)[0]][0];
                }
            }
        }
        return null;
    }

    /**
     * Get the metadata value from the entity.
     *
     * @param {Object} entity
     *   The entity object from the manifest.
     * @param {string} property
     *   The property name.
     * @param {string} language
     *   The language code. If it is set to `null`, the function will use its own judgement to get the value.
     * @returns {*|null}
     *   The metadata value.
     */
    getMetadataValue(entity, property, language = null) {
        if (Array.isArray(entity.metadata)) {
            for (const item of entity.metadata) {
                const label = this.getPropertyDisplayValue(item, 'label', language);
                if (label === property) {
                    return this.getPropertyDisplayValue(item, 'value', language);
                }
            }
        }
        return null;
    }

    /**
     * Get the canvas annotations.
     *
     * @param {Object} canvas
     *   The canvas data from the manifest.
     * @returns {*[]}
     *   A list of annotations. Each element contains the annotation `id`, `target`, `group`, and `fields`. The group is
     *   the identifier of the annotation page where the annotation is stored. The identifier of the annotation page is
     *   the `id` of the annotation page or the value of the `Identifier` metadata if it is available.
     */
    getCanvasAnnotations(canvas) {
        const annotations = [];
        if (Array.isArray(canvas.annotations)) {
            for (const anoPage of canvas.annotations) {
                if (anoPage.type === 'AnnotationPage') {
                    const identifier = this.getMetadataValue(anoPage, 'Identifier');
                    if (Array.isArray(anoPage.items)) {
                        for (const anno of anoPage.items) {
                            if (anno.type === 'Annotation' && anno.target) {
                                const annotation = {
                                    id: anno.id,
                                    target: anno.target,
                                    group: identifier || anoPage.id,
                                }
                                if (anno.body) {
                                    annotation.fields = this.createAnnotationFieldsData(anno.body);
                                }
                                annotations.push(annotation);
                            }
                        }
                    }
                }
            }
        }
        return annotations;
    }

    /**
     * Create the annotation fields data.
     *
     * @param {Object|Array} annoBody
     *   The `body` of the annotation from the manifest.
     * @returns {{}}
     *   The annotation fields data. The key of the object is the field label. The value of the object is another object
     *   contains the language code and the field value. The language code is the key of the object and the field value
     *   is an array of the field values.
     */
    createAnnotationFieldsData(annoBody) {
        if (typeof annoBody === 'object' && !Array.isArray(annoBody)) {
            annoBody = [annoBody];
        }
        const fields = {};
        for (const body of annoBody) {
            if (body.type === 'TextualBody') {
                const value = this.#parseAnnotationValue(body.value);
                const lang = body.language || 'none';
                if (!value.label) {
                    value.label = 'Comment';
                }
                if (typeof fields[value.label] === 'undefined') {
                    fields[value.label] = {};
                }
                if (typeof fields[value.label][lang] === 'undefined') {
                    fields[value.label][lang] = [];
                }
                fields[value.label][lang].push(value.value);
            }
        }
        return fields;
    }

    /**
     * Parse the annotation value.
     *
     * This function will parse the annotation value string to an object contains the label and the value.
     *
     * @param {string} value
     *   The annotation value string.
     * @returns {*}
     *   The parsed annotation value object. The object contains the `value` and the optional `label`.
     */
    #parseAnnotationValue(value) {
        const parsedValue = {
            value: value,
        };
        const match = value.match(/^([^:]+):(.*)$/s);
        if (match) {
            const label = match[1].trim();
            if (
                label === 'Title' ||
                label === 'Description' ||
                label === 'Note' ||
                label === 'Attribution' ||
                label === 'Date' ||
                label === 'Line Color'
            ) {
                parsedValue.label = label;
                parsedValue.value = match[2].trim();
            } else if (label === 'Link') {
                parsedValue.label = label;
                parsedValue.value = this.#parseLink(match[2].trim());
            } else if (label === 'Tag') {
                parsedValue.label = label;
                const tagValue = {};
                const lines = value.split('\n');
                for (const line of lines) {
                    const lineMatch = line.match(/^([^:]+):(.*)$/);
                    if (lineMatch) {
                        const propName = lineMatch[1].trim();
                        const propValue = lineMatch[2].trim();
                        if (propName === 'Tag') {
                            const term = this.#parseLink(propValue);
                            tagValue.term_id = term.url;
                            tagValue.term_label = term.text;
                        } else if (propName === 'Vocabulary') {
                            const vocab = this.#parseLink(propValue);
                            tagValue.vocabulary_id = vocab.url;
                            tagValue.vocabulary_name = vocab.text;
                        } else if (propName === 'Data') {
                            tagValue.data = JSON.parse(propValue);
                        }
                    }
                }
                parsedValue.value = tagValue;
            }
        }
        return parsedValue;
    }

    /**
     * Parse the link string.
     *
     * @param {string} value
     *   The link string in the format of "[text](url)".
     * @returns {{text: *, url: *}}
     *   The parsed link object contains the `text` and the `url`.
     */
    #parseLink(value) {
        // The value string is in the format of "[text](url)". Parse the string value to an object with `text` and `url`.
        const match = value.match(/^\[(.*)\]\((.*)\)$/);
        if (match) {
            return {
                text: match[1],
                url: match[2],
            };
        } else {
            return {
                text: value,
                url: value,
            };
        }
    }

    /**
     * Get the annotation sets from the manifest.
     *
     * @returns {*[]}
     *   A list of annotation sets. Each element contains the set `id`, `label`, `description`, and `creator`.
     */
    getAnnotationSets() {
        const sets = [];
        if (Array.isArray(this.#data.items)) {
            this.#data.items.forEach(item => {
                if (item.type === 'Canvas' && Array.isArray(item.annotations)) {
                    item.annotations.forEach(anoPage => {
                        if (anoPage.type === 'AnnotationPage') {
                            const set = {};
                            const identifier = this.getMetadataValue(anoPage, 'Identifier');
                            set.id = identifier || anoPage.id;
                            // Find whether the set has been already added.
                            const existingSet = sets.find(s => s.id === set.id);
                            if (existingSet) {
                                return;
                            }
                            if (typeof anoPage.label !== 'undefined') {
                                set.label = this.getPropertyDisplayValue(anoPage, 'label');
                            }
                            if (typeof anoPage.summary !== 'undefined') {
                                set.description = this.getPropertyDisplayValue(anoPage, 'summary');
                            }
                            const creator = this.getMetadataValue(anoPage, 'Creator');
                            if (creator) {
                                set.creator = creator;
                            }
                            sets.push(set);
                        }
                    });
                }
            });
        }
        return sets;
    }
}
