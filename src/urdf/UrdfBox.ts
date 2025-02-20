/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { Vector3 } from '../math/index.js';
import { UrdfAttrs, UrdfDefaultOptions, UrdfType } from './UrdfTypes.js';

/**
 * A Box element in a URDF.
 */
export default class UrdfBox {
  type: UrdfType;
  dimension: Vector3 | null = null;

  constructor({xml}: UrdfDefaultOptions) {
    this.type = UrdfType.BOX;

    // Parse the xml string
    const size: string[] | undefined = xml.getAttribute(UrdfAttrs.Size)?.split(' ');
    if (!size || size.length !== 3) {
      return;
    }

    this.dimension = new Vector3({
      x: parseFloat(size[0]),
      y: parseFloat(size[1]),
      z: parseFloat(size[2])
    });
  }
}
