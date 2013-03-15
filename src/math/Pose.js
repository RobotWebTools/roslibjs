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
  var pose = this;
  // copy the values into this object if they exist
  if (position !== undefined) {
    this.position = position.clone();
  } else {
    this.position = new ROSLIB.Vector3();
  }
  if (orientation !== undefined) {
    this.orientation = orientation.clone();
  } else {
    this.orientation = new ROSLIB.Quaternion();
  }
  
  /**
   * Copy the values from the given pose into this pose.
   * 
   * @param pose the pose to copy
   * @returns a pointer to this pose
   */
  this.copy = function(pose) {
    pose.position.copy(pose.position);
    pose.orientation.copy(pose.orientation);
    return pose;
  };
};
