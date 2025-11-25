/**
 * @fileOverview
 * @author David V. Lu!! - davidvlu@gmail.com
 */

import { UrdfAttrs, type UrdfDefaultOptions } from "./UrdfTypes.ts";
import Pose from "../math/Pose.ts";
import Vector3 from "../math/Vector3.ts";
import { parseUrdfOrigin } from "./UrdfUtils.ts";
import type { Nullable } from "../types/interface-types.ts";

/**
 * A Joint element in a URDF.
 */
export default class UrdfJoint {
  name: string;
  type: Nullable<string>;
  parent: Nullable<string> = null;
  child: Nullable<string> = null;
  minval = NaN;
  maxval = NaN;
  origin: Pose = new Pose();
  axis: Vector3 = new Vector3({
    x: 1,
    y: 0,
    z: 0,
  });

  constructor({ xml }: UrdfDefaultOptions) {
    this.name = xml.getAttribute(UrdfAttrs.Name) ?? "unknown_name";
    this.type = xml.getAttribute(UrdfAttrs.Type);

    const parents = xml.getElementsByTagName(UrdfAttrs.Parent);
    if (parents[0]) {
      this.parent = parents[0].getAttribute(UrdfAttrs.Link);
    }

    const children = xml.getElementsByTagName(UrdfAttrs.Child);
    if (children[0]) {
      this.child = children[0].getAttribute(UrdfAttrs.Link);
    }

    const limits = xml.getElementsByTagName(UrdfAttrs.Limit);
    if (limits[0]) {
      this.minval = parseFloat(
        limits[0].getAttribute(UrdfAttrs.Lower) ?? "NaN",
      );
      this.maxval = parseFloat(
        limits[0].getAttribute(UrdfAttrs.Upper) ?? "NaN",
      );
    }

    // Origin
    const origins = xml.getElementsByTagName(UrdfAttrs.Origin);
    if (origins[0]) {
      this.origin = parseUrdfOrigin(origins[0]);
    }

    const axis = xml.getElementsByTagName(UrdfAttrs.Axis);
    if (axis[0]) {
      const xyzValue = axis[0].getAttribute(UrdfAttrs.Xyz)?.split(" ");
      if (xyzValue?.length !== 3) {
        throw new Error(
          "If specified, axis must have an xyz value composed of three numbers",
        );
      }
      const [x, y, z] = xyzValue.map(parseFloat);
      this.axis = new Vector3({
        x,
        y,
        z,
      });
    }
  }
}
