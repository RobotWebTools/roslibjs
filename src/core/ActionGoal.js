/**
 * @fileoverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var assign = require('object-assign');

/**
 * An ActionGoal is passed into an action goal request.
 *
 * @constructor
 * @param values - object matching the fields defined in the .action definition file
 */
function ActionGoal(values) {
  assign(this, values);
}

module.exports = ActionGoal;
