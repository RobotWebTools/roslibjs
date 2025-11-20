/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import UrdfColor from "./UrdfColor.ts";
import { UrdfAttrs, type UrdfDefaultOptions } from "./UrdfTypes.ts";
import type { Nullable } from "../types/interface-types.ts";

/**
 * A Material element in a URDF.
 */
export default class UrdfMaterial {
  name: string;
  textureFilename: Nullable<string> = null;
  color: Nullable<UrdfColor> = null;

  constructor({ xml }: UrdfDefaultOptions) {
    this.name = xml.getAttribute(UrdfAttrs.Name) ?? "unknown_name";

    // Texture
    const textures = xml.getElementsByTagName(UrdfAttrs.Texture);
    if (textures[0]) {
      this.textureFilename = textures[0].getAttribute(UrdfAttrs.Filename);
    }

    // Color
    const colors = xml.getElementsByTagName(UrdfAttrs.Color);
    if (colors[0]) {
      // Parse the RBGA string
      this.color = new UrdfColor({
        xml: colors[0],
      });
    }
  }

  isLink() {
    return this.color === null && this.textureFilename === null;
  }

  assign(obj: UrdfMaterial): this & UrdfMaterial {
    return Object.assign(this, obj);
  }
}
