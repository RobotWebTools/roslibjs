/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { UrdfAttrs, UrdfDefaultOptions } from './UrdfTypes.js';

/**
 * A Color element in a URDF.
 */
export default class UrdfColor {

  /**
   * Color Red, [0, 1]
   */
  r: number = 0.0;
  /**
   * Color Green, [0, 1]
   */
  g: number = 0.0;
  /**
   * Color Blue, [0, 1]
   */
  b: number = 0.0;
  /**
   * Alpha/Opacity, [0, 1]
   */
  a: number = 1.0;

  constructor({xml}: UrdfDefaultOptions) {
    // Parse the xml string
    const rgba: string[] | undefined = xml.getAttribute(UrdfAttrs.Rgba)?.split(' ');
    if (!rgba || rgba.length !== 4) {
      return;
    }

    this.r = parseFloat(rgba[0]);
    this.g = parseFloat(rgba[1]);
    this.b = parseFloat(rgba[2]);
    this.a = parseFloat(rgba[3]);
  }
}
