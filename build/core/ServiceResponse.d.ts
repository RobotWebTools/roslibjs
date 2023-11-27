export = ServiceResponse;
/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @template T
*/
declare class ServiceResponse<T> {
    /**
     * @param {T} values - Object matching the fields defined in the .srv definition file.
     */
    constructor(values: T);
}
