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

    /**
     * Traverse the structure of the manifest.
     *
     * @param {Array} structures
     *   The structures to traverse.
     * @param {Function} callback
     *   The callback function to call for each structure node.
     */
    static structureTraverse(structures, callback) {
        for (const structure of structures) {
            callback(structure);
            if (structure.items) {
                this.structureTraverse(structure.items, callback);
            }
        }
    }
}
