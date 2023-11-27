export = ServiceRequest;
/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @template T
*/
declare class ServiceRequest<T> {
    /**
     * @param {T} [values={}] - Object matching the fields defined in the .srv definition file.
     */
    constructor(values?: T | undefined);
}
