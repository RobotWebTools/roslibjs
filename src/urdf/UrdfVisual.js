/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import Pose from '../math/Pose.js';
import Vector3 from '../math/Vector3.js';
import Quaternion from '../math/Quaternion.js';

import UrdfCylinder from './UrdfCylinder.js';
import UrdfBox from './UrdfBox.js';
import UrdfMaterial from './UrdfMaterial.js';
import UrdfMesh from './UrdfMesh.js';
import UrdfSphere from './UrdfSphere.js';

/**
 * A Visual element in a URDF.
 */
export default class UrdfVisual {
  /** @type {Pose | null} */
  origin = null;
  /** @type {UrdfMesh | UrdfSphere | UrdfBox | UrdfCylinder | null} */
  geometry = null;
  /** @type {UrdfMaterial | null} */
  material = null;
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    var xml = options.xml;
    this.name = options.xml.getAttribute('name');

    // Origin
    var origins = xml.getElementsByTagName('origin');
    if (origins.length === 0) {
      // use the identity as the default
      this.origin = new Pose();
    } else {
      // Check the XYZ
      var xyzValue = origins[0].getAttribute('xyz');
      var position = new Vector3();
      if (xyzValue) {
        var xyz = xyzValue.split(' ');
        position = new Vector3({
          x: parseFloat(xyz[0]),
          y: parseFloat(xyz[1]),
          z: parseFloat(xyz[2])
        });
      }

      // Check the RPY
      var rpyValue = origins[0].getAttribute('rpy');
      var orientation = new Quaternion();
      if (rpyValue) {
        var rpy = rpyValue.split(' ');
        // Convert from RPY
        var roll = parseFloat(rpy[0]);
        var pitch = parseFloat(rpy[1]);
        var yaw = parseFloat(rpy[2]);
        var phi = roll / 2.0;
        var the = pitch / 2.0;
        var psi = yaw / 2.0;
        var x =
          Math.sin(phi) * Math.cos(the) * Math.cos(psi) -
          Math.cos(phi) * Math.sin(the) * Math.sin(psi);
        var y =
          Math.cos(phi) * Math.sin(the) * Math.cos(psi) +
          Math.sin(phi) * Math.cos(the) * Math.sin(psi);
        var z =
          Math.cos(phi) * Math.cos(the) * Math.sin(psi) -
          Math.sin(phi) * Math.sin(the) * Math.cos(psi);
        var w =
          Math.cos(phi) * Math.cos(the) * Math.cos(psi) +
          Math.sin(phi) * Math.sin(the) * Math.sin(psi);

        orientation = new Quaternion({
          x: x,
          y: y,
          z: z,
          w: w
        });
        orientation.normalize();
      }
      this.origin = new Pose({
        position: position,
        orientation: orientation
      });
    }

    // Geometry
    var geoms = xml.getElementsByTagName('geometry');
    if (geoms.length > 0) {
      var geom = geoms[0];
      var shape = null;
      // Check for the shape
      for (var i = 0; i < geom.childNodes.length; i++) {
        /** @type {Element} */
        // @ts-expect-error -- unknown why this doesn't work properly.
        var node = geom.childNodes[i];
        if (node.nodeType === 1) {
          shape = node;
          break;
        }
      }
      if (shape) {
        // Check the type
        var type = shape.nodeName;
        if (type === 'sphere') {
          this.geometry = new UrdfSphere({
            xml: shape
          });
        } else if (type === 'box') {
          this.geometry = new UrdfBox({
            xml: shape
          });
        } else if (type === 'cylinder') {
          this.geometry = new UrdfCylinder({
            xml: shape
          });
        } else if (type === 'mesh') {
          this.geometry = new UrdfMesh({
            xml: shape
          });
        } else {
          console.warn('Unknown geometry type ' + type);
        }
      }
    }

    // Material
    var materials = xml.getElementsByTagName('material');
    if (materials.length > 0) {
      this.material = new UrdfMaterial({
        xml: materials[0]
      });
    }
  }
}
