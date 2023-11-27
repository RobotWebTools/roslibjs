export = UrdfLink;
/**
 * A Link element in a URDF.
 */
declare class UrdfLink {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     */
    constructor(options: {
        xml: Element;
    });
    name: string | null;
    visuals: UrdfVisual[];
}
import UrdfVisual = require("./UrdfVisual");
