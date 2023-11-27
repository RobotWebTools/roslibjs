export = Pose;
/**
 * A Pose in 3D space. Values are copied into this object.
 */
declare class Pose {
    /**
     * @param {Object} [options]
     * @param {Vector3} [options.position] - The ROSLIB.Vector3 describing the position.
     * @param {Quaternion} [options.orientation] - The ROSLIB.Quaternion describing the orientation.
     */
    constructor(options?: {
        position?: Vector3 | undefined;
        orientation?: Quaternion | undefined;
    } | undefined);
    position: Vector3;
    orientation: Quaternion;
    /**
     * Apply a transform against this pose.
     *
     * @param {Transform} tf - The transform to be applied.
     */
    applyTransform(tf: Transform): void;
    /**
     * Clone a copy of this pose.
     *
     * @returns {Pose} The cloned pose.
     */
    clone(): Pose;
    /**
     * Multiply this pose with another pose without altering this pose.
     *
     * @returns {Pose} The result of the multiplication.
     */
    multiply(pose: any): Pose;
    /**
     * Compute the inverse of this pose.
     *
     * @returns {Pose} The inverse of the pose.
     */
    getInverse(): Pose;
}
import Vector3 = require("./Vector3");
import Quaternion = require("./Quaternion");
import Transform = require("./Transform");
