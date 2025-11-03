/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import { Element } from '@xmldom/xmldom';
import Pose from '../math/Pose.js';
import UrdfCylinder from './UrdfCylinder.js';
import UrdfBox from './UrdfBox.js';
import UrdfMaterial from './UrdfMaterial.js';
import UrdfMesh from './UrdfMesh.js';
import UrdfSphere from './UrdfSphere.js';
import { UrdfAttrs, type UrdfDefaultOptions } from './UrdfTypes.js';
import { isElement, parseUrdfOrigin } from './UrdfUtils.js';

export type UrdfGeometryLike = UrdfMesh | UrdfSphere | UrdfBox | UrdfCylinder;

function parseUrdfGeometry(geometryElem: Element): UrdfGeometryLike | null {

  let childShape: Element | null = null;
  for (const childNode of geometryElem.childNodes) {
    if (isElement(childNode)) {
      // Safe type check after checking nodeType
      childShape = childNode;
      break;
    }
  }

  if (!childShape) {
    return null;
  }

  const options: UrdfDefaultOptions = {
    xml: childShape
  }

  switch (childShape.nodeName) {
  case 'sphere':
    return new UrdfSphere(options);
  case 'box':
    return new UrdfBox(options);
  case 'cylinder':
    return new UrdfCylinder(options);
  case 'mesh':
    return new UrdfMesh(options);
  default:
    console.warn(`Unknown geometry type ${childShape.nodeName}`);
    return null
  }
}

/**
 * A Visual element in a URDF.
 */
export default class UrdfVisual {
  name: string | null;
  origin: Pose | null = new Pose();
  geometry: UrdfGeometryLike | null = null;
  material: UrdfMaterial | null = null;

  constructor({ xml }: UrdfDefaultOptions) {
    this.name = xml.getAttribute(UrdfAttrs.Name);

    // Origin
    const origins = xml.getElementsByTagName(UrdfAttrs.Origin);
    if (origins.length > 0) {
      this.origin = parseUrdfOrigin(origins[0]);
    }

    // Geometry
    const geoms = xml.getElementsByTagName(UrdfAttrs.Geometry);
    if (geoms.length > 0) {
      this.geometry = parseUrdfGeometry(geoms[0]);
    }

    // Material
    const materials = xml.getElementsByTagName(UrdfAttrs.Material);
    if (materials.length > 0) {
      this.material = new UrdfMaterial({
        xml: materials[0]
      });
    }
  }
}
