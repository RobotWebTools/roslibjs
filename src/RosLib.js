/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROSLIB = this.ROSLIB || {
  REVISION : '0.10.0'
};

var Ros = ROSLIB.Ros = require('./core/Ros');
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

// Add URDF types
require('object-assign')(ROSLIB, require('./urdf/UrdfTypes'));

['ActionClient', 'Param', 'Service', 'SimpleActionServer', 'Topic', 'TFClient'].forEach(function(className) {
    var Class = ROSLIB[className];
    Ros.prototype[className] = function(options) {
        options.ros = this;
        return new Class(options);
    };
});

module.exports = ROSLIB;
