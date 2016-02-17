/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfColor = require('./UrdfColor');

/**
 * A Material element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfMaterial(options) {
  this.textureFilename = null;
  this.color = null;

  this.name = options.xml.getAttribute('name');

  // Texture
  var textures = options.xml.getElementsByTagName('texture');
  if (textures.length > 0) {
    this.textureFilename = textures[0].getAttribute('filename');
  }

  // Color
  var colors = options.xml.getElementsByTagName('color');
  if (colors.length > 0) {
    // Parse the RBGA string
    this.color = new UrdfColor({
      xml : colors[0]
    });
  }
}

UrdfMaterial.prototype.isLink = function() {
  return this.color === null && this.textureFilename === null;
};

var assign = require('object-assign');

UrdfMaterial.prototype.assign = function(obj) {
    return assign(this, obj);
};

module.exports = UrdfMaterial;
