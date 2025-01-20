/**
 * Class to crop image area.
 */
export default class ImageCropper {

    /**
     * Constructor
     *
     * @param {HTMLElement} image
     *   The DOM element of the source image.
     */
    constructor(image) {
        this.image = image;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;
        this.canvasContext = this.canvas.getContext("2d");
    }

    /**
     * Crop a polygon area from the image.
     *
     * @param {Array} points
     *   Two dimension array with each element contains the x and y coordinates.
     * @returns {string}
     *   The base64 image data of the cropped image.
     */
    crop(points) {
        const cropAreaCords = this._calculateCropRectCoordinates(points);
        const cropAreaWidth = cropAreaCords[1][0] - cropAreaCords[0][0];
        const cropAreaHeight = cropAreaCords[1][1] - cropAreaCords[0][1];
        this.canvasContext.save();
        this.resetCanvas();
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            this.canvasContext.lineTo(points[i][0], points[i][1]);
        }
        this.canvasContext.closePath();
        this.canvasContext.clip();
        this.canvasContext.drawImage(this.image,0,0);
        this.canvasContext.restore();
        return this._createCropImage(cropAreaCords[0], cropAreaWidth, cropAreaHeight);
    }

    /**
     * Crop a circle area from the image.
     *
     * @param {number[]} center
     *   The x and y coordinates of the circle center.
     * @param {number} radius
     *   The circle radius.
     * @returns {string}
     *   The base64 image data of the cropped image.
     */
    cropCircle(center, radius) {
        const areaStartPoint = [center[0] - radius, center[1] - radius];
        this.canvasContext.save();
        this.resetCanvas();
        this.canvasContext.beginPath();
        this.canvasContext.arc(center[0], center[1], radius, 0, 2 * Math.PI, false);
        this.canvasContext.clip();
        this.canvasContext.drawImage(this.image,0,0);
        this.canvasContext.restore();
        return this._createCropImage(areaStartPoint, radius * 2, radius * 2);
    }

    /**
     * Crop an ellipse area from the image.
     *
     * @param {number[]} center
     *   The x and y coordinates of the ellipse center.
     * @param {number} radiusX
     *   The ellipse radius on the x axis.
     * @param {number} radiusY
     *   The ellipse radius on the y axis.
     * @returns {string}
     *   The base64 image data of the cropped image.
     */
    cropEllipse(center, radiusX, radiusY) {
        const areaStartPoint = [center[0] - radiusX, center[1] - radiusY];
        this.canvasContext.save();
        this.resetCanvas();
        this.canvasContext.beginPath();
        this.canvasContext.ellipse(center[0], center[1], radiusX, radiusY, 0, 0, 2 * Math.PI, false);
        this.canvasContext.clip();
        this.canvasContext.drawImage(this.image,0,0);
        this.canvasContext.restore();
        return this._createCropImage(areaStartPoint, radiusX * 2, radiusY * 2);
    }

    /**
     * Crop an SVG path area from the image.
     *
     * @param {string} d
     *   The value of the "d" attribute of the SVG path.
     * @returns {string}
     */
    cropSvgPath(d) {
        // Convert the SVG path to polygon points.
        // Use Path2D and SVGGeometryElement to get points
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', d);
        const path = new Path2D(d);
        const points = [];

        const length = pathElement.getTotalLength();
        const step = 1; // Adjust this for higher/lower resolution

        for (let i = 0; i <= length; i += step) {
            const { x, y } = pathElement.getPointAtLength(i);
            points.push([x, y]);
        }
        return this.crop(points);
    }

    /**
     * Clear and reset the canvas.
     */
    resetCanvas() {
        this.canvasContext.clearRect(0, 0, this.image.width, this.image.height);
    }

    /**
     * Create the crop image.
     *
     * @param {number[]} startCord
     *   The coordinates of the crop area start point.
     * @param {number} width
     *   The crop area width.
     * @param {number} height
     *   The crop area height.
     * @returns {string}
     *   The base64 image data of the cropped image.
     * @private
     */
    _createCropImage(startCord, width, height) {
        const transCanvas = document.createElement('canvas');
        const transContext = transCanvas.getContext('2d');
        transCanvas.width = width;
        transCanvas.height = height;
        transContext.drawImage(this.canvas, startCord[0], startCord[1], width, height, 0, 0, width, height);
        const cropImageURL = transCanvas.toDataURL();
        transCanvas.remove();
        return cropImageURL;
    }

    /**
     * Calculate the corner point of the rectangle crop area.
     *
     * @param {Array} points
     *   Two dimension array with each element contains the x and y coordinates.
     * @returns {Array}
     *   The array contains the x and y of the top left corner and the bottom right corner.
     * @private
     */
    _calculateCropRectCoordinates(points) {
        let minX = null;
        let minY = null;
        let maxX = null;
        let maxY = null;
        for(let i = 1; i < points.length; i++) {
            let x = points[i][0];
            let y = points[i][1];
            if (minX === null || x < minX) {
                minX = x;
            }
            if (minY === null || y < minY) {
                minY = y;
            }
            if (maxX === null || x > maxX) {
                maxX = x;
            }
            if (maxY === null || y > maxY) {
                maxY = y;
            }
        }
        return [
            [minX, minY],
            [maxX, maxY]
        ];
    }
}
