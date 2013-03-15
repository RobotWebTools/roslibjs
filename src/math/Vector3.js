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
  var vector3 = this;
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;

  /**
   * Copy the values from the given vector into this vector.
   * 
   * @param v the vector to copy
   * @returns a pointer to this vector
   */
  this.copy = function(v) {
    vector3.x = v.x;
    vector3.y = v.y;
    vector3.z = v.z;
    return vector3;
  };

  /**
   * Set the values of this vector to the sum of vectors a and b.
   * 
   * @param a the first vector to add with
   * @param b the second vector to add with
   * @returns a pointer to this vector
   */
  this.add = function(a, b) {
    vector3.x = a.x + b.x;
    vector3.y = a.y + b.y;
    vector3.z = a.z + b.z;
    return vector3;
  };

  /**
   * Set the values of this vector to the difference of vectors a and b.
   * 
   * @param a the first vector to add with
   * @param b the second vector to add with
   * @returns a pointer to this vector
   */
  this.sub = function(a, b) {
    vector3.x = a.x - b.x;
    vector3.y = a.y - b.y;
    vector3.z = a.z - b.z;
    return vector3;
  };

  /**
   * Clone a copy of this vector.
   * 
   * @returns the cloned vector
   */
  this.clone = function() {
    return new ROSLIB.Vector3(vector3.x, vector3.y, vector3.z);
  };
};
