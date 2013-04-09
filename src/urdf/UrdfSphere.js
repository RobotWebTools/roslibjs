/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Sphere element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
ROSLIB.UrdfSphere = function(options) {
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
    that.type = ROSLIB.URDF_SPHERE;
    that.radius = parseFloat(xml.getAttribute('radius'));
  };

  // pass it to the XML parser
  initXml(xml);
};

