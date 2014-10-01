var expect = require('chai').expect;
var ROSLIB = require('../..');

describe('TF2 Republisher Example', function() {
    it('tf republisher', function(done) {
        var ros = new ROSLIB.Ros();
        ros.connect('ws://localhost:9090');

        var tfClient = new ROSLIB.TFClient({
            ros: ros,
            fixedFrame: 'world',
            angularThres: 0.01,
            transThres: 0.01
        });

        // Subscribe to a turtle.
        tfClient.subscribe('turtle1', function(tf) {
            expect(tf.rotation).to.be.eql(new ROSLIB.Quaternion());
            expect(tf.translation).to.be.a.instanceof(ROSLIB.Vector3);
            done();
        });
    });

    it('tf republisher alternative syntax', function(done) {
        var ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });

        var tfClient = ros.TFClient({
            fixedFrame: 'world',
            angularThres: 0.01,
            transThres: 0.01
        });

        // Subscribe to a turtle.
        tfClient.subscribe('turtle1', function(tf) {
            expect(tf.rotation).to.be.eql(new ROSLIB.Quaternion());
            expect(tf.translation).to.be.a.instanceof(ROSLIB.Vector3);
            done();
        });
    });
});