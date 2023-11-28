/**
 * @fileOverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var assign = require('object-assign');

/**
 * An ActionFeedback is periodically returned during an in-progress ROS 2 action.
 *
 * @constructor
 * @template T
 */
class ActionFeedback {
  /**
   * @param {T} [values={}] - Object matching the fields defined in the .action definition file.
   */
  constructor(values) {
    assign(this, values || {});
  }
}

module.exports = ActionFeedback;
