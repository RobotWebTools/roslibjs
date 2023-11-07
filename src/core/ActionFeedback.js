/**
 * @fileoverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var assign = require('object-assign');

/**
 * An ActionFeedback is periodically returned during an in-progress ROS 2 action
 *
 * @constructor
 * @param values - object matching the fields defined in the .action definition file
 */
function ActionFeedback(values) {
  assign(this, values);
}

module.exports = ActionFeedback;
