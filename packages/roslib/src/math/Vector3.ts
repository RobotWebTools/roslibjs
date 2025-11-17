/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import { type IQuaternion } from "./Quaternion.ts";
import { type PartialNullable } from "../types/interface-types.ts";

export interface IVector3 {
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
}

/**
 * A 3D vector.
 */
export default class Vector3 implements IVector3 {
  x: number;
  y: number;
  z: number;

  constructor(options?: PartialNullable<IVector3> | null) {
    this.x = options?.x ?? 0;
    this.y = options?.y ?? 0;
    this.z = options?.z ?? 0;
  }

  /**
   * Set the values of this vector to the sum of itself and the given vector.
   *
   * @param v - The vector to add with.
   */
  add(v: IVector3): void {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
  }

  /**
   * Set the values of this vector to the difference of itself and the given vector.
   *
   * @param v - The vector to subtract with.
   */
  subtract(v: IVector3): void {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
  }

  /**
   * Multiply the given Quaternion with this vector.
   *
   * @param q - The quaternion to multiply with.
   */
  multiplyQuaternion(q: IQuaternion) {
    const ix = q.w * this.x + q.y * this.z - q.z * this.y;
    const iy = q.w * this.y + q.z * this.x - q.x * this.z;
    const iz = q.w * this.z + q.x * this.y - q.y * this.x;
    const iw = -q.x * this.x - q.y * this.y - q.z * this.z;
    this.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
    this.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
    this.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
  }

  /**
   * Clone a copy of this vector.
   *
   * @returns The cloned vector.
   */
  clone(): Vector3 {
    return new Vector3(this);
  }
}
