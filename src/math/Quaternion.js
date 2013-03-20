/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Quaternion.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * x - the x value 
 *   * y - the y value 
 *   * z - the z value 
 *   * w - the w value 
 */
ROSLIB.Quaternion = function(options) {
  var options = options || {};
  this.x = options.x || 0;
  this.y = options.y || 0;
  this.z = options.z || 0;
  this.w = options.w || 1;
};

/**
 * Perform a conjugation on this quaternion.
 */
ROSLIB.Quaternion.prototype.conjugate = function() {
  this.x *= -1;
  this.y *= -1;
  this.z *= -1;
};

/**
 * Perform a normalization on this quaternion.
 */
ROSLIB.Quaternion.prototype.normalize = function() {
  var l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  if (l === 0) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 1;
  } else {
    l = 1 / l;
    this.x = this.x * l;
    this.y = this.y * l;
    this.z = this.z * l;
    this.w = this.w * l;
  }
};

/**
 * Convert this quaternion into its inverse.
 */
ROSLIB.Quaternion.prototype.inverse = function() {
  this.conjugate();
  this.normalize();
};

/**
 * Set the values of this quaternion to the product of itself and the given quaternion.
 *
 * @param q the quaternion to multiply with
 */
ROSLIB.Quaternion.prototype.multiply = function(q) {
  this.x = this.x * q.w + this.y * q.z - this.z * q.y + this.w * q.x;
  this.y = -this.x * q.z + this.y * q.w + this.z * q.x + this.w * q.y;
  this.z = this.x * q.y - this.y * q.x + this.z * q.w + this.w * q.z;
  this.w = -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w;
};

/**
 * Clone a copy of this quaternion.
 *
 * @returns the cloned quaternion
 */
ROSLIB.Quaternion.prototype.clone = function() {
  return new ROSLIB.Quaternion(this);
};
