/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfVisual = require('./UrdfVisual');

/**
 * A Link element in a URDF.
 */
class UrdfLink {
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    this.name = options.xml.getAttribute('name');
    this.visuals = [];
    var visuals = options.xml.getElementsByTagName('visual');

    for (var i = 0; i < visuals.length; i++) {
      this.visuals.push(
        new UrdfVisual({
          xml: visuals[i]
        })
      );
    }
  }
}

module.exports = UrdfLink;
