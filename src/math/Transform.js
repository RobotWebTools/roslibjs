/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Transform in 3-space. Values are copied into this object.
 *
 *  @constructor
 *  @param translation - the ROSLIB.Vector3 describing the translation
 *  @param rotation - the ROSLIB.Quaternion describing the rotation
 */
ROSLIB.Transform = function(translation, rotation) {
  this.translation = new ROSLIB.Vector3();
  this.rotation = new ROSLIB.Quaternion();
  if (translation !== undefined) {
    this.translation.copy(translation);
  }
  if (rotation !== undefined) {
    this.rotation.copy(rotation);
  }
};

/**
 * Apply a transform against the given ROSLIB.Pose.
 *
 * @param pose the pose to transform with
 * @returns a pointer to the pose
 */
ROSLIB.Transform.prototype.apply = function(pose) {
  this.rotation.multiplyVec3(pose.position);
  pose.position.add(pose.position, this.translation);
  pose.orientation.multiply(this.rotation, pose.orientation);
  return pose;
};

/**
 * Apply an inverse transform against the given ROSLIB.Pose.
 *
 * @param pose the pose to transform with
 * @returns a pointer to the pose
 */
ROSLIB.Transform.prototype.applyInverse = function(pose) {
  var rotInv = this.rotation.clone().inverse();
  rotInv.multiplyVec3(pose.position);
  pose.position.sub(pose.position, this.translation);
  pose.orientation.multiply(rotInv, pose.orientation);
  return pose;
};

/**
 * Copy the values from the given transform into this transform.
 *
 * @param transform the transform to copy
 * @returns a pointer to this transform
 */
ROSLIB.Transform.prototype.copy = function(transform) {
  transform.translation.copy(transform.translation);
  transform.rotation.copy(transform.rotation);
  return transform;
};

