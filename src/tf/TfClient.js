(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['robotwebtools/eventemitter2','robotwebtools/actionclient'], factory);
  }
  else {
    root.TfClient = factory(root.EventEmitter2,root.ActionClient);
  }
}(this, function (EventEmitter2, ActionClient) {

  var TfClient = function(options) {
    this.ros = options.ros;
    this.fixedFrame = options.fixedFrame || 'base_link';
    this.angularThres = options.angularThres || 2.0;
    this.transThres = options.transThres || 0.01;
    this.rate = options.rate || 10.0;
    this.goalUpdateDelay = options.goalUpdateDelay !== undefined ? options.goalUpdateDelay : 50;

    var options = {
      ros: this.ros,
      serverName: options.serverName || "/tf2_web_republisher",
      actionName: "tf2_web_republisher/TFSubscriptionAction"
    };

    this.actionClient = new ActionClient( options );
    this.currentGoal = false;
    this.frame_infos = {};
    this.goalUpdateRequested = false;
  };

  TfClient.prototype.__proto__ = EventEmitter2.prototype;

  TfClient.prototype.processFeedback = function(tfMsg) {
    var that = this;
    tfMsg.transforms.forEach( function(transform) {
      var frameId = transform.child_frame_id;
      var info = that.frame_infos[frameId];
      if ( info != undefined ) {
        info.transform = new Transform(transform.transform.translation,transform.transform.rotation);
        info.cbs.forEach(function(cb) {
          cb(info.transform);
        });
      }
    });
  }

  TfClient.prototype.requestGoalUpdate = function() {
    if ( !this.goalUpdateRequested ) {
      setTimeout(this.updateGoal.bind(this), this.goalUpdateDelay);
      this.goalUpdateRequested = true;
      return;
    }
  }

  TfClient.prototype.updateGoal = function() {
    // Anytime the list of frames changes,
    // we will need to send a new goal.
    if ( this.currentGoal ) {
      this.currentGoal.cancel();
    }

    var goalMsg = {
      source_frames: [],
       target_frame: this.fixedFrame,
       angular_thres: this.angularThres,
       trans_thres: this.transThres,
       rate: this.rate
    };

    var source_frames = [];
    for (frame in this.frame_infos ) {
      goalMsg.source_frames.push(frame);
    };

    this.currentGoal = new this.actionClient.Goal(goalMsg);
    this.currentGoal.on('feedback', this.processFeedback.bind(this));
    this.currentGoal.send();
    this.goalUpdateRequested = false;
  }

  TfClient.prototype.subscribe = function(frameId,callback) {
    // make sure the frame id is relative
    if ( frameId[0] === "/" ) {
      frameId = frameId.substring(1);
    }
    // if there is no callback registered for the given frame,
    // create emtpy callback list
    if ( this.frame_infos[frameId] == undefined ) {
      this.frame_infos[frameId] = {
        cbs: [] };
      this.requestGoalUpdate();
    } else {
      // if we already have a transform, call back immediately
      if ( this.frame_infos[frameId].transform != undefined ) {
        callback( this.frame_infos[frameId].transform );
      }
    }
    this.frame_infos[frameId].cbs.push( callback );
  };

  TfClient.prototype.unsubscribe = function(frameId,callback) {
    var info = this.frame_infos[frameId];
    if ( info != undefined ) {
      var cbIndex = info.cbs.indexOf( callback );
      if ( cbIndex >= 0 ) {
        info.cbs.splice(cbIndex, 1);
        if ( info.cbs.length == 0 ) {
          delete this.frame_infos[frameId];
        }
      this.needUpdate = true;
      }
    }
  }


  var Pose = TfClient.Pose = function( position, orientation ) {
    this.position = new Vector3;
    this.orientation = new Quaternion;
    if ( position !== undefined ) {
      this.position.copy( position );
    }
    if ( orientation !== undefined ) {
      this.orientation.copy( orientation );
    }
  };

  Pose.prototype = {
    constructor: Pose,
    copy: function( pose ) {
      this.position.copy( pose.position );
      this.orientation.copy( pose.orientation );
    }
  }

  var Transform = TfClient.Transform = function( translation, rotation ) {
    this.translation = new Vector3;
    this.rotation = new Quaternion;
    if ( translation !== undefined ) {
      this.translation.copy( translation );
    }
    if ( rotation !== undefined ) {
      this.rotation.copy( rotation );
    }
  };

  Transform.prototype = {
    constructor: Transform,
    apply: function( pose ) {
      this.rotation.multiplyVec3(pose.position);
      pose.position.add(pose.position,this.translation);
      pose.orientation.multiply(this.rotation, pose.orientation);
      return pose;
    },
    applyInverse: function( pose ) {
      var rotInv = this.rotation.clone().inverse();
      rotInv.multiplyVec3(pose.position);
      pose.position.sub(pose.position,this.translation);
      pose.orientation.multiply(rotInv, pose.orientation);
      return pose;
    },
    copy: function( transform ) {
      this.translation.copy( transform.translation );
      this.rotation.copy( transform.rotation );
    }
  }

  var Quaternion = TfClient.Quaternion = function( x, y, z, w ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = ( w !== undefined ) ? w : 1;
  };

  Quaternion.prototype = {
    constructor: Quaternion,
    copy: function ( q ) {
      this.x = q.x;
      this.y = q.y;
      this.z = q.z;
      this.w = q.w;
      return this;
    },
    inverse: function () {
      this.conjugate().normalize();
      return this;
    },
    conjugate: function () {
      this.x *= -1;
      this.y *= -1;
      this.z *= -1;
      return this;
    },
    normalize: function () {
      var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );
      if ( l === 0 ) {
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
      return this;
    },
    multiply: function ( a, b ) {
      var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w,
      qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
      this.x =  qax * qbw + qay * qbz - qaz * qby + qaw * qbx;
      this.y = -qax * qbz + qay * qbw + qaz * qbx + qaw * qby;
      this.z =  qax * qby - qay * qbx + qaz * qbw + qaw * qbz;
      this.w = -qax * qbx - qay * qby - qaz * qbz + qaw * qbw;
      return this;
    },
    multiplyVec3: function ( vector, dest ) {
      if ( !dest ) { dest = vector; }
      var x    = vector.x,  y  = vector.y,  z  = vector.z,
        qx   = this.x, qy = this.y, qz = this.z, qw = this.w;
      var ix =  qw * x + qy * z - qz * y,
        iy =  qw * y + qz * x - qx * z,
        iz =  qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;
      dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
      dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
      dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
      return dest;
    },
    clone: function () {
      return new Quaternion( this.x, this.y, this.z, this.w );
    }
  }

  var Vector3 = TfClient.Vector3 = function ( x, y, z ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  };

  Vector3.prototype = {
    constructor: Vector3,
    copy: function ( v ) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    },
    add: function ( a, b ) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      return this;
    },
    sub: function ( a, b ) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    },
    clone: function () {
      return new Vector3( this.x, this.y, this.z );
    }
  };

  return TfClient;
}));
