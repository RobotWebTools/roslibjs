export = Message;
/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @template T
*/
declare class Message<T> {
    /**
     * @param {T} [values={}] - An object matching the fields defined in the .msg definition file.
     */
    constructor(values?: T | undefined);
}
