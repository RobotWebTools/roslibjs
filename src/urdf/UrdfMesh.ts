/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import Vector3 from "../math/Vector3.js";
import { UrdfAttrs, type UrdfDefaultOptions, UrdfType } from "./UrdfTypes.js";

/**
 * A Mesh element in a URDF.
 */
export default class UrdfMesh {
  type: UrdfType;
  scale: Vector3 | null = null;
  filename: string | null;

  constructor({ xml }: UrdfDefaultOptions) {
    this.type = UrdfType.MESH;
    this.filename = xml.getAttribute(UrdfAttrs.Filename);

    // Check for a scale
    const scale = xml.getAttribute(UrdfAttrs.Scale)?.split(" ");
    if (!(scale?.[0] && scale[1] && scale[2])) {
      return;
    }

    this.scale = new Vector3({
      x: parseFloat(scale[0]),
      y: parseFloat(scale[1]),
      z: parseFloat(scale[2]),
    });
  }
}
