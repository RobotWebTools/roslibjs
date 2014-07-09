/**
 * @author Alan Meekins - alan.meekins@gmail.com
 */

/**
 * Manages message constructors
 *
 * @constructor
 * @param r - Instance of ROSLIB.Ros with established connection
 */
ROSLIB.MessageFactory = function(r){
  this.knownTypes = {};
  this.ros = r;
};
ROSLIB.MessageFactory.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Get a constructor for the specified message type
 *
 * @param type - Message type
 */
ROSLIB.MessageFactory.prototype.getMessageConstructor = function(type){
  return this.knownTypes[type];
};

/**
 * Create an instance of the specified message type
 *
 * @param type - Message type
 */
ROSLIB.MessageFactory.prototype.createMessage = function(type){
  if(!this.knownTypes[type]){
    return null;
  }
  return new this.knownTypes[type]();
};

/**
 * Set constructor of specified type
 *
 * @param type - Message type
 * @param f    - Constructor object
 */
ROSLIB.MessageFactory.prototype.addMessageConstructor = function(type, f){
  this.knownTypes[type] = f;
};

/**
 * Get list of currently known message types
 *
 */
ROSLIB.MessageFactory.prototype.getMessageTypes = function() {
  var list = [];
  for(var type in this.knownTypes){
    list.push(type);
  }
  return list;
};


/**
 * Load message details from server and create message constructor for specified
 * type.
 *
 * @param type - Message type
 * @param cb(type) - Callback, called when message constructor is ready
 */
ROSLIB.MessageFactory.prototype.getMessageDetails = function(type, cb){
  var that = this;

  var factoryConstructor = function(detail){
    var fieldList = detail.fieldList;
    var typeList = detail.typeList;
    var exampleList = detail.exampleList;
    var currentType = detail.currentType;

    return function(){
      for(var fIdx in fieldList){
        var fieldType = typeList[fIdx];
        var fieldName = fieldList[fIdx];
        var fieldExample = exampleList[fIdx];

        //Handle arrays
        if(fieldExample === '[]'){
          this[fieldName] = [];
          continue;
        }

        //Handle basic types
        if(fieldType === 'string'){
          this[fieldName] = String();
        }
        else if(fieldType.indexOf('int') > -1){
          this[fieldName] = Number(0);
        }
        else if(fieldType.indexOf('float') > -1){
          this[fieldName] = Number(0.0);
        }
        else if(fieldType === 'bool'){
          this[fieldName] = Boolean();
        }
        else if(fieldType.length > 0){
          if(fieldExample === '{}'){
            this[fieldName] = that.createMessage(fieldType);
          }
        }
        else{
          //Unsupported type
          this[fieldName] = undefined;
        }
      }
    };
  };

  var getMessageDetailsCallback = function(details){
      for(var idx in details){
        //Create constructor function
        var detail = {
          fieldList : details[idx].fieldnames,
          typeList : details[idx].fieldtypes,
          exampleList : details[idx].examples,
          currentType : details[idx].type
        };

        var f = factoryConstructor(detail);

        this.addMessageConstructor(detail.currentType, f);
      }

      if(cb !== undefined){
        cb(type);
      }
      this.emit('typeready', type);
  };


  this.ros.getMessageDetails(type, getMessageDetailsCallback.bind(this));
};
