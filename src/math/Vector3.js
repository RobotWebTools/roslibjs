/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A 3D vector.
 *
 * @constructor
 * @param {Object} options - An object with the following keys:
 * @param {number} [options.x] - The x value (defaults to 0).
 * @param {number} [options.y] - The y value (defaults to 0).
 * @param {number} [options.z] - The z value (defaults to 0).
 */
function Vector3(options) {
  options = options || {};
  this.x = options.x || 0;
  this.y = options.y || 0;
  this.z = options.z || 0;
}

/**
 * Set the values of this vector to the sum of itself and the given vector.
 *
 * @param {Vector3} v - The vector to add with.
 */
Vector3.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  this.z += v.z;
};

/**
 * Set the values of this vector to the difference of itself and the given vector.
 *
 * @param {Vector3} v - The vector to subtract with.
 */
Vector3.prototype.subtract = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  this.z -= v.z;
};

/**
 * Multiply the given Quaternion with this vector.
 *
 * @param {Quaternion} q - The quaternion to multiply with.
 */
Vector3.prototype.multiplyQuaternion = function(q) {
  var ix = q.w * this.x + q.y * this.z - q.z * this.y;
  var iy = q.w * this.y + q.z * this.x - q.x * this.z;
  var iz = q.w * this.z + q.x * this.y - q.y * this.x;
  var iw = -q.x * this.x - q.y * this.y - q.z * this.z;
  this.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
  this.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
  this.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
};

/**
 * Clone a copy of this vector.
 *
 * @returns {Vector3} The cloned vector.
 */
Vector3.prototype.clone = function() {
  return new Vector3(this);
};

module.exports = Vector3;