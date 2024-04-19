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
                vocabId: termValue.vocabulary_id,
                vocabTitle: termValue.vocabulary_name,
            },
        };
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
}
