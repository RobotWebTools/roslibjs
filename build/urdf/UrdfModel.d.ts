export = UrdfModel;
/**
 * A URDF Model can be used to parse a given URDF into the appropriate elements.
 */
declare class UrdfModel {
    /**
     * @param {Object} options
     * @param {Element} options.xml - The XML element to parse.
     * @param {string} options.string - The XML element to parse as a string.
     */
    constructor(options: {
        xml: Element;
        string: string;
    });
    materials: {};
    links: {};
    joints: {};
    name: string | null;
}
