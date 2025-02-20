/**
 * @fileOverview
 * @author David V. Lu!! - davidvlu@gmail.com
 */

import { UrdfAttrs, UrdfDefaultOptions } from './UrdfTypes.js';
import { Pose } from '../math/index.js';
import { parseUrdfOrigin } from './UrdfUtils.js';

/**
 * A Joint element in a URDF.
 */
export default class UrdfJoint {

  name: string;
  type: string | null;
  parent: string | null = null;
  child: string | null = null;
  minval: number = NaN;
  maxval: number = NaN;
  origin: Pose = new Pose();


  constructor({xml}: UrdfDefaultOptions) {
    this.name = xml.getAttribute(UrdfAttrs.Name) ?? 'unknown_name';
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
      this.minval = parseFloat(limits[0].getAttribute(UrdfAttrs.Lower) ?? 'NaN');
      this.maxval = parseFloat(limits[0].getAttribute(UrdfAttrs.Upper) ?? 'NaN');
    }

    // Origin
    const origins = xml.getElementsByTagName(UrdfAttrs.Origin);
    if (origins.length > 0) {
      this.origin = parseUrdfOrigin(origins[0]);
    }
  }
}
