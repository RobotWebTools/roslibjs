/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */
import { type PartialNullable } from "../types/interface-types.ts";

export interface IQuaternion {
  /**
   * The x value.
   */
  x: number;

  /**
   * The y value.
   */
  y: number;

  /**
   * The z value.
   */
  z: number;

  /**
   * The w value.
   */
  w: number;
}

/**
 * A Quaternion.
 */
export default class Quaternion implements IQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(options?: PartialNullable<IQuaternion> | null) {
    this.x = options?.x ?? 0;
    this.y = options?.y ?? 0;
    this.z = options?.z ?? 0;
    this.w = typeof options?.w === "number" ? options.w : 1;
  }

  /**
   * Perform a conjugation on this quaternion.
   */
  conjugate(): void {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
  }

  /**
   * Return the norm of this quaternion.
   */
  norm(): number {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w,
    );
  }

  /**
   * Perform a normalization on this quaternion.
   */
  normalize(): void {
    let l = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w,
    );
    if (l === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;
      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }
  }
  /**
   * Convert this quaternion into its inverse.
   */
  invert() {
    this.conjugate();
    this.normalize();
  }
  /**
   * Set the values of this quaternion to the product of itself and the given quaternion.
   *
   * @param q - The quaternion to multiply with.
   */
  multiply(q: IQuaternion): void {
    const newX = this.x * q.w + this.y * q.z - this.z * q.y + this.w * q.x;
    const newY = -this.x * q.z + this.y * q.w + this.z * q.x + this.w * q.y;
    const newZ = this.x * q.y - this.y * q.x + this.z * q.w + this.w * q.z;
    const newW = -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w;
    this.x = newX;
    this.y = newY;
    this.z = newZ;
    this.w = newW;
  }

  /**
   * Clone a copy of this quaternion.
   *
   * @returns The cloned quaternion.
   */
  clone(): Quaternion {
    return new Quaternion(this);
  }
}
