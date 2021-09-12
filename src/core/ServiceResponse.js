/**
 * @fileoverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

import assign from 'object-assign';

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param values - object matching the fields defined in the .srv definition file
 */
export function ServiceResponse(values) {
  assign(this, values);
}
