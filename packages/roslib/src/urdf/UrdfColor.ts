/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { UrdfAttrs, type UrdfDefaultOptions } from "./UrdfTypes.ts";
import type { Optional } from "../types/interface-types.ts";

/**
 * A Color element in a URDF.
 */
export default class UrdfColor {
  /**
   * Color Red, [0, 1]
   */
  r = 0.0;
  /**
   * Color Green, [0, 1]
   */
  g = 0.0;
  /**
   * Color Blue, [0, 1]
   */
  b = 0.0;
  /**
   * Alpha/Opacity, [0, 1]
   */
  a = 1.0;

  constructor({ xml }: UrdfDefaultOptions) {
    // Parse the xml string
    const rgba: Optional<string[]> = xml
      .getAttribute(UrdfAttrs.Rgba)
      ?.split(" ");
    if (!(rgba?.[0] && rgba[1] && rgba[2] && rgba[3])) {
      return;
    }

    this.r = parseFloat(rgba[0]);
    this.g = parseFloat(rgba[1]);
    this.b = parseFloat(rgba[2]);
    this.a = parseFloat(rgba[3]);
  }
}
