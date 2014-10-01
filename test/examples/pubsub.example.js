var expect = require('chai').expect;
var ROSLIB = require('../..');

describe('Topics Example', function() {
    this.timeout(1000);

    var ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });

    var example = ros.Topic({
        name: '/example_topic',
        messageType: 'std_msgs/String'
    });

    function format(msg) {
        return {data: msg};
    }
    var messages1 = ['Hello Example2!', 'Whats good?'].map(format);
    var messages2 = ['Hi there', 'this example working'].map(format);

    var example2 = ros.Topic({
        name: '/example_topic',
        messageType: 'std_msgs/String'
    });

    it('Listening and publishing to a topic', function(done) {
        // Kind of harry...
        var topic1msg = messages1[0],
            topic2msg = {};
        example.subscribe(function(message) {
            if (message.data === topic1msg.data) return;
            topic1msg = messages1[0];
            expect(message).to.be.eql(messages2.shift());
            if (messages1.length) example.publish(topic1msg);
            else done();
        });
        example2.subscribe(function(message) {
            if (message.data === topic2msg.data) return;
            topic2msg = messages2[0];
            expect(message).to.be.eql(messages1.shift());
            if (messages2.length) example2.publish(topic2msg);
            else done();
        });
        example.publish(topic1msg);
    });

    it('unsubscribe doesn\'t affect other topics', function(done) {
        example2.subscribe(function(message) {
            // should never be called
            expect(false).to.be.ok;
        });
        example.unsubscribe();
        example2.removeAllListeners('message');
        example2.subscribe(function(message) {
            expect(message).to.be.eql({
                data: 'hi'
            });
            done();
        });
        example.publish({
            data: 'hi'
        });
    });

    it('unadvertise doesn\'t affect other topics', function(done) {
        example.unsubscribe();
        example2.unadvertise();
        example2.removeAllListeners('message');
        example2.subscribe(function(message) {
            expect(example2.isAdvertised).to.be.false;
            expect(message).to.be.eql({
                data: 'hi'
            });
            done();
        });
        example.publish({
            data: 'hi'
        });
    });

    it('unsubscribing from all Topics should stop the socket from receiving data (on that topic', function(done) {
        example.unsubscribe();
        example2.unsubscribe();
        ros.on('/example_topic', function() {
            expect(false).to.be.ok;
        });
        example.publish({
            data: 'sup'
        });
        setTimeout(done, 500);
    });

    this.afterAll(function() {
        example.unadvertise();
        example.unsubscribe();
        example2.unadvertise();
        example2.unsubscribe();
    });
});