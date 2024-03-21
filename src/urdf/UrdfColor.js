/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Color element in a URDF.
 */
export default class UrdfColor {
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    // Parse the xml string
    var rgba = options.xml.getAttribute('rgba')?.split(' ');
    if (rgba) {
      this.r = parseFloat(rgba[0]);
      this.g = parseFloat(rgba[1]);
      this.b = parseFloat(rgba[2]);
      this.a = parseFloat(rgba[3]);
    }
  }
}
