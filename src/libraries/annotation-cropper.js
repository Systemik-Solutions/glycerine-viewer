import ImageCropper from "@/libraries/image-cropper";

/**
 * Class of cropping the annotation image.
 */
export default class AnnotationCropper {

    /**
     * Crop the annotation image.
     *
     * @param {Object} annotation
     *   The annotation data.
     * @param {ImageLoader} imageLoader
     *   The image loader.
     * @returns {string|null}
     *   The image content (base64) of the annotation image, or the URL of the image when there is no selector,
     *   or null if it cannot be cropped.
     */
    static cropAnnotationImage(annotation, imageLoader) {
        if (!imageLoader.hasLoaded()) {
            return null;
        }
        if (!annotation.target.selector) {
            // When the selector is not available, return the URL of the whole image.
            return imageLoader.getImageElement().src;
        }
        const ratio = imageLoader.getRatio();
        const cropper = new ImageCropper(imageLoader.getImageElement());
        const selector = annotation.target.selector;
        if (selector.type === 'SvgSelector') {
            if (selector.value.match(/<polygon points="([^"]+)"/)) {
                const matches = [...selector.value.matchAll(/<polygon points="([^"]+)"/g)];
                const value = matches[0][1];
                const pairs = value.split(' ');
                const points = [];
                pairs.forEach((pair) => {
                    const coords = pair.split(',');
                    const x = parseFloat(coords[0]) * ratio;
                    const y = parseFloat(coords[1]) * ratio;
                    points.push([x, y]);
                });
                return cropper.crop(points);
            } else if (selector.value.match(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/)) {
                const matches = [...selector.value.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)];
                const cx = parseFloat(matches[0][1]) * ratio;
                const cy = parseFloat(matches[0][2]) * ratio;
                const r = parseFloat(matches[0][3]) * ratio;
                return cropper.cropCircle([cx, cy], r);
            } else if (selector.value.match(/<ellipse cx="([^"]+)" cy="([^"]+)" rx="([^"]+)" ry="([^"]+)"/)) {
                const matches = [...selector.value.matchAll(/<ellipse cx="([^"]+)" cy="([^"]+)" rx="([^"]+)" ry="([^"]+)"/g)];
                const cx = parseFloat(matches[0][1]) * ratio;
                const cy = parseFloat(matches[0][2]) * ratio;
                const rx = parseFloat(matches[0][3]) * ratio;
                const ry = parseFloat(matches[0][4]) * ratio;
                return cropper.cropEllipse([cx, cy], rx, ry);
            } else if (selector.value.match(/<path d="([^"]+)"/)) {
                // Get the value of the "d" attribute.
                const matches = [...selector.value.matchAll(/<path d="([^"]+)"/g)];
                const d = matches[0][1];
                // Apply the ration to all numbers in the path.
                const path = d.replace(/([0-9.]+)/g, (match) => {
                    return parseFloat(match) * ratio;
                });
                return cropper.cropSvgPath(path);
            }
        } else if (selector.type === 'FragmentSelector') {
            let selectorValue = selector.value;
            // Remove the "pixel:" from the selector value.
            if (selectorValue.match(/=pixel:/)) {
                selectorValue = selectorValue.replace(/=pixel:/, '=');
            }
            if (selectorValue.match(/^xywh=([0-9\-.,]+)$/)) {
                const matches = [...selectorValue.matchAll(/^xywh=([0-9\-.,]+)$/g)];
                const values = matches[0][1].split(',');
                const x = parseFloat(values[0]) * ratio;
                const y = parseFloat(values[1]) * ratio;
                const w = parseFloat(values[2]) * ratio;
                const h = parseFloat(values[3]) * ratio;
                if (w > 0 && h > 0) {
                    // Rectangles.
                    const points = [
                        [x, y],
                        [x + w, y],
                        [x + w, y + h],
                        [x, y + h],
                    ];
                    return cropper.crop(points);
                } else if (w === 0 && h === 0) {
                    // Points.
                    return cropper.cropCircle([x, y], 50);
                }
            }
        }
        return null;
    }
}
