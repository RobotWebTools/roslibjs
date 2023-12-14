/**
 * @fileoverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var assign = require('object-assign');

/**
 * An ActionResult is returned from sending a ROS 2 action goal.
 *
 * @constructor
 * @template TResult
 */
class ActionResult {
  /**
   * @param {TResult} [values={}] - Object matching the fields defined in the .action definition file.
   */
  constructor(values) {
    assign(this, values || {});
  }
}

module.exports = ActionResult;
