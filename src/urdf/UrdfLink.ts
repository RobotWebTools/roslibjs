/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import UrdfVisual from './UrdfVisual.js';
import { UrdfAttrs, UrdfDefaultOptions } from './UrdfTypes.js';

/**
 * A Link element in a URDF.
 */
export default class UrdfLink {

  name: string;
  visuals: UrdfVisual[] = [];

  constructor({xml}: UrdfDefaultOptions) {
    this.name = xml.getAttribute(UrdfAttrs.Name) ?? 'unknown_name';
    const visuals = xml.getElementsByTagName(UrdfAttrs.Visuals);

    for (let i = 0; i < visuals.length; i++) {
      this.visuals.push(
        new UrdfVisual({
          xml: visuals[i]
        })
      );
    }
  }
}
