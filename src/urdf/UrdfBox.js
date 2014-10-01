/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var Vector3 = require('../math/Vector3');
var UrdfTypes = require('./UrdfTypes');

/**
 * A Box element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfBox(options) {
  options = options || {};
  var that = this;
  var xml = options.xml;
  this.dimension = null;
  this.type = null;

  /**
   * Initialize the element with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    that.type = UrdfTypes.URDF_BOX;

    // Parse the string
    var xyz = xml.getAttribute('size').split(' ');
    that.dimension = new Vector3({
      x : parseFloat(xyz[0]),
      y : parseFloat(xyz[1]),
      z : parseFloat(xyz[2])
    });
  };

  // Pass it to the XML parser
  initXml(xml);
}

module.exports = UrdfBox;