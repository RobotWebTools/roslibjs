export = UrdfBox;
/**
 * A Box element in a URDF.
 */
declare class UrdfBox {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     */
    constructor(options: {
        xml: Element;
    });
    dimension: Vector3;
    type: number;
}
import Vector3 = require("../math/Vector3");
