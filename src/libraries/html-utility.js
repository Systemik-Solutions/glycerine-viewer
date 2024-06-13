import DOMPurify from 'dompurify';

export default class HtmlUtility {

    /**
     * Detect whether a string is HTML.
     *
     * This follows the rules specified in IIIF Presentation API 3.0.
     * Reference: https://iiif.io/api/presentation/3.0/#45-html-markup-in-property-values
     *
     * @param {string} text
     *   The text to test.
     *
     * @returns {boolean}
     *   Whether the text is HTML.
     */
    static detectHtml(text) {
        if (!text) {
            return false;
        }
        // Test the text:  the first character in the string must be a ‘<’ character and the last character must be ‘>’.
        return text.charAt(0) === '<' && text.charAt(text.length - 1) === '>';
    }

    /**
     * Sanitize HTML.
     *
     * This follows the rules specified in IIIF Presentation API 3.0.
     * Reference: https://iiif.io/api/presentation/3.0/#45-html-markup-in-property-values
     *
     * @param {string} html
     *   The HTML to sanitize.
     *
     * @returns {string}
     *   The sanitized HTML.
     */
    static sanitizeHtml(html) {
        const config = {
            ALLOWED_TAGS: ['a', 'b', 'br', 'i', 'img', 'p', 'small', 'span', 'sub', 'sup'],
            ALLOWED_ATTR: ['href', 'src', 'alt'],
            ALLOW_DATA_ATTR: false,
            ALLOWED_URI_REGEXP: /^(?:https?|mailto):\/\/\S*|mailto:\S*$/i,
        };
        return DOMPurify.sanitize(html, config);
    }
}
