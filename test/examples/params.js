var expect = require('chai').expect;
var ROSLIB = require('../..');

var expectedTopics = [
    // '/turtle1/cmd_vel', '/turtle1/color_sensor', '/turtle1/pose',
    // '/turtle2/cmd_vel', '/turtle2/color_sensor', '/turtle2/pose',
    '/tf2_web_republisher/status', '/tf2_web_republisher/feedback',
    // '/tf2_web_republisher/goal', '/tf2_web_republisher/result',
    '/fibonacci/feedback', '/fibonacci/status', '/fibonacci/result'
];

describe('Param setting', function() {
    var ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });
    var param = ros.Param({
        name: '/test/foo'
    });
    it('Param.set', function(done) {
        param.set('bar', done);
        expect(param).to.be.instanceOf(ROSLIB.Param);
        expect(param.name).to.be.equal('/test/foo');
    });

    it('Param.get', function(done) {
        param.get(function(result) {
            expect(result).to.be.equal('bar');
        });
    });

    it('Param.delete', function(done) {
        param.delete(function() {
            ros.getTopics(function(topics) {
                expect(topics).to.not.include(param.name);
                done();
            });
        });
    });
});
