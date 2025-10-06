import {
    ResourceParser,
    ImageParser,
    ResourceParserFactory,
    SpecificResourceParser,
    IiifHelper,
    AudioParser,
    VideoParser,
    AnnotationParser
} from "@/libraries/iiif/dependency-manager.js";
import Helper from "@/libraries/helper.js";
import Language from "@/libraries/languages.js";

/**
 * A class to parse IIIF manifest data.
 */
export class ManifestParser extends ResourceParser {

    /**
     * Get the canvases data from the manifest.
     *
     * @param {string|null} prefLangCode
     *   The preferred language code to display the label and description of the canvases.
     *
     * @returns {*[]}
     *   A list of canvases. Each element contains the canvas `id`, `parser`, `label`, `description`, `image`, `thumbnail`,
     *   and `annotations`.
     */
    getCanvases(prefLangCode = null) {
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
                        canvas.label = ResourceParser.displayLangPropertyAuto(item.label, prefLangCode);
                    }
                    if (typeof item.summary !== 'undefined') {
                        canvas.description = ResourceParser.displayLangPropertyAuto(item.summary, prefLangCode);
                    }
                    const image = this.getCanvasImage(item);
                    if (image) {
                        if (image.type === 'audio') {
                            canvas.audio = image;
                        } else if (image.type === 'video') {
                            canvas.video = image;
                        } else {
                            canvas.image = image;
                        }
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
                                anno.motivation.toLowerCase() === 'painting' &&
                                typeof anno.body !== 'undefined'
                            ) {
                                const parser = ResourceParserFactory.create(anno.body);
                                if (parser instanceof ImageParser) {
                                    if (parser.isIIIF()) {
                                        image = {
                                            type: 'iiif',
                                            isLevel0: parser.isLevel0(),
                                            url: decodeURI(parser.getIIIFUrl()),
                                        };
                                    } else {
                                        // Handle plain image.
                                        image = {
                                            type: 'image',
                                            url: decodeURI(anno.body.id),
                                        };
                                    }
                                } else if (parser instanceof VideoParser) {
                                    image = {
                                        type: 'video',
                                        format: parser.getFormat(),
                                        url: decodeURI(parser.getUrl()),
                                        width: parser.getWidth(),
                                        height: parser.getHeight(),
                                    }
                                }  else if (parser instanceof AudioParser) {
                                    image = {
                                        type: 'audio',
                                        format: parser.getFormat(),
                                        url: decodeURI(parser.getUrl()),
                                    }
                                }else if (parser instanceof SpecificResourceParser) {
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
                                            if (selector && (selector.type === 'iiif:ImageApiSelector' || selector.type === 'ImageApiSelector')) {
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
                                            url: decodeURI(imageUrl),
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
            return decodeURI(thumbnail);
        }
        const image = this.getCanvasImage(canvas);
        if (image !== null) {
            if (image.type === 'iiif') {
                if (image.isLevel0) {
                    return `${decodeURI(image.url)}/full/max/0/default.jpg`;
                } else {
                    return `${decodeURI(image.url)}/full/80,/0/default.jpg`;
                }
            } else if (image.type === 'image') {
                return decodeURI(image.url);
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
                    const annoCollectionID = anoPage.partOf?.id;

                    // @deprecated: Use the annotation collection for grouping instead.
                    const anoPageParser = ResourceParserFactory.create(anoPage);
                    const identifier = anoPageParser.getMetadataValue('Identifier');

                    if (Array.isArray(anoPage.items)) {
                        for (const anno of anoPage.items) {
                            if (anno.type === 'Annotation') {
                                const parser = new AnnotationParser(anno);
                                const annotation = {
                                    id: anno.id,
                                    target: this.getAnnotationTarget(anno),
                                    group: annoCollectionID || identifier || anoPage.id,
                                    data: anno,
                                    title: parser.getTitle(),
                                    content: parser.getContent(),
                                    lineColor: parser.getLineColor(),
                                    lineWeight: parser.getLineWeight(),
                                    templateName: parser.getTemplateName(),
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
                    } else if (selector.type === 'FragmentSelector') {
                        // Normalize the selector value.
                        if (selector.value.startsWith('xywh=') && !selector.value.startsWith('xywh=pixel:')) {
                            selector.value = selector.value.replace(/^xywh=/, 'xywh=pixel:');
                        }
                        // Set "conformsTo".
                        selector.conformsTo = 'http://www.w3.org/TR/media-frags/';
                        return target;
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
     * Get the annotation sets from the manifest.
     *
     * @param {string|null} prefLangCode
     *   The preferred language code to display the label and description of the annotation sets.
     *
     * @returns {*[]}
     *   A list of annotation sets. Each element contains the set `id`, `label`, `description`, and `creator`.
     */
    getAnnotationSets(prefLangCode = null) {
        const sets = [];
        if (Array.isArray(this.data.items)) {
            this.data.items.forEach(item => {
                if (item.type === 'Canvas' && Array.isArray(item.annotations)) {
                    item.annotations.forEach(anoPage => {
                        if (anoPage.type === 'AnnotationPage') {
                            const set = {};
                            if (anoPage.partOf && (anoPage.partOf.type === 'AnnotationCollection')) {
                                const anoCollection = anoPage.partOf;
                                const anoCollectionParser = ResourceParserFactory.create(anoCollection);
                                set.id = anoCollectionParser.getID();
                                // Find whether the set has been already added.
                                const existingSet = sets.find(s => s.id === set.id);
                                if (existingSet) {
                                    return;
                                }
                                if (typeof anoCollection.label !== 'undefined') {
                                    set.label = ResourceParser.displayLangPropertyAuto(anoCollection.label, prefLangCode);
                                }
                                if (typeof anoCollection.summary !== 'undefined') {
                                    set.description = ResourceParser.displayLangPropertyAuto(anoCollection.summary, prefLangCode);
                                }
                                const creator = anoCollectionParser.getMetadataValue('Creator');
                                if (creator) {
                                    set.creator = creator;
                                }
                            } else {
                                // @deprecated: Use the annotation collection as the annotation set.
                                const anoPageParser = ResourceParserFactory.create(anoPage);
                                const identifier =  anoPageParser.getMetadataValue('Identifier');
                                set.id = identifier || anoPage.id;
                                // Find whether the set has been already added.
                                const existingSet = sets.find(s => s.id === set.id);
                                if (existingSet) {
                                    return;
                                }
                                if (typeof anoPage.label !== 'undefined') {
                                    set.label = ResourceParser.displayLangPropertyAuto(anoPage.label, prefLangCode);
                                }
                                if (typeof anoPage.summary !== 'undefined') {
                                    set.description = ResourceParser.displayLangPropertyAuto(anoPage.summary, prefLangCode);
                                }
                                const creator = anoPageParser.getMetadataValue('Creator');
                                if (creator) {
                                    set.creator = creator;
                                }
                            }
                            sets.push(set);
                        }
                    });
                }
            });
        }
        return sets;
    }

    /**
     * Get the ID of the start canvas.
     *
     * @returns {string|null}
     */
    getStartCanvas() {
        if (this.data.start) {
            if (this.data.start.type === 'Canvas') {
                return this.data.start.id;
            } else if (this.data.start.type === 'SpecificResource' && this.data.start.source) {
                return this.data.start.source;
            }
        }
        return null;
    }

    /**
     * Get the structures from the manifest.
     *
     * @returns {Array|null}
     */
    getStructures() {
        return this.data.structures ? this.data.structures : null;
    }

    /**
     * @inheritDoc
     */
    getLanguages() {
        const langSets = [super.getLanguages()];
        this.getCanvases().forEach(canvas => {
            langSets.push(canvas.parser.getLanguages());
            // Get annotation languages.
            if (canvas.annotations) {
                canvas.annotations.forEach(annotation => {
                    if (annotation.content) {
                        for (const item in annotation.content) {
                            if (item.values) {
                                const fieldLangCodes = Object.keys(item.values);
                                const fieldLanguages = [];
                                for (const langCode of fieldLangCodes) {
                                    let langName = Language.getLanguageName(langCode);
                                    if (langName) {
                                        fieldLanguages.push({ code: langCode, name: langName });
                                    }
                                }
                                langSets.push(fieldLanguages);
                            }
                        }
                    }
                });
            }
        });
        // Get structure languages.
        const structures = this.getStructures();
        if (structures) {
            const structureLanguages = [];
            IiifHelper.structureTraverse(structures, structure => {
                if (structure.label) {
                    const langCodes = Object.keys(structure.label);
                    langCodes.forEach(langCode => {
                        let langName = Language.getLanguageName(langCode);
                        if (langName) {
                            structureLanguages.push({ code: langCode, name: langName });
                        }
                    });
                }
            });
            langSets.push(structureLanguages);
        }
        // Consolidate the languages.
        const languages = {};
        langSets.forEach(langSet => {
            langSet.forEach(lang => {
                languages[lang.code] = lang;
            });
        });
        return Object.values(languages);
    }
}
