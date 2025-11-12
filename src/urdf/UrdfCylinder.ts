/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { type UrdfDefaultOptions, UrdfType, UrdfAttrs } from "./UrdfTypes.ts";

/**
 * A Cylinder element in a URDF.
 */
export default class UrdfCylinder {
  type: UrdfType;
  length: number;
  radius: number;

  constructor({ xml }: UrdfDefaultOptions) {
    this.type = UrdfType.CYLINDER;

    this.length = parseFloat(xml.getAttribute(UrdfAttrs.Length) ?? "NaN");
    this.radius = parseFloat(xml.getAttribute(UrdfAttrs.Radius) ?? "NaN");
  }
}
