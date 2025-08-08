/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import Vector3 from './Vector3.js';
import Quaternion from './Quaternion.js';

/**
 * A Transform in 3-space. Values are copied into this object.
 */
export default class Transform {
  /**
   * @param {Object} options
   * @param {Vector3} options.translation - The ROSLIB.Vector3 describing the translation.
   * @param {Quaternion} options.rotation - The ROSLIB.Quaternion describing the rotation.
   */
  constructor(options) {
    // Copy the values into this object if they exist
    this.translation = new Vector3(options.translation);
    this.rotation = new Quaternion(options.rotation);
  }
  /**
   * Clone a copy of this transform.
   *
   * @returns {Transform} The cloned transform.
   */
  clone() {
    return new Transform(this);
  }
}
