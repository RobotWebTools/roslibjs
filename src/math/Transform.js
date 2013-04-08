/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Transform in 3-space. Values are copied into this object.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * translation - the Vector3 describing the translation
 *   * rotation - the ROSLIB.Quaternion describing the rotation
 */
ROSLIB.Transform = function(options) {
  options = options || {};
  // Copy the values into this object if they exist
  this.translation = new ROSLIB.Vector3(options.translation);
  this.rotation = new ROSLIB.Quaternion(options.rotation);
};

/**
 * Clone a copy of this transform.
 *
 * @returns the cloned transform
 */
ROSLIB.Transform.prototype.clone = function() {
  return new ROSLIB.Transform(this);
};
