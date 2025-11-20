/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { UrdfAttrs, type UrdfDefaultOptions, UrdfType } from "./UrdfTypes.ts";

/**
 * A Sphere element in a URDF.
 */
export default class UrdfSphere {
  type: UrdfType;
  radius = NaN;

  constructor({ xml }: UrdfDefaultOptions) {
    this.type = UrdfType.SPHERE;
    this.radius = parseFloat(xml.getAttribute(UrdfAttrs.Radius) ?? "NaN");
  }
}
