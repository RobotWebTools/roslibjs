/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfVisual = require('./UrdfVisual');

/**
 * A Link element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfLink(options) {
  this.name = options.xml.getAttribute('name');
  var visuals = options.xml.getElementsByTagName('visual');
  if (visuals.length > 0) {
    this.visual = new UrdfVisual({
      xml : visuals[0]
    });
  }
}

module.exports = UrdfLink;