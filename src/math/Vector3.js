/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A 3D vector.
 *
 *  @constructor
 *  @param x - the x value 
 *  @param y - the y value
 *  @param z - the z value
 */
ROSLIB.Vector3 = function(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

/**
 * Copy the values from the given vector into this vector.
 *
 * @param v the vector to copy
 * @returns a pointer to this vector
 */
ROSLIB.Vector3.prototype.copy = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  return this;
};

/**
 * Set the values of this vector to the sum of vectors a and b.
 *
 * @param a the first vector to add with
 * @param b the second vector to add with
 * @returns a pointer to this vector
 */
ROSLIB.Vector3.prototype.add = function(a, b) {
  this.x = a.x + b.x;
  this.y = a.y + b.y;
  this.z = a.z + b.z;
  return this;
};

/**
 * Set the values of this vector to the difference of vectors a and b.
 *
 * @param a the first vector to add with
 * @param b the second vector to add with
 * @returns a pointer to this vector
 */
ROSLIB.Vector3.sub = function(a, b) {
  this.x = a.x - b.x;
  this.y = a.y - b.y;
  this.z = a.z - b.z;
  return this;
};

/**
 * Clone a copy of this vector.
 *
 * @returns the cloned vector
 */
ROSLIB.Vector3.prototype.clone = function() {
  return new ROSLIB.Vector3(this.x, this.y, this.z);
};

