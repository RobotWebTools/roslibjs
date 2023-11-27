export = Quaternion;
/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */
/**
 * A Quaternion.
 */
declare class Quaternion {
    /**
     * @param {Object} [options]
     * @param {number|null} [options.x=0] - The x value.
     * @param {number|null} [options.y=0] - The y value.
     * @param {number|null} [options.z=0] - The z value.
     * @param {number|null} [options.w=1] - The w value.
     */
    constructor(options?: {
        x?: number | null | undefined;
        y?: number | null | undefined;
        z?: number | null | undefined;
        w?: number | null | undefined;
    } | undefined);
    x: number;
    y: number;
    z: number;
    w: number;
    /**
     * Perform a conjugation on this quaternion.
     */
    conjugate(): void;
    /**
     * Return the norm of this quaternion.
     */
    norm(): number;
    /**
     * Perform a normalization on this quaternion.
     */
    normalize(): void;
    /**
     * Convert this quaternion into its inverse.
     */
    invert(): void;
    /**
     * Set the values of this quaternion to the product of itself and the given quaternion.
     *
     * @param {Quaternion} q - The quaternion to multiply with.
     */
    multiply(q: Quaternion): void;
    /**
     * Clone a copy of this quaternion.
     *
     * @returns {Quaternion} The cloned quaternion.
     */
    clone(): Quaternion;
}
