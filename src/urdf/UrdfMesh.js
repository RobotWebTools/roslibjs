/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Mesh element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
ROSLIB.UrdfMesh = function(options) {
  options = options || {};
  var that = this;
  var xml = options.xml;
  this.filename = null;
  this.scale = null;
  this.type = null;

  /**
   * Initialize the element with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    that.type = ROSLIB.URDF_MESH;
    that.filename = xml.getAttribute('filename');

    // Check for a scale
    var scale = xml.getAttribute('scale');
    if (scale) {
      // Get the XYZ
      var xyz = scale.split(' ');
      that.scale = new ROSLIB.Vector3({
        x : parseFloat(xyz[0]),
        y : parseFloat(xyz[1]),
        z : parseFloat(xyz[2])
      });
    }
  };

  // Pass it to the XML parser
  initXml(xml);
};

