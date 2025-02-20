/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { Vector3 } from '../math/index.js';
import { UrdfAttrs, UrdfDefaultOptions, UrdfType } from './UrdfTypes.js';

/**
 * A Mesh element in a URDF.
 */
export default class UrdfMesh {
  type: UrdfType;
  scale: Vector3 | null = null;
  filename: string | null;

  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor({xml}: UrdfDefaultOptions) {
    this.type = UrdfType.MESH;
    this.filename = xml.getAttribute('filename');

    // Check for a scale
    const scale: string[] | undefined = xml.getAttribute(UrdfAttrs.Scale)?.split(' ');
    if (!scale || scale.length !== 3) {
      return;
    }

    this.scale = new Vector3({
      x: parseFloat(scale[0]),
      y: parseFloat(scale[1]),
      z: parseFloat(scale[2])
    });
  }
}
