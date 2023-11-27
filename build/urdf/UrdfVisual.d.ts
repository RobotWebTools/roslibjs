export = UrdfVisual;
/**
 * A Visual element in a URDF.
 */
declare class UrdfVisual {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     */
    constructor(options: {
        xml: Element;
    });
    origin: Pose;
    geometry: UrdfBox | UrdfCylinder | UrdfMesh | UrdfSphere | null;
    material: UrdfMaterial | null;
    name: string | null;
}
import Pose = require("../math/Pose");
import UrdfBox = require("./UrdfBox");
import UrdfCylinder = require("./UrdfCylinder");
import UrdfMesh = require("./UrdfMesh");
import UrdfSphere = require("./UrdfSphere");
import UrdfMaterial = require("./UrdfMaterial");
