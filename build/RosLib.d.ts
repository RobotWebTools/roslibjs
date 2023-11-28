export = ROSLIB;
/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */
/**
 * If you use roslib in a browser, all the classes will be exported to a global variable called ROSLIB.
 *
 * If you use nodejs, this is the variable you get when you require('roslib').
 */
declare var ROSLIB: {
    URDF_SPHERE: number;
    URDF_BOX: number;
    URDF_CYLINDER: number;
    URDF_MESH: number;
    UrdfBox: typeof import("./urdf/UrdfBox");
    UrdfColor: typeof import("./urdf/UrdfColor");
    UrdfCylinder: typeof import("./urdf/UrdfCylinder");
    UrdfLink: typeof import("./urdf/UrdfLink");
    UrdfMaterial: typeof import("./urdf/UrdfMaterial");
    UrdfMesh: typeof import("./urdf/UrdfMesh");
    UrdfModel: typeof import("./urdf/UrdfModel"); /**
     * @default
     * @description Library version
     */
    UrdfSphere: typeof import("./urdf/UrdfSphere");
    UrdfVisual: typeof import("./urdf/UrdfVisual");
    TFClient: typeof import("./tf/TFClient");
    Pose: typeof import("./math/Pose");
    Quaternion: typeof import("./math/Quaternion");
    Transform: typeof import("./math/Transform");
    Vector3: typeof import("./math/Vector3");
    ActionClient: typeof import("./actionlib/ActionClient");
    ActionListener: typeof import("./actionlib/ActionListener");
    Goal: typeof import("./actionlib/Goal");
    SimpleActionServer: typeof import("./actionlib/SimpleActionServer");
    Ros: typeof import("./core/Ros");
    Topic: typeof import("./core/Topic");
    Message: typeof import("./core/Message");
    Param: typeof import("./core/Param");
    Service: typeof import("./core/Service");
    ServiceRequest: typeof import("./core/ServiceRequest");
    ServiceResponse: typeof import("./core/ServiceResponse");
    /**
     * @default
     * @description Library version
     */
    REVISION: string;
};
