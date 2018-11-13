/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

var Vector3 = require('./Vector3');
var Quaternion = require('./Quaternion');

/**
 * A Pose in 3D space. Values are copied into this object.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * position - the Vector3 describing the position
 *   * orientation - the ROSLIB.Quaternion describing the orientation
 */
function Pose(options) {
  options = options || {};
  // copy the values into this object if they exist
  this.position = new Vector3(options.position);
  this.orientation = new Quaternion(options.orientation);
}

/**
 * Apply a transform against this pose.
 *
 * @param tf the transform
 */
Pose.prototype.applyTransform = function(tf) {
  this.position.multiplyQuaternion(tf.rotation);
  this.position.add(tf.translation);
  var tmp = tf.rotation.clone();
  tmp.multiply(this.orientation);
  this.orientation = tmp;
};

/**
 * Clone a copy of this pose.
 *
 * @returns the cloned pose
 */
Pose.prototype.clone = function() {
  return new Pose(this);
};

/**
 * Multiplies this pose with another pose without altering this pose.
 *
 * @returns Result of multiplication.
 */
Pose.prototype.multiply = function(pose) {
  var p = pose.clone();
  p.applyTransform({ rotation: this.orientation, translation: this.position });
  return p;
};

/**
 * Computes the inverse of this pose.
 *
 * @returns Inverse of pose.
 */
Pose.prototype.getInverse = function() {
  var inverse = this.clone();
  inverse.orientation.invert();
  inverse.position.multiplyQuaternion(inverse.orientation);
  inverse.position.x *= -1;
  inverse.position.y *= -1;
  inverse.position.z *= -1;
  return inverse;
};

module.exports = Pose;