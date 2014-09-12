/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROSLIB = this.ROSLIB || {
  REVISION : '0.10.0-SNAPSHOT',
};

ROSLIB.Ros = require('./core/Ros');
ROSLIB.Topic = require('./core/Topic');
ROSLIB.Message = require('./core/Message');
ROSLIB.Param = require('./core/Param');
ROSLIB.Service = require('./core/Service');
ROSLIB.ServiceRequest = require('./core/ServiceRequest');
ROSLIB.ServiceResponse = require('./core/ServiceResponse');

ROSLIB.ActionClient = require('./actionlib/ActionClient');
ROSLIB.Goal = require('./actionlib/Goal');
ROSLIB.SimpleActionServer = require('./actionlib/SimpleActionServer');

ROSLIB.Pose = require('./math/Pose');
ROSLIB.Quaternion = require('./math/Quaternion');
ROSLIB.Transform = require('./math/Transform');
ROSLIB.Vector3 = require('./math/Vector3');

ROSLIB.TFClient = require('./tf/TFClient');

ROSLIB.UrdfBox = require('./urdf/UrdfBox');
ROSLIB.UrdfColor = require('./urdf/UrdfColor');
ROSLIB.UrdfCylinder = require('./urdf/UrdfCylinder');
ROSLIB.UrdfLink = require('./urdf/UrdfLink');
ROSLIB.UrdfMaterial = require('./urdf/UrdfMaterial');
ROSLIB.UrdfMesh = require('./urdf/UrdfMesh');
ROSLIB.UrdfModel = require('./urdf/UrdfModel');
ROSLIB.UrdfSphere = require('./urdf/UrdfSphere');
ROSLIB.UrdfVisual = require('./urdf/UrdfVisual');

//URDF types
var UrdfTypes = require('./urdf/UrdfTypes');
Object.keys(UrdfTypes).forEach(function(type) {
	ROSLIB[type] = UrdfTypes[type];
});

module.exports = ROSLIB;