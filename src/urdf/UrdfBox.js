/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import Vector3 from '../math/Vector3.js';
import * as UrdfTypes from './UrdfTypes.js';

/**
 * A Box element in a URDF.
 */
export default class UrdfBox {
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    this.dimension = null;
    this.type = UrdfTypes.URDF_BOX;

    // Parse the xml string
    // @ts-expect-error -- possibly null
    var xyz = options.xml.getAttribute('size').split(' ');
    this.dimension = new Vector3({
      x: parseFloat(xyz[0]),
      y: parseFloat(xyz[1]),
      z: parseFloat(xyz[2])
    });
  }
}
