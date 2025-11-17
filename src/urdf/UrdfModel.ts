/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import type { Element } from "@xmldom/xmldom";
import { DOMParser, MIME_TYPE } from "@xmldom/xmldom";
import UrdfMaterial from "./UrdfMaterial.ts";
import UrdfLink from "./UrdfLink.ts";
import UrdfJoint from "./UrdfJoint.ts";
import { isElement } from "./UrdfUtils.ts";
import { UrdfAttrs } from "./UrdfTypes.ts";

/*
 * See https://developer.mozilla.org/docs/XPathResult#Constants
 * const XPATH_FIRST_ORDERED_NODE_TYPE = 9;
 */

export interface UrdfModelOptions {
  /**
   * The XML element to parse.
   */
  xml?: Element;
  /**
   * The XML element to parse as a string.
   */
  string: string;
}

/**
 * A URDF Model can be used to parse a given URDF into the appropriate elements.
 */
export default class UrdfModel {
  name: string | null;
  materials: Record<string, UrdfMaterial> = {};
  links: Record<string, UrdfLink> = {};
  joints: Record<string, UrdfJoint> = {};

  constructor({ xml, string }: UrdfModelOptions) {
    let xmlDoc = xml;

    // Check if we are using a string or an XML element
    if (string) {
      // Parse the string
      xmlDoc =
        new DOMParser().parseFromString(string, MIME_TYPE.XML_TEXT)
          .documentElement ?? undefined;
    }

    if (!xmlDoc) {
      throw new Error("No URDF document parsed!");
    }

    // Get the robot name
    this.name = xmlDoc.getAttribute(UrdfAttrs.Name);

    const childNodes = xmlDoc.childNodes;
    // Parse all the visual elements we need
    for (const node of childNodes) {
      // Safety check to make sure we're working with an element.
      if (!isElement(node)) {
        continue;
      }

      switch (node.tagName) {
        case "material": {
          const material = new UrdfMaterial({ xml: node });
          // Make sure this is unique
          if (!Object.hasOwn(this.materials, material.name)) {
            this.materials[material.name] = material;
            break;
          }

          const existingMaterial = this.materials[material.name];
          if (existingMaterial?.isLink()) {
            existingMaterial.assign(material);
          } else {
            console.warn(`Material ${material.name} is not unique.`);
          }

          break;
        }
        case "link": {
          const link = new UrdfLink({ xml: node });
          // Make sure this is unique
          if (Object.hasOwn(this.links, link.name)) {
            console.warn(`Link ${link.name} is not unique.`);
            break;
          }

          // Check for a material
          for (const item of link.visuals) {
            const mat = item.material;
            if (!mat?.name) {
              continue;
            }

            const material = this.materials[mat.name];
            if (material) {
              item.material = material;
            } else {
              this.materials[mat.name] = mat;
            }
          }

          // Add the link
          this.links[link.name] = link;

          break;
        }
        case "joint": {
          const joint = new UrdfJoint({ xml: node });
          this.joints[joint.name] = joint;
          break;
        }
      }
    }
  }
}
