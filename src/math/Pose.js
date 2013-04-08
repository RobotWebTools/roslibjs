/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Pose in 3D space. Values are copied into this object.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * position - the Vector3 describing the position
 *   * orientation - the ROSLIB.Quaternion describing the orientation
 */
ROSLIB.Pose = function(options) {
  options = options || {};
  // copy the values into this object if they exist
  this.position = new ROSLIB.Vector3(options.position);
  this.orientation = new ROSLIB.Quaternion(options.orientation);
};

/**
 * Apply a transform against this pose.
 *
 * @param tf the transform
 */
ROSLIB.Pose.prototype.applyTransform = function(tf) {
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
ROSLIB.Pose.prototype.clone = function() {
  return new ROSLIB.Pose(this);
};
