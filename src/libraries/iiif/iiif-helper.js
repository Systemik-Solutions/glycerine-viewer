export class IiifHelper {

    /**
     * Detect the IIIF Presentation API version from the manifest.
     *
     * @param {Object} manifest
     *   The manifest data.
     * @returns {null|string}
     *   The detected version or null if not detected.
     */
    static detectPresentationApiVersion(manifest) {
        if (manifest['@context']) {
            let context = manifest['@context'];
            if (Array.isArray(context)) {
                // Get the last item.
                context = context[context.length - 1];
            }
            if (context === 'http://iiif.io/api/presentation/2/context.json') {
                return '2.0';
            } else if (context === 'http://iiif.io/api/presentation/3/context.json') {
                return '3.0';
            }
        }
        return null;
    }
}
