export = UrdfMaterial;
/**
 * A Material element in a URDF.
 */
declare class UrdfMaterial {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     */
    constructor(options: {
        xml: Element;
    });
    textureFilename: string | null;
    color: UrdfColor | null;
    name: string | null;
    isLink(): boolean;
    assign(obj: any): any;
}
import UrdfColor = require("./UrdfColor");
