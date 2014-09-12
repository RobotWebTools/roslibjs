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
  options = options || {};
  var that = this;
  var xml = options.xml;
  this.name = null;
  this.visual = null;

  /**
   * Initialize the element with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    that.name = xml.getAttribute('name');
    var visuals = xml.getElementsByTagName('visual');
    if (visuals.length > 0) {
      that.visual = new UrdfVisual({
        xml : visuals[0]
      });
    }
  };

  // Pass it to the XML parser
  initXml(xml);
}

module.exports = UrdfLink;