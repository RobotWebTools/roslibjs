/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Quaternion.
 */
export default class Quaternion {
  /**
   * @param {Object} [options]
   * @param {number|null} [options.x=0] - The x value.
   * @param {number|null} [options.y=0] - The y value.
   * @param {number|null} [options.z=0] - The z value.
   * @param {number|null} [options.w=1] - The w value.
   */
  constructor(options) {
    options = options || {};
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
    this.w = typeof options.w === 'number' ? options.w : 1;
  }
  /**
   * Perform a conjugation on this quaternion.
   */
  conjugate() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
  }
  /**
   * Return the norm of this quaternion.
   */
  norm() {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }
  /**
   * Perform a normalization on this quaternion.
   */
  normalize() {
    var l = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
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
  }
  /**
   * Convert this quaternion into its inverse.
   */
  invert() {
    this.conjugate();
    this.normalize();
  }
  /**
   * Set the values of this quaternion to the product of itself and the given quaternion.
   *
   * @param {Quaternion} q - The quaternion to multiply with.
   */
  multiply(q) {
    var newX = this.x * q.w + this.y * q.z - this.z * q.y + this.w * q.x;
    var newY = -this.x * q.z + this.y * q.w + this.z * q.x + this.w * q.y;
    var newZ = this.x * q.y - this.y * q.x + this.z * q.w + this.w * q.z;
    var newW = -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w;
    this.x = newX;
    this.y = newY;
    this.z = newZ;
    this.w = newW;
  }
  /**
   * Clone a copy of this quaternion.
   *
   * @returns {Quaternion} The cloned quaternion.
   */
  clone() {
    return new Quaternion(this);
  }
}
