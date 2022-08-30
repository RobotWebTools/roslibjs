/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

var Vector3 = require('./Vector3');
var Quaternion = require('./Quaternion');

/**
 * A Transform in 3-space. Values are copied into this object.
 *
 * @constructor
 * @param {Object} options
 * @param {Vector3} options.translation - The ROSLIB.Vector3 describing the translation.
 * @param {Quaternion} options.rotation - The ROSLIB.Quaternion describing the rotation.
 */
function Transform(options) {
  options = options || {};
  // Copy the values into this object if they exist
  this.translation = new Vector3(options.translation);
  this.rotation = new Quaternion(options.rotation);
}

/**
 * Clone a copy of this transform.
 *
 * @returns {Transform} The cloned transform.
 */
Transform.prototype.clone = function() {
  return new Transform(this);
};

module.exports = Transform;
