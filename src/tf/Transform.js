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
  var transform = this;
  // copy the values into this object if they exist
  if (translation !== undefined) {
    this.translation = translation.clone();
  } else {
    this.translation = new ROSLIB.Vector3();
  }
  if (rotation !== undefined) {
    this.rotation = rotation.clone();
  } else {
    this.rotation = new ROSLIB.Quaternion();
  }

  /**
   * Apply a transform against the given ROSLIB.Pose.
   * 
   * @param pose the pose to transform with
   * @returns a pointer to the pose
   */
  this.apply = function(pose) {
    transform.rotation.multiplyVec3(pose.position);
    pose.position.add(pose.position, transform.translation);
    pose.orientation.multiply(transform.rotation, pose.orientation);
    return pose;
  };

  /**
   * Apply an inverse transform against the given ROSLIB.Pose.
   * 
   * @param pose the pose to transform with
   * @returns a pointer to the pose
   */
  this.applyInverse = function(pose) {
    var rotInv = transform.rotation.clone().inverse();
    rotInv.multiplyVec3(pose.position);
    pose.position.sub(pose.position, transform.translation);
    pose.orientation.multiply(rotInv, pose.orientation);
    return pose;
  };

  /**
   * Copy the values from the given transform into this transform.
   * 
   * @param transform the transform to copy
   * @returns a pointer to this transform
   */
  this.copy = function(transform) {
    transform.translation.copy(transform.translation);
    transform.rotation.copy(transform.rotation);
    return transform;
  };
};
