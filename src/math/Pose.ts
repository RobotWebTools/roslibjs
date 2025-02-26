/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import Vector3 from './Vector3.js';
import Quaternion from './Quaternion.js';
import Transform from './Transform.js';

/**
 * A Pose in 3D space. Values are copied into this object.
 */
export default class Pose {
  /**
   * @param {Object} [options]
   * @param {Vector3} [options.position] - The ROSLIB.Vector3 describing the position.
   * @param {Quaternion} [options.orientation] - The ROSLIB.Quaternion describing the orientation.
   */
  constructor(options) {
    options = options || {};
    // copy the values into this object if they exist
    options = options || {};
    this.position = new Vector3(options.position);
    this.orientation = new Quaternion(options.orientation);
  }
  /**
   * Apply a transform against this pose.
   *
   * @param {Transform} tf - The transform to be applied.
   */
  applyTransform(tf) {
    this.position.multiplyQuaternion(tf.rotation);
    this.position.add(tf.translation);
    var tmp = tf.rotation.clone();
    tmp.multiply(this.orientation);
    this.orientation = tmp;
  }
  /**
   * Clone a copy of this pose.
   *
   * @returns {Pose} The cloned pose.
   */
  clone() {
    return new Pose(this);
  }
  /**
   * Multiply this pose with another pose without altering this pose.
   *
   * @returns {Pose} The result of the multiplication.
   */
  multiply(pose) {
    var p = pose.clone();
    p.applyTransform({
      rotation: this.orientation,
      translation: this.position
    });
    return p;
  }
  /**
   * Compute the inverse of this pose.
   *
   * @returns {Pose} The inverse of the pose.
   */
  getInverse() {
    var inverse = this.clone();
    inverse.orientation.invert();
    inverse.position.multiplyQuaternion(inverse.orientation);
    inverse.position.x *= -1;
    inverse.position.y *= -1;
    inverse.position.z *= -1;
    return inverse;
  }
}
