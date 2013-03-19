/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Quaternion.
 *
 *  @constructor
 *  @param x - the x value 
 *  @param y - the y value
 *  @param z - the z value
 *  @param w - the w value
 */
ROSLIB.Quaternion = function(x, y, z, w) {
  var quaternion = this;
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = w || 1;
};

/**
 * Copy the values from the given quaternion into this quaternion.
 *
 * @param q the quaternion to copy
 * @returns a pointer to this quaternion
 */
ROSLIB.Quaternion.prototype.copy = function(q) {
  quaternion.x = q.x;
  quaternion.y = q.y;
  quaternion.z = q.z;
  quaternion.w = q.w;
  return quaternion;
};

/**
 * Perform a conjugation on this quaternion.
 *
 * @returns a pointer to this quaternion
 */
ROSLIB.Quaternion.prototype.conjugate = function() {
  quaternion.x *= -1;
  quaternion.y *= -1;
  quaternion.z *= -1;
  return quaternion;
};

/**
 * Perform a normalization on this quaternion.
 *
 * @returns a pointer to this quaternion
 */
ROSLIB.Quaternion.prototype.normalize = function() {
  var l = Math.sqrt(
    quaternion.x * quaternion.x + quaternion.y * quaternion.y
  + quaternion.z * quaternion.z + quaternion.w * quaternion.w
  );
  if (l === 0) {
    quaternion.x = 0;
    quaternion.y = 0;
    quaternion.z = 0;
    quaternion.w = 1;
  } else {
    l = 1 / l;
    quaternion.x = quaternion.x * l;
    quaternion.y = quaternion.y * l;
    quaternion.z = quaternion.z * l;
    quaternion.w = quaternion.w * l;
  }
  return quaternion;
};

/**
 * Convert this quaternion into its inverse.
 *
 * @returns a pointer to this quaternion
 */
ROSLIB.Quaternion.prototype.inverse = function() {
  this.conjugate().normalize();
  return quaternion;
};

/**
 * Set the values of this quaternion to the product of quaternions a and b.
 *
 * @param a the first quaternion to multiply with
 * @param b the second quaternion to multiply with
 * @returns a pointer to this quaternion
 */
ROSLIB.Quaternion.prototype.multiply = function(a, b) {
  var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w, qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
  this.x = qax * qbw + qay * qbz - qaz * qby + qaw * qbx;
  this.y = -qax * qbz + qay * qbw + qaz * qbx + qaw * qby;
  this.z = qax * qby - qay * qbx + qaz * qbw + qaw * qbz;
  this.w = -qax * qbx - qay * qby - qaz * qbz + qaw * qbw;
  return quaternion;
};

/**
 * Multiply the given ROSLIB.Vector3 with this quaternion.
 *
 * @param vector the vector to multiply with
 * @param dest (option) - where the computed values will go (defaults to 'vector').
 * @returns a pointer to dest
 */
ROSLIB.Quaternion.prototype.multiplyVec3 = function(vector, dest) {
  if (!dest) {
    dest = vector;
  }
  var x = vector.x, y = vector.y, z = vector.z, qx = quaternion.x, qy = quaternion.y, qz = quaternion.z, qw = quaternion.w;
  var ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx
      * x - qy * y - qz * z;
  dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return dest;
};

/**
 * Clone a copy of this quaternion.
 *
 * @returns the cloned quaternion
 */
ROSLIB.Quaternion.prototype.clone = function() {
  return new ROSLIB.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
};

