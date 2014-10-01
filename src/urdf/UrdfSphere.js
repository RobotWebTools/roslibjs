/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfTypes = require('./UrdfTypes');

/**
 * A Sphere element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfSphere(options) {
  options = options || {};
  var that = this;
  var xml = options.xml;
  this.radius = null;
  this.type = null;

  /**
   * Initialize the element with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    that.type = UrdfTypes.URDF_SPHERE;
    that.radius = parseFloat(xml.getAttribute('radius'));
  };

  // pass it to the XML parser
  initXml(xml);
}

module.exports = UrdfSphere;