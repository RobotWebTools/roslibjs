/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/** @description Library version */
export const REVISION = import.meta.env.VITE_ROSLIBJS_VERSION;

// Core exports
export { default as Ros } from "./core/Ros.js";
export { default as Topic } from "./core/Topic.js";
export { default as Param } from "./core/Param.js";
export { default as Service } from "./core/Service.js";
export { default as Action } from "./core/Action.js";
export {
  type ITransport,
  type ITransportFactory,
  type TransportEvent,
  AbstractTransport,
  WebSocketTransportFactory,
} from "./core/Transport.js";

// ActionLib exports
export { default as ActionClient } from "./actionlib/ActionClient.js";
export { default as ActionListener } from "./actionlib/ActionListener.js";
export { default as Goal } from "./actionlib/Goal.js";
export { default as SimpleActionServer } from "./actionlib/SimpleActionServer.js";

// Math exports
export { default as Pose, type IPose } from "./math/Pose.js";
export { default as Quaternion, type IQuaternion } from "./math/Quaternion.js";
export { default as Transform, type ITransform } from "./math/Transform.js";
export { default as Vector3, type IVector3 } from "./math/Vector3.js";

// TF exports
export { default as TFClient } from "./tf/TFClient.js";
export { default as ROS2TFClient } from "./tf/ROS2TFClient.js";

// URDF exports
export { default as UrdfBox } from "./urdf/UrdfBox.js";
export { default as UrdfColor } from "./urdf/UrdfColor.js";
export { default as UrdfCylinder } from "./urdf/UrdfCylinder.js";
export { default as UrdfLink } from "./urdf/UrdfLink.js";
export { default as UrdfMaterial } from "./urdf/UrdfMaterial.js";
export { default as UrdfMesh } from "./urdf/UrdfMesh.js";
export {
  default as UrdfModel,
  type UrdfModelOptions,
} from "./urdf/UrdfModel.js";
export { default as UrdfSphere } from "./urdf/UrdfSphere.js";
export {
  default as UrdfVisual,
  type UrdfGeometryLike,
} from "./urdf/UrdfVisual.js";

export {
  UrdfAttrs,
  UrdfType,
  type UrdfDefaultOptions,
} from "./urdf/UrdfTypes.js";
export { isElement, parseUrdfOrigin } from "./urdf/UrdfUtils.js";
