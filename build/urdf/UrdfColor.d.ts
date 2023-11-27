export = UrdfColor;
/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */
/**
 * A Color element in a URDF.
 */
declare class UrdfColor {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     */
    constructor(options: {
        xml: Element;
    });
    r: number;
    g: number;
    b: number;
    a: number;
}
