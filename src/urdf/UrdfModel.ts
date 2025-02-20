/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { DOMParser, MIME_TYPE } from '@xmldom/xmldom';
import UrdfMaterial from './UrdfMaterial.js';
import UrdfLink from './UrdfLink.js';
import UrdfJoint from './UrdfJoint.js';
import { isElement } from './UrdfUtils.js';

// See https://developer.mozilla.org/docs/XPathResult#Constants
// const XPATH_FIRST_ORDERED_NODE_TYPE = 9;

type KeyedObject<T> = { [key: string]: T };

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
  materials: KeyedObject<UrdfMaterial> = {};
  links: KeyedObject<UrdfLink> = {};
  joints: KeyedObject<UrdfJoint> = {};

  constructor({xml, string}: UrdfModelOptions) {
    let xmlDoc = xml;

    // Check if we are using a string or an XML element
    if (string) {
      // Parse the string
      xmlDoc = new DOMParser().parseFromString(string, MIME_TYPE.XML_TEXT).documentElement;
    }

    if (!xmlDoc) {
      throw new Error('No URDF document parsed!');
    }

    // Get the robot name
    this.name = xmlDoc.getAttribute('name');

    const childNodes = xmlDoc.childNodes;
    // Parse all the visual elements we need
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];

      // Safety check to make sure we're working with an element.
      if (!isElement(node)) {
        continue;
      }

      switch (node.tagName) {
        case 'material': {
          const material = new UrdfMaterial({xml: node});
          // Make sure this is unique
          if (!Object.hasOwn(this.materials, material.name)) {
            this.materials[material.name] = material;
            break;
          }

          if (this.materials[material.name].isLink()) {
            this.materials[material.name].assign(material);
          } else {
            console.warn(`Material ${ material.name } is not unique.`);
          }

          break;
        }
        case 'link': {
          const link = new UrdfLink({xml: node});
          // Make sure this is unique
          if (Object.hasOwn(this.links, link.name)) {
            console.warn(`Link ${ link.name } is not unique.`);
            break;
          }

          // Check for a material
          for (let j = 0; j < link.visuals.length; j++) {
            const mat = link.visuals[j].material;
            if (mat === null || !mat.name) {
              continue;
            }

            if (Object.hasOwn(this.materials, mat.name)) {
              link.visuals[j].material = this.materials[mat.name];
            } else {
              this.materials[mat.name] = mat;
            }
          }

          // Add the link
          this.links[link.name] = link;

          break;
        }
        case 'joint': {
          const joint = new UrdfJoint({xml: node});
          this.joints[joint.name] = joint;
          break;
        }
      }
    }
  }
}
