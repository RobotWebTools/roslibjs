/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import * as UrdfTypes from './UrdfTypes.js';

/**
 * A Sphere element in a URDF.
 */
export default class UrdfSphere {
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    this.type = UrdfTypes.URDF_SPHERE;
    this.radius = parseFloat(options.xml.getAttribute('radius') || 'NaN');
  }
}
