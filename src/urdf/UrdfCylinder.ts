/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import {UrdfType} from './UrdfTypes.js';

/**
 * A Cylinder element in a URDF.
 */
export default class UrdfCylinder {
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    this.type = UrdfType.CYLINDER;
    // @ts-expect-error -- possibly null
    this.length = parseFloat(options.xml.getAttribute('length'));
    // @ts-expect-error -- possibly null
    this.radius = parseFloat(options.xml.getAttribute('radius'));
  }
}
