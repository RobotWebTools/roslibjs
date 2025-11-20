import { describe, it, expect, afterAll, vi } from "vitest";
import * as ROSLIB from "../../src/RosLib.ts";

describe("Topics Example", function () {
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  const example = ros.Topic<{ data: string }>({
    name: "/example_topic",
    messageType: "std_msgs/String",
  });

  function format(msg: string) {
    return { data: msg };
  }
  const messages1 = ["Hello Example2!", "Whats good?"].map(format);
  const messages2 = ["Hi there", "this example working"].map(format);

  const example2 = ros.Topic<{ data: string }>({
    name: "/example_topic",
    messageType: "std_msgs/String",
  });

  it("Client-side subscribers receive messages from client-side publishers", async () => {
    // Create copies of the message arrays so we can shift from them
    const messages1Copy = [...messages1];
    const messages2Copy = [...messages2];

    const example1Callback = vi.fn((message: { data: string }) => {
      if (messages1.some((m) => m.data === message.data)) {
        return; // Skip our own published message
      }

      const nextMessage = messages1Copy.shift();
      if (nextMessage) {
        example.publish(nextMessage);
      }
    });

    const example2Callback = vi.fn((message: { data: string }) => {
      if (messages2.some((m) => m.data === message.data)) {
        return; // Skip our own published message
      }

      const nextMessage = messages2Copy.shift();
      if (nextMessage) {
        example2.publish(nextMessage);
      }
    });

    example.subscribe(example1Callback);
    example2.subscribe(example2Callback);

    // Start the conversationc
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- this is the first shift, we know it's there
    example.publish(messages1Copy.shift()!);

    // Wait for all expected calls to complete
    await vi.waitFor(
      () => {
        for (const message of messages1) {
          expect(example1Callback).toHaveBeenCalledWith(message);
          expect(example2Callback).toHaveBeenCalledWith(message);
        }
        for (const message of messages2) {
          expect(example1Callback).toHaveBeenCalledWith(message);
          expect(example2Callback).toHaveBeenCalledWith(message);
        }
      },
      { timeout: 5000 },
    );
  }, 10000);

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
