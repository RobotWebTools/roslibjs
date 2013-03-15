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
  this.position = new ROSLIB.Vector3();
  this.orientation = new ROSLIB.Quaternion();

  // copy the values into this object if they exist
  if (position !== undefined) {
    this.position.copy(position);
  }
  if (orientation !== undefined) {
    this.orientation.copy(orientation);
  }

  this.copy = function(pose) {
    pose.position.copy(pose.position);
    pose.orientation.copy(pose.orientation);
  };
};
