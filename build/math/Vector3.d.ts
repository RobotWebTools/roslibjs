export = Vector3;
/**
 * A 3D vector.
 */
declare class Vector3 {
    /**
     * @param {Object} [options]
     * @param {number} [options.x=0] - The x value.
     * @param {number} [options.y=0] - The y value.
     * @param {number} [options.z=0] - The z value.
     */
    constructor(options?: {
        x?: number | undefined;
        y?: number | undefined;
        z?: number | undefined;
    } | undefined);
    x: number;
    y: number;
    z: number;
    /**
     * Set the values of this vector to the sum of itself and the given vector.
     *
     * @param {Vector3} v - The vector to add with.
     */
    add(v: Vector3): void;
    /**
     * Set the values of this vector to the difference of itself and the given vector.
     *
     * @param {Vector3} v - The vector to subtract with.
     */
    subtract(v: Vector3): void;
    /**
     * Multiply the given Quaternion with this vector.
     *
     * @param {Quaternion} q - The quaternion to multiply with.
     */
    multiplyQuaternion(q: Quaternion): void;
    /**
     * Clone a copy of this vector.
     *
     * @returns {Vector3} The cloned vector.
     */
    clone(): Vector3;
}
import Quaternion = require("./Quaternion");
