/**
 * @fileoverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var assign = require('object-assign');

/**
 * An ActionGoal is passed into a ROS 2 action goal request.
 *
 * @constructor
 * @template T
 */
class ActionGoal {
  /**
   * @param {T} [values={}] - Object matching the fields defined in the .action definition file.
   */
  constructor(values) {
    assign(this, values || {});
  }
}

module.exports = ActionGoal;