/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Transform in 3-space. Values are copied into this object.
 *
 * @constructor
 * @param options - possible keys include:
 *   * translation - the ROSLIB.Vector3 describing the translation
 *   * rotation - the ROSLIB.Quaternion describing the rotation
 *   * transform - another Transform to copy initial values from
 */
ROSLIB.Transform = function(options) {
  var options = options || {};
  if (options.transform) {
    this.translation = options.transform.translation.clone();
    this.rotation = options.transform.rotation.clone();
  } else {
    // copy the values into this object if they exist
    this.translation = new ROSLIB.Vector3({
      vector : options.translation
    });
    this.rotation = new ROSLIB.Quaternion({
      quaternion : options.rotation
    });
  }
};

/**
 * Apply a transform against the given ROSLIB.Pose.
 *
 * @param pose the pose to transform with
 * @returns a pointer to the pose
 */
ROSLIB.Transform.prototype.apply = function(pose) {
  pose.position.multiplyQuaternion(this.rotation);
  pose.position.add(this.translation);
  
  this.rotation.multiply(pose.orientation);
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
 * Clone a copy of this transform.
 *
 * @returns the cloned transform
 */
ROSLIB.Transform.prototype.clone = function() {
  return new ROSLIB.Transform({
    transform : this
  });
};
