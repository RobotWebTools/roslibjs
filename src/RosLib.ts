/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/** Library version */
export const REVISION = import.meta.env.VITE_ROSLIBJS_VERSION;

// Core exports
export { default as Ros, type TypeDefDict } from "./core/Ros.js";
export { default as Topic } from "./core/Topic.js";
export { default as Param } from "./core/Param.js";
export { default as Service } from "./core/Service.js";
export { default as Action } from "./core/Action.js";
export { type GoalStatus } from "./core/GoalStatus.js";

// Core Transport exports
export {
  AbstractTransport,
  type ITransport,
  type ITransportFactory,
  type TransportEvent,
} from "./core/transport/Transport.js";
export { WebSocketTransportFactory } from "./core/transport/WebSocketTransportFactory.js";

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
export { default as UrdfJoint } from "./urdf/UrdfJoint.js";

export {
  UrdfAttrs,
  UrdfType,
  type UrdfDefaultOptions,
} from "./urdf/UrdfTypes.js";
export { isElement, parseUrdfOrigin } from "./urdf/UrdfUtils.js";

// only export the types that typedoc requires us to export - those are our public interfaces
export { type actionlib_msgs } from "./types/actionlib_msgs.js";
export { type tf2_web_republisher } from "./types/tf2_web_republisher.js";
export { type rosapi } from "./types/rosapi.js";
export { type std_msgs } from "./types/std_msgs.js";
export { type tf2_msgs } from "./types/tf2_msgs.js";
export { type geometry_msgs } from "./types/geometry_msgs.js";
export type { Nullable, PartialNullable } from "./types/interface-types.js";
export {
  type RosbridgeMessage,
  isRosbridgeMessage,
  type RosbridgeAdvertiseMessage,
  isRosbridgeAdvertiseMessage,
  type RosbridgeSubscribeMessage,
  isRosbridgeSubscribeMessage,
  type RosbridgeAuthMessage,
  type RosbridgeStatusMessage,
  isRosbridgeStatusMessage,
  type RosbridgeSetStatusLevelMessage,
  isRosbridgeSetStatusLevelMessage,
  type RosbridgeFragmentMessage,
  isRosbridgeFragmentMessage,
  type RosbridgePngMessage,
  isRosbridgePngMessage,
  type RosbridgeUnadvertiseMessage,
  isRosbridgeUnadvertiseMessage,
  type RosbridgePublishMessage,
  isRosbridgePublishMessage,
  type RosbridgeUnsubscribeMessage,
  isRosbridgeUnsubscribeMessage,
  type RosbridgeAdvertiseServiceMessage,
  isRosbridgeAdvertiseServiceMessage,
  type RosbridgeUnadvertiseServiceMessage,
  isRosbridgeUnadvertiseServiceMessage,
  type RosbridgeCallServiceMessage,
  isRosbridgeCallServiceMessage,
  type RosbridgeServiceResponseMessage,
  isRosbridgeServiceResponseMessage,
  type RosbridgeAdvertiseActionMessage,
  isRosbridgeAdvertiseActionMessage,
  type RosbridgeUnadvertiseActionMessage,
  isRosbridgeUnadvertiseActionMessage,
  type RosbridgeSendActionGoalMessage,
  isRosbridgeSendActionGoalMessage,
  type RosbridgeCancelActionGoalMessage,
  isRosbridgeCancelActionGoalMessage,
  type RosbridgeActionFeedbackMessage,
  isRosbridgeActionFeedbackMessage,
  type RosbridgeActionResultMessage,
  isRosbridgeActionResultMessage,
  type RosbridgeMessageBase,
  type FailedRosbridgeActionResultMessage,
  type SuccessfulRosbridgeActionResultMessage,
  type FailedRosbridgeServiceResponseMessage,
  type SuccessfulRosbridgeServiceResponseMessage,
} from "./types/protocol.js";
