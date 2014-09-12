var expect = require('chai').expect;
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var ROSLIB = require('..');

describe('ROS', function() {

  describe('callOnConnection', function() {
    it('should accept more than EventEmitter2\'s default listeners', function() {
      // By default, EventEmitter2 only accepts 10 listeners. When more than
      // the default, a 'warn' property is set on the listener. The firt part
      // of this test proves the 'warn' property will be set with default
      // EventEmitter2 settings.
      var callCount = 50;
      var eventEmitter = new EventEmitter2();
      for (var i = 0; i < callCount; i++) {
        eventEmitter.on('foo', function() { });
      }
      expect(eventEmitter._events['foo']).to.have.length(callCount);
      expect(eventEmitter._events['foo']).to.have.property('warned');

      // The next part of this test shows that the 'warn' property is not set
      // for Ros, even with the same number of listeners as above.
      var ros = new ROSLIB.Ros();
      for (var i = 0; i < callCount; i++) {
        ros.callOnConnection({});
      }
      expect(ros._events['connection']).to.have.length(callCount);
      expect(ros._events['connection']).to.not.have.property('warned');
    });
  });

});

