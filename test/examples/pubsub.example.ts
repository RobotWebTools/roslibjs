import { describe, it, expect, afterAll } from "vitest";
import * as ROSLIB from "../../src/RosLib.js";

describe("Topics Example", function () {
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  const example = ros.Topic({
    name: "/example_topic",
    messageType: "std_msgs/String",
  });

  function format(msg) {
    return { data: msg };
  }
  const messages1 = ["Hello Example2!", "Whats good?"].map(format);
  const messages2 = ["Hi there", "this example working"].map(format);

  const example2 = ros.Topic({
    name: "/example_topic",
    messageType: "std_msgs/String",
  });

  it("Listening and publishing to a topic", () =>
    new Promise((done) => {
      // Kind of harry...
      let topic1msg = messages1[0],
        topic2msg: { data?: string } = {};
      example.subscribe(function (message) {
        if (message.data === topic1msg.data) {
          return;
        }
        topic1msg = messages1[0];
        expect(message).to.be.eql(messages2.shift());
        if (messages1.length) {
          example.publish(topic1msg);
        } else {
          done(message);
        }
      });
      example2.subscribe(function (message) {
        if (message.data === topic2msg.data) {
          return;
        }
        topic2msg = messages2[0];
        expect(message).to.be.eql(messages1.shift());
        if (messages2.length) {
          example2.publish(topic2msg);
        } else {
          done(message);
        }
      });
      example.publish(topic1msg);
    }));

  it("unsubscribe doesn't affect other topics", () =>
    new Promise((done) => {
      example2.subscribe(function () {
        // should never be called
        expect(false).toBeTruthy();
      });
      example.unsubscribe();
      example2.removeAllListeners("message");
      example2.subscribe(function (message) {
        expect(message).to.be.eql({
          data: "hi",
        });
        done(message);
      });
      example.publish({
        data: "hi",
      });
    }));

  it("unadvertise doesn't affect other topics", () =>
    new Promise((done) => {
      example.unsubscribe();
      example2.unadvertise();
      example2.removeAllListeners("message");
      example2.subscribe(function (message) {
        expect(example2.isAdvertised).toBeFalsy();
        expect(message).to.be.eql({
          data: "hi",
        });
        done(message);
      });
      example.publish({
        data: "hi",
      });
    }));

  it("unsubscribing from all Topics should stop the socket from receiving data (on that topic", () =>
    new Promise((done) => {
      example.unsubscribe();
      example2.unsubscribe();
      ros.on("/example_topic", function () {
        expect(false).toBeTruthy();
      });
      example.publish({
        data: "sup",
      });
      setTimeout(done, 500);
    }));

  afterAll(function () {
    example.unadvertise();
    example.unsubscribe();
    example2.unadvertise();
    example2.unsubscribe();
  });
}, 1000);
