export = UrdfMesh;
/**
 * A Mesh element in a URDF.
 */
declare class UrdfMesh {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     */
    constructor(options: {
        xml: Element;
    });
    scale: Vector3 | null;
    type: number;
    filename: string | null;
}
import Vector3 = require("../math/Vector3");
