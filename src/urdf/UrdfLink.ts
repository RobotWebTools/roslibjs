/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import UrdfVisual from "./UrdfVisual.ts";
import { UrdfAttrs, type UrdfDefaultOptions } from "./UrdfTypes.ts";

/**
 * A Link element in a URDF.
 */
export default class UrdfLink {
  name: string;
  visuals: UrdfVisual[] = [];

  constructor({ xml }: UrdfDefaultOptions) {
    this.name = xml.getAttribute(UrdfAttrs.Name) ?? "unknown_name";
    const visuals = xml.getElementsByTagName(UrdfAttrs.Visuals);

    for (const visual of visuals) {
      this.visuals.push(
        new UrdfVisual({
          xml: visual,
        }),
      );
    }
  }
}
