/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Box element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
ROSLIB.UrdfBox = function(options) {
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
    this.type = ROSLIB.URDF_BOX;

    // Parse the string
    var xyz = xml.getAttribute('size').split(' ');
    that.dimension = new ROSLIB.Vector3({
      x : parseFloat(xyz[0]),
      y : parseFloat(xyz[1]),
      z : parseFloat(xyz[2])
    });
  };

  // Pass it to the XML parser
  initXml(xml);
};
