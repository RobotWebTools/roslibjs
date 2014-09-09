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

      // Temporarily silence the error reporting, because we're actually
      // generating an error condition
      var console_error = console.error;
      var console_trace = console.trace;
      console.error = function(x){};
      console.trace = function(){};

      for (var i = 0; i < callCount; i++) {
        eventEmitter.on('foo', function() { });
      }
      expect(eventEmitter._events['foo']).to.have.length(callCount);
      expect(eventEmitter._events['foo']).to.have.property('warned');

      // restore error reporting
      console.error = console_error;
      console.trace = console_trace;

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
