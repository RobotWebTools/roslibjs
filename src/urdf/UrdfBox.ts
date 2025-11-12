/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import Vector3 from "../math/Vector3.ts";
import { UrdfAttrs, UrdfType, type UrdfDefaultOptions } from "./UrdfTypes.ts";
import type { Optional, Nullable } from "../types/interface-types.ts";

/**
 * A Box element in a URDF.
 */
export default class UrdfBox {
  type: UrdfType;
  dimension: Nullable<Vector3> = null;

  constructor({ xml }: UrdfDefaultOptions) {
    this.type = UrdfType.BOX;

    // Parse the xml string
    const size: Optional<string[]> = xml
      .getAttribute(UrdfAttrs.Size)
      ?.split(" ");
    if (!(size?.[0] && size[1] && size[2])) {
      return;
    }

    this.dimension = new Vector3({
      x: parseFloat(size[0]),
      y: parseFloat(size[1]),
      z: parseFloat(size[2]),
    });
  }
}
