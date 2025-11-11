/**
 * @fileOverview
 * @author David V. Lu!! - davidvlu@gmail.com
 */

import { UrdfAttrs, type UrdfDefaultOptions } from "./UrdfTypes.js";
import Pose from "../math/Pose.js";
import Vector3 from "../math/Vector3.js";
import { parseUrdfOrigin } from "./UrdfUtils.js";
import type { Nullable } from "../types/interface-types.js";

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
    if (parents.length > 0) {
      this.parent = parents[0].getAttribute(UrdfAttrs.Link);
    }

    const children = xml.getElementsByTagName(UrdfAttrs.Child);
    if (children.length > 0) {
      this.child = children[0].getAttribute(UrdfAttrs.Link);
    }

    const limits = xml.getElementsByTagName(UrdfAttrs.Limit);
    if (limits.length > 0) {
      this.minval = parseFloat(
        limits[0].getAttribute(UrdfAttrs.Lower) ?? "NaN",
      );
      this.maxval = parseFloat(
        limits[0].getAttribute(UrdfAttrs.Upper) ?? "NaN",
      );
    }

    // Origin
    const origins = xml.getElementsByTagName(UrdfAttrs.Origin);
    if (origins.length > 0) {
      this.origin = parseUrdfOrigin(origins[0]);
    }

    const axis = xml.getElementsByTagName(UrdfAttrs.Axis);
    if (axis.length > 0) {
      const xyzValue = axis[0].getAttribute(UrdfAttrs.Xyz)?.split(" ");
      if (!xyzValue || xyzValue.length !== 3) {
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
