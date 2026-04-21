import moment from "moment/moment";

/**
 * Class of helper functions.
 */
export default class Helper {

    /**
     * Format the date for UI display.
     *
     * @param {string} date
     * @returns {string}
     */
    static formatDate(date) {
        return moment(date).format('DD/MM/YYYY');
    }

    /**
     * Create the term object from the term value.
     *
     * @param {Object} termValue
     *   The original term value from the manifest.
     * @returns {{data: {label: *, vocabTitle: *, vocabId: *}, label: *, key: *}}
     */
    static createTermObject(termValue) {
        const term = {
            key: termValue.term_id,
            label: termValue.term_label,
            data: {
                label: termValue.term_label,
            },
        };
        if (termValue.vocabulary_id) {
            term.data.vocabId = termValue.vocabulary_id;
        }
        if (termValue.vocabulary_name) {
            term.data.vocabTitle = termValue.vocabulary_name;
        }
        if (termValue.data) {
            if (termValue.data.description) {
                term.data.description = termValue.data.description;
            }
            if (termValue.data.trace) {
                term.data.trace = termValue.data.trace;
            }
            if (termValue.data.link) {
                term.data.link = termValue.data.link;
            }
        }
        return term;
    }

    /**
     * Create the Annotorious v3 style function.
     *
     * @param {function(): {highlightedId: string|null, playingId: string|null, fillOpacity: number}} getState
     *   Returns the current reactive style inputs each time the styler is invoked.
     *
     * @returns {function(annotation, state): object}
     */
    static annotoriousStyle(getState) {
        return function (annotation, state) {
            const { highlightedId, playingId, fillOpacity } = getState();
            const data = annotation.bodies?.[0]?.value
                      ?? annotation.body?.[0]?.value ?? {};
            const lineColor = data.lineColor || '#506DAC';
            const lineWeight = data.lineWeight || 'medium';
            const lum = lineWeight === 'light' ? 0.7
                      : lineWeight === 'dark' ? -0.5 : 0;
            const stroke = Helper.adjustColor(lineColor, lum);

            const isSelected = !!(state?.selected ?? state?.isSelected);
            const isHover = !!(state?.hovered ?? state?.isHovered);
            const isPlaying = annotation.id === playingId;
            const isHighlighted = annotation.id === highlightedId;
            const flashing = isSelected || isHover || isPlaying;

            return {
                fill: stroke,
                fillOpacity: isHighlighted ? 0.2 : fillOpacity,
                stroke: flashing ? '#fff000' : stroke,
                strokeOpacity: 1,
                strokeWidth: 2,
            };
        };
    }

    /**
     * Check if the text is a URL.
     *
     * @param {string} text
     * @returns {boolean}
     */
    static isURL(text) {
        return text.match(/^https?:\/\/\S*$/i);
    }

    /**
     * Generate a UUID (v4).
     *
     * @returns {string}
     */
    static generateUUID() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    /**
     * Adjust the color luminosity.
     *
     * @param {String} color
     *   The hex color code.
     * @param {Number} percentage
     *   The percentage (-1 to 1) to adjust the luminosity. Negative values darken the color. Positive values lighten
     *   the color.
     * @returns {string}
     *   The adjusted color code.
     */
    static adjustColor(color, percentage) {
        // validate hex string
        color = String(color).replace(/[^0-9a-f]/gi, '');
        if (color.length < 6) {
            color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
        }
        percentage = percentage || 0;

        // convert to decimal and change luminosity
        let rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(color.substring(i * 2, i * 2 + 2), 16);

            c = Math.round(Math.min(Math.max(0, c + (c * percentage)), 255)).toString(16);
            rgb += ("00" + c).substring(c.length);
        }

        return rgb;
    }
}
