/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */
import Vector3, { type IVector3 } from "./Vector3.ts";
import Quaternion, { type IQuaternion } from "./Quaternion.ts";
import { type ITransform } from "./Transform.ts";
import type { PartialNullable } from "../types/interface-types.ts";

export interface IPose {
  /**
   * The ROSLIB.Vector3 describing the position.
   */
  position: IVector3;
  /**
   * The ROSLIB.Quaternion describing the orientation.
   */
  orientation: IQuaternion;
}

/**
 * A Pose in 3D space. Values are copied into this object.
 */
export default class Pose implements IPose {
  position: Vector3;
  orientation: Quaternion;

  constructor(options?: PartialNullable<IPose>) {
    this.position = new Vector3(options?.position);
    this.orientation = new Quaternion(options?.orientation);
  }

  /**
   * Apply a transform against this pose.
   *
   * @param tf - The transform to be applied.
   */
  applyTransform(tf: ITransform) {
    this.position.multiplyQuaternion(tf.rotation);
    this.position.add(tf.translation);
    const tmp = new Quaternion(tf.rotation);
    tmp.multiply(this.orientation);
    this.orientation = tmp;
  }

  /**
   * Clone a copy of this pose.
   *
   * @returns The cloned pose.
   */
  clone(): Pose {
    return new Pose(this);
  }

  /**
   * Multiply this pose with another pose without altering this pose.
   *
   * @returns The result of the multiplication.
   */
  multiply(pose: Pose): Pose {
    const p = pose.clone();
    p.applyTransform({
      rotation: this.orientation,
      translation: this.position,
    });
    return p;
  }

  /**
   * Compute the inverse of this pose.
   *
   * @returns The inverse of the pose.
   */
  getInverse(): Pose {
    const inverse = this.clone();
    inverse.orientation.invert();
    inverse.position.multiplyQuaternion(inverse.orientation);
    inverse.position.x *= -1;
    inverse.position.y *= -1;
    inverse.position.z *= -1;
    return inverse;
  }
}
