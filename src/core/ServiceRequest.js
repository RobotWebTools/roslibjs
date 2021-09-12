/**
 * @fileoverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

import assign from 'object-assign';

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param values - object matching the fields defined in the .srv definition file
 */
export function ServiceRequest(values) {
  assign(this, values);
}
