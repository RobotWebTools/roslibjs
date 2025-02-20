/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { UrdfDefaultOptions, UrdfType } from './UrdfTypes.js';

/**
 * A Sphere element in a URDF.
 */
export default class UrdfSphere {

  type: UrdfType;
  radius: number = NaN;

  constructor({xml}: UrdfDefaultOptions) {
    this.type = UrdfType.SPHERE;
    this.radius = parseFloat(xml.getAttribute('radius') ?? 'NaN');
  }
}
