/**
 * @fileOverview
 * @author David V. Lu!! - davidvlu@gmail.com
 */

import Pose from '../math/Pose.js';
import Vector3 from '../math/Vector3.js';
import Quaternion from '../math/Quaternion.js';

/**
 * A Joint element in a URDF.
 */
export default class UrdfJoint {
  /**
   * @param {Object} options
   * @param {Element} options.xml - The XML element to parse.
   */
  constructor(options) {
    this.name = options.xml.getAttribute('name');
    this.type = options.xml.getAttribute('type');

    var parents = options.xml.getElementsByTagName('parent');
    if (parents.length > 0) {
      this.parent = parents[0].getAttribute('link');
    }

    var children = options.xml.getElementsByTagName('child');
    if (children.length > 0) {
      this.child = children[0].getAttribute('link');
    }

    var limits = options.xml.getElementsByTagName('limit');
    if (limits.length > 0) {
      this.minval = parseFloat(limits[0].getAttribute('lower') || 'NaN');
      this.maxval = parseFloat(limits[0].getAttribute('upper') || 'NaN');
    }

    // Origin
    var origins = options.xml.getElementsByTagName('origin');
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
  }
}
