/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Material element in a URDF.
 * 
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
ROSLIB.UrdfMaterial = function(options) {
  var that = this;
  var options = options || {};
  var xml = options.xml;
  this.name = null;
  this.textureFilename = null;
  this.color = null;

  /**
   * Initialize the element with the given XML node.
   * 
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    that.name = xml.getAttribute('name');

    // texture
    var textures = xml.getElementsByTagName('texture');
    if (textures.length > 0) {
      that.textureFilename = textures[0].getAttribute('filename');
    }

    // color
    var colors = xml.getElementsByTagName('color');
    if (colors.length > 0) {
      // parse the RBGA string
      that.color = new ROSLIB.UrdfColor({
        xml : colors[0]
      });
    }
  };

  // pass it to the XML parser
  initXml(xml);
};
