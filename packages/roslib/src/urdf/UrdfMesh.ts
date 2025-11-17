/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import Vector3 from "../math/Vector3.ts";
import { UrdfAttrs, type UrdfDefaultOptions, UrdfType } from "./UrdfTypes.ts";
import type { Nullable, Optional } from "../types/interface-types.ts";

/**
 * A Mesh element in a URDF.
 */
export default class UrdfMesh {
  type: UrdfType;
  scale: Nullable<Vector3> = null;
  filename: Nullable<string>;

  constructor({ xml }: UrdfDefaultOptions) {
    this.type = UrdfType.MESH;
    this.filename = xml.getAttribute(UrdfAttrs.Filename);

    // Check for a scale
    const scale: Optional<string[]> = xml
      .getAttribute(UrdfAttrs.Scale)
      ?.split(" ");
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
