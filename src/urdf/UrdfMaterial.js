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
  options = options || {};
  var that = this;
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

    // Texture
    var textures = xml.getElementsByTagName('texture');
    if (textures.length > 0) {
      that.textureFilename = textures[0].getAttribute('filename');
    }

    // Color
    var colors = xml.getElementsByTagName('color');
    if (colors.length > 0) {
      // Parse the RBGA string
      that.color = new ROSLIB.UrdfColor({
        xml : colors[0]
      });
    }
  };

  // Pass it to the XML parser
  initXml(xml);
};
