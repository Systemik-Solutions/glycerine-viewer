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
        }
        return term;
    }

    /**
     * Create the annotorious formatter function.
     *
     * @returns {function(*): {className: string}}
     */
    static annotoriousFormatter() {
        return function (annotation) {
            let className = 'rdwb-ano-shape';
            let lineColor = 'Medium';
            if (typeof annotation.body[0] !== "undefined") {
                const annotationData = annotation.body[0].value;
                if (typeof annotationData.fields?.["Line Color"]?.en !== "undefined") {
                    lineColor = annotationData.fields["Line Color"].en[0];
                }
            }
            if (lineColor === 'Light') {
                //formatter.style = 'stroke:#A9BCE3;';
                className += ' outline-light';
            } else if (lineColor === 'Dark') {
                //formatter.style = 'stroke:#1E3E82;';
                className += ' outline-dark';
            } else {
                //formatter.style = 'stroke:#506DAC;';
                className += ' outline-normal';
            }
            return {
                className: className
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
}
