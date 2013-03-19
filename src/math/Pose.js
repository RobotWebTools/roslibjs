/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Pose in 3D space. Values are copied into this object.
 *
 *  @constructor
 *  @param position - the ROSLIB.Vector3 describing the position
 *  @param orientation - the ROSLIB.Quaternion describing the orientation
 */
ROSLIB.Pose = function(position, orientation) {
  // Copy the values into this object if they exist
  this.position = new ROSLIB.Vector3();
  this.orientation = new ROSLIB.Quaternion();
  if (position !== undefined) {
    this.position.copy(position);
  }
  if (orientation !== undefined) {
    this.orientation.copy(orientation);
  }
};

/**
 * Copy the values from the given pose into this pose.
 *
 * @param pose the pose to copy
 * @returns a pointer to this pose
 */
ROSLIB.Pose.prototype.copy = function(pose) {
  this.position.copy(pose.position);
  this.orientation.copy(pose.orientation);
  return pose;
};

