/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/** Library version */
export const REVISION = import.meta.env.VITE_ROSLIBJS_VERSION;

// Core exports
export { default as Ros, type TypeDefDict } from "./core/Ros.ts";
export { default as Topic } from "./core/Topic.ts";
export { default as Param } from "./core/Param.ts";
export { default as Service } from "./core/Service.ts";
export { default as Action } from "./core/Action.ts";
export { GoalStatus } from "./core/GoalStatus.ts";

// Core Transport exports
export {
  AbstractTransport,
  type ITransport,
  type ITransportFactory,
  type TransportEvent,
} from "./core/transport/Transport.ts";
export { WebSocketTransportFactory } from "./core/transport/WebSocketTransportFactory.ts";

// ActionLib exports
export { default as ActionClient } from "./actionlib/ActionClient.ts";
export { default as ActionListener } from "./actionlib/ActionListener.ts";
export { default as Goal } from "./actionlib/Goal.ts";
export { default as SimpleActionServer } from "./actionlib/SimpleActionServer.ts";

// Math exports
export { default as Pose, type IPose } from "./math/Pose.ts";
export { default as Quaternion, type IQuaternion } from "./math/Quaternion.ts";
export { default as Transform, type ITransform } from "./math/Transform.ts";
export { default as Vector3, type IVector3 } from "./math/Vector3.ts";

// TF exports
export { default as TFClient } from "./tf/TFClient.ts";
export { default as ROS2TFClient } from "./tf/ROS2TFClient.ts";

// URDF exports
export { default as UrdfBox } from "./urdf/UrdfBox.ts";
export { default as UrdfColor } from "./urdf/UrdfColor.ts";
export { default as UrdfCylinder } from "./urdf/UrdfCylinder.ts";
export { default as UrdfLink } from "./urdf/UrdfLink.ts";
export { default as UrdfMaterial } from "./urdf/UrdfMaterial.ts";
export { default as UrdfMesh } from "./urdf/UrdfMesh.ts";
export {
  default as UrdfModel,
  type UrdfModelOptions,
} from "./urdf/UrdfModel.ts";
export { default as UrdfSphere } from "./urdf/UrdfSphere.ts";
export {
  default as UrdfVisual,
  type UrdfGeometryLike,
} from "./urdf/UrdfVisual.ts";
export { default as UrdfJoint } from "./urdf/UrdfJoint.ts";

export {
  UrdfAttrs,
  UrdfType,
  type UrdfDefaultOptions,
} from "./urdf/UrdfTypes.ts";
export { isElement, parseUrdfOrigin } from "./urdf/UrdfUtils.ts";

// only export the types that typedoc requires us to export - those are our public interfaces
export { type actionlib_msgs } from "./types/actionlib_msgs.ts";
export { type tf2_web_republisher } from "./types/tf2_web_republisher.ts";
export { type rosapi } from "./types/rosapi.ts";
export { type std_msgs } from "./types/std_msgs.ts";
export { type tf2_msgs } from "./types/tf2_msgs.ts";
export { type geometry_msgs } from "./types/geometry_msgs.ts";
export type { Nullable, PartialNullable } from "./types/interface-types.ts";
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
} from "./types/protocol.ts";
