/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Color element in a URDF.
 * 
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
ROSLIB.UrdfColor = function(options) {
  var that = this;
  var options = options || {};
  var xml = options.xml;
  this.r = null;
  this.g = null;
  this.b = null;
  this.a = null;

  /**
   * Initialize the element with the given XML node.
   * 
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    // parse the string
    var rgba = xml.getAttribute('rgba').split(' ');
    that.r = parseFloat(rgba[0]);
    that.g = parseFloat(rgba[1]);
    that.b = parseFloat(rgba[2]);
    that.a = parseFloat(rgba[3]);
    return true;
  };

  // pass it to the XML parser
  initXml(xml);
};
