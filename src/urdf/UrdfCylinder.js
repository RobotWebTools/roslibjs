/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfTypes = require('./UrdfTypes');

/**
 * A Cylinder element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfCylinder(options) {
  options = options || {};
  var that = this;
  var xml = options.xml;
  this.type = null;
  this.length = null;
  this.radius = null;

  /**
   * Initialize the element with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    that.type = UrdfTypes.URDF_CYLINDER;
    that.length = parseFloat(xml.getAttribute('length'));
    that.radius = parseFloat(xml.getAttribute('radius'));
  };

  // Pass it to the XML parser
  initXml(xml);
}

module.exports = UrdfCylinder;