import { ResourceParser, ImageParser, ResourceParserFactory, SpecificResourceParser} from "@/libraries/iiif/dependency-manager.js";
import Helper from "@/libraries/helper.js";

/**
 * A class to parse IIIF manifest data.
 */
export class ManifestParser extends ResourceParser {

    /**
     * Get the canvases data from the manifest.
     *
     * @returns {*[]}
     *   A list of canvases. Each element contains the canvas `id`, `parser`, `label`, `description`, `image`, `thumbnail`,
     *   and `annotations`.
     */
    getCanvases() {
        const canvases = [];
        if (Array.isArray(this.data.items)) {
            this.data.items.forEach(item => {
                if (item.type === 'Canvas') {
                    const canvasParser = ResourceParserFactory.create(item);
                    const canvas = {
                        id: item.id,
                        parser: canvasParser,
                    }
                    if (typeof item.label !== 'undefined') {
                        canvas.label = ResourceParser.displayLangPropertyAuto(item.label);
                    }
                    if (typeof item.summary !== 'undefined') {
                        canvas.description = ResourceParser.displayLangPropertyAuto(item.summary);
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
                                typeof anno.body !== 'undefined'
                            ) {
                                const parser = ResourceParserFactory.create(anno.body);
                                if (parser instanceof ImageParser) {
                                    if (parser.isIIIF()) {
                                        image = {
                                            type: 'iiif',
                                            url: parser.getIIIFUrl(),
                                        };
                                    } else {
                                        // Handle plain image.
                                        image = {
                                            type: 'image',
                                            url: anno.body.id,
                                        };
                                    }
                                } else if (parser instanceof SpecificResourceParser) {
                                    // Handle when image is a specific resource with selector.
                                    const source = parser.getSource();
                                    if (source && source.type === 'Image') {
                                        const imageParser = ResourceParserFactory.create(source);
                                        let imageIIIFUrl = imageParser.getIIIFUrl();
                                        let imageUrl;
                                        if (imageIIIFUrl) {
                                            imageUrl = imageIIIFUrl;
                                            const params = {
                                                region: 'full',
                                                size: 'max',
                                                rotation: 0,
                                                quality: 'default',
                                                format: 'jpg',
                                            };
                                            const selector = parser.getSelector();
                                            if (selector && selector.type === 'iiif:ImageApiSelector') {
                                                // Apply the selector parameters.
                                                for (const param in params) {
                                                    if (typeof selector[param] !== 'undefined') {
                                                        params[param] = selector[param];
                                                    }
                                                }
                                            }
                                            imageUrl += `/${params.region}/${params.size}/${params.rotation}/${params.quality}.${params.format}`;
                                        } else {
                                            imageUrl = imageParser.getUrl();
                                        }
                                        image = {
                                            type: 'image',
                                            url: imageUrl,
                                        };
                                    }
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
        const canvasParser = ResourceParserFactory.create(canvas);
        const thumbnail = canvasParser.getThumbnail();
        if (thumbnail) {
            return thumbnail;
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
                    const anoPageParser = ResourceParserFactory.create(anoPage);
                    const identifier = anoPageParser.getMetadataValue('Identifier');
                    if (Array.isArray(anoPage.items)) {
                        for (const anno of anoPage.items) {
                            if (anno.type === 'Annotation') {
                                const annotation = {
                                    id: anno.id,
                                    target: this.getAnnotationTarget(anno),
                                    group: identifier || anoPage.id,
                                }
                                if (anno.body) {
                                    annotation.fields = this.createAnnotationFieldsData(anno.body, anno.motivation);
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
     * Get the annotation target.
     *
     * This will process the original annotation target and make it compatible with Annotorious.
     *
     * @param {Object} annotation
     *   The annotation object from the manifest.
     *
     * @returns {Object}
     *   The processed annotation target object.
     */
    getAnnotationTarget(annotation) {
        if (annotation.target) {
            const target = annotation.target;
            if (target.type === 'SpecificResource') {
                if (target.selector) {
                    const selector = target.selector;
                    if (selector.type === 'PointSelector') {
                        // Convert the point selector to the supported media fragment.
                        return {
                            source: target.source,
                            selector: {
                                type: 'FragmentSelector',
                                conformsTo: 'http://www.w3.org/TR/media-frags/',
                                value: `xywh=pixel:${selector.x},${selector.y},0,0`,
                            },
                            renderedVia: {
                                name: 'point',
                            }
                        }
                    }
                }
            } else if (typeof target === 'string') {
                const regex = /#xywh=(\d+,\d+,\d+,\d+)$/i
                const match = target.match(regex);
                if (match) {
                    // Convert the inline xywh selector to the supported media fragment.
                    return {
                        source: target.replace(regex, ''),
                        selector: {
                            type: 'FragmentSelector',
                            conformsTo: 'http://www.w3.org/TR/media-frags/',
                            value: `xywh=pixel:${match[1]}`,
                        },
                    }
                }
                // Treat the annotation target is the whole canvas by default.
                return {
                    source: target,
                }
            }

            // Normalise the svg selector.
            if (target.selector?.type === 'SvgSelector') {
                // Remove the '<g>' element.
                target.selector.value = target.selector.value.replace(/<\/?g[^>]*>/g, '');
                // Remove the attributes of the '<svg>' element.
                target.selector.value = target.selector.value.replace(/<svg[^>]*>/g, '<svg>');
                // Replace the coordinates separators from comma to space in the `<path>` element.
                target.selector.value = target.selector.value.replace(
                    /(<path[^>]+d=['"])([^>]+)(['"])/g, (match, p1, p2, p3) => {
                        return p1 + p2.replace(/,/g, ' ') + p3;
                });
            }
            return target;
        }
        return null;
    }

    /**
     * Create the annotation fields data.
     *
     * @param {Object|Array} annoBody
     *   The `body` of the annotation from the manifest.
     * @param {string|null} motivation
     *   The motivation of the annotation.
     * @returns {{}}
     *   The annotation fields data. The key of the object is the field label. The value of the object is another object
     *   contains the language code and the field value. The language code is the key of the object and the field value
     *   is an array of the field values.
     */
    createAnnotationFieldsData(annoBody, motivation = null) {
        if (typeof annoBody === 'object' && !Array.isArray(annoBody)) {
            annoBody = [annoBody];
        }
        const fields = {};
        let tagLinkedSource = null;
        for (const body of annoBody) {
            if (body.type === 'TextualBody') {
                let purpose = motivation;
                if (body.purpose) {
                    purpose = body.purpose;
                }
                const value = this.#parseAnnotationValue(body.value, purpose);
                const lang = body.language || 'none';
                // Process the comment value.
                if (value.label === 'Comment') {
                    // Convert the value to an object containing the 'format' and 'value'.
                    value.value = {
                        value: value.value,
                    }
                    if (body.format) {
                        value.value.format = body.format;
                    }
                }
                if (typeof fields[value.label] === 'undefined') {
                    fields[value.label] = {};
                }
                if (typeof fields[value.label][lang] === 'undefined') {
                    fields[value.label][lang] = [];
                }
                fields[value.label][lang].push(value.value);
            } else if (body.type === 'Image') {
                // Handle the image type annotation and make it as a value of the 'Comment' field.
                if (typeof fields['Comment'] === 'undefined') {
                    fields['Comment'] = {};
                }
                if (typeof fields['Comment']['none'] === 'undefined') {
                    fields['Comment']['none'] = [];
                }
                const imageParser = ResourceParserFactory.create(body);
                fields['Comment']['none'].push({
                    value: `<img src="${imageParser.getUrl()}" alt="Annotation Image">`,
                    format: 'text/html',
                });
            } else if (body.type === 'SpecificResource' && motivation === 'tagging') {
                // Handle the tagging annotation with the linked `SpecificResource`.
                if (body.source && Helper.isURL(body.source)) {
                    tagLinkedSource = body.source;
                }
            }
        }
        // Add the linked source to the tag value.
        if (tagLinkedSource) {
            if (fields.Tag) {
                for (const lang in fields.Tag) {
                    for (const tag of fields.Tag[lang]) {
                        if (!tag.data) {
                            tag.data = {};
                        }
                        tag.data.link = tagLinkedSource;
                    }
                }
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
     * @param {string|null} purpose
     *   The purpose of the annotation.
     * @returns {*}
     *   The parsed annotation value object. The object contains the `value` and the `label`.
     */
    #parseAnnotationValue(value, purpose = null) {
        // Set the default annotation type as 'Comment'.
        const parsedValue = {
            label: 'Comment',
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
        } else if (purpose === 'tagging') {
            // Handle generic comment with the tagging purpose.
            parsedValue.label = 'Tag';
            parsedValue.value = {
                term_id: Helper.generateUUID(),
                term_label: value,
            };
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
        if (Array.isArray(this.data.items)) {
            this.data.items.forEach(item => {
                if (item.type === 'Canvas' && Array.isArray(item.annotations)) {
                    item.annotations.forEach(anoPage => {
                        if (anoPage.type === 'AnnotationPage') {
                            const anoPageParser = ResourceParserFactory.create(anoPage);
                            const set = {};
                            const identifier =  anoPageParser.getMetadataValue('Identifier');
                            set.id = identifier || anoPage.id;
                            // Find whether the set has been already added.
                            const existingSet = sets.find(s => s.id === set.id);
                            if (existingSet) {
                                return;
                            }
                            if (typeof anoPage.label !== 'undefined') {
                                set.label = ResourceParser.displayLangPropertyAuto(anoPage.label);
                            }
                            if (typeof anoPage.summary !== 'undefined') {
                                set.description = ResourceParser.displayLangPropertyAuto(anoPage.summary);
                            }
                            const creator = anoPageParser.getMetadataValue('Creator');
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
