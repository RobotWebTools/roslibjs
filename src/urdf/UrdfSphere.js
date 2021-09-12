/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import * as UrdfTypes from './UrdfTypes.js';

/**
 * A Sphere element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
export function UrdfSphere(options) {
  this.type = UrdfTypes.URDF_SPHERE;
  this.radius = parseFloat(options.xml.getAttribute('radius'));
}
