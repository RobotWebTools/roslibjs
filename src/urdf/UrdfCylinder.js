/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfTypes = require('./UrdfTypes');

/**
 * A Cylinder element in a URDF.
 *
 * @constructor
 * @param {Object} options - An object with the following keys:
 * @param {Element} options.xml - The XML element to parse.
 */
function UrdfCylinder(options) {
  this.type = UrdfTypes.URDF_CYLINDER;
  this.length = parseFloat(options.xml.getAttribute('length'));
  this.radius = parseFloat(options.xml.getAttribute('radius'));
}

module.exports = UrdfCylinder;