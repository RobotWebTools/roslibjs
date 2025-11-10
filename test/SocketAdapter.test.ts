import { it, describe, expect, beforeEach, vi } from "vitest";
import SocketAdapter, {
  RequiredSocketInterface,
} from "../src/core/SocketAdapter.js";
import { Ros } from "../src/index.js";
import {
  isRosbridgePublishMessage,
  RosbridgeMessage,
} from "../src/types/protocol.js";

describe("SocketAdapter fragment handling", () => {
  let client: Pick<Ros, "emit" | "transportOptions" | "isConnected">;
  let adapter: SocketAdapter;
  let mockSocket: RequiredSocketInterface;

  beforeEach(() => {
    client = {
      emit: vi.fn(),
      transportOptions: {},
      isConnected: false,
    };

    // Create mock WebSocket
    mockSocket = {
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      readyState: 1, // WebSocket.OPEN
      send: vi.fn(),
      close: vi.fn(),
    };

    const options = {
      onOpen: (event: Event) => {
        client.isConnected = true;
        client.emit("connection", event);
      },
      onClose: (event: Event) => {
        client.isConnected = false;
        client.emit("close", event);
      },
      onError: (event: ErrorEvent) => {
        client.emit("error", String(event.error));
      },
      onMessage: (message: RosbridgeMessage) => {
        // Simulate Ros.js message handling
        if (isRosbridgePublishMessage(message)) {
          client.emit(message.topic, message);
        }
      },
    };

    adapter = new SocketAdapter(mockSocket, options);
    vi.clearAllMocks();
  });

  function sendFragment(id: string, total: number, fragments: unknown[]) {
    for (let i = 0; i < fragments.length; i++) {
      // Simulate socket receiving a message
      // @ts-expect-error -- mock unhappy about `this` context mismatch
      mockSocket.onmessage({
        data: JSON.stringify({
          op: "fragment",
          id,
          data: fragments[i],
          num: i,
          total,
        }),
      });
    }
  }

  it("reassembles fragments and emits message", () => {
    const id = "test1";
    const total = 3;
    const msg = { op: "publish", topic: "foo", msg: { data: 42 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10), json.slice(10, 20), json.slice(20)];
    sendFragment(id, total, fragments);
    expect(client.emit).toHaveBeenCalledWith("foo", msg);
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it("handles float total by using integer part", () => {
    const id = "test2";
    const total = 2.9;
    const msg = { op: "publish", topic: "bar", msg: { data: 99 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10), json.slice(10)];
    sendFragment(id, total, fragments);
    expect(client.emit).toHaveBeenCalledWith("bar", msg);
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it("handles extra fragments beyond integer total", () => {
    const id = "test3";
    const total = 2.1;
    const msg = { op: "publish", topic: "baz", msg: { data: 7 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10), json.slice(10), "extra"];
    sendFragment(id, total, fragments);
    expect(client.emit).toHaveBeenCalledWith("baz", msg);
    expect(client.emit).toHaveBeenCalledTimes(1);
  });

  it("does not emit if fragments are missing", () => {
    const id = "test4";
    const total = 2;
    const msg = { op: "publish", topic: "qux", msg: { data: 123 } };
    const json = JSON.stringify(msg);
    const fragments = [json.slice(0, 10)]; // missing one fragment
    sendFragment(id, total, fragments);
    expect(client.emit).not.toHaveBeenCalledWith("qux", { data: 123 });
  });

  it("ignores malformed fragments", () => {
    // @ts-expect-error -- mock unhappy about `this` context mismatch
    mockSocket.onmessage?.({
      data: JSON.stringify({ op: "fragment", id: "bad" }),
    });
    expect(client.emit).not.toHaveBeenCalled();
  });

  describe("socket event handling", () => {
    it("handles socket open event", () => {
      // @ts-expect-error -- mock unhappy about `this` context mismatch
      mockSocket.onopen?.({ type: "open" });
      expect(client.isConnected).toBe(true);
      expect(client.emit).toHaveBeenCalledWith("connection", { type: "open" });
    });

    it("handles socket close event", () => {
      client.isConnected = true;
      // @ts-expect-error -- mock unhappy about `this` context mismatch
      mockSocket.onclose?.({ type: "close" });
      expect(client.isConnected).toBe(false);
      expect(client.emit).toHaveBeenCalledWith("close", { type: "close" });
    });

    it("handles socket error event", () => {
      const errorEvent = { error: new Error("Connection failed") };
      // @ts-expect-error -- mock unhappy about `this` context mismatch
      mockSocket.onerror?.(errorEvent);
      expect(client.emit).toHaveBeenCalledWith(
        "error",
        "Error: Connection failed",
      );
    });
  });

  describe("socket proxy methods", () => {
    it("sends data when socket is open", () => {
      const testData = "test message";
      adapter.send(testData);
      expect(mockSocket.send).toHaveBeenCalledWith(testData);
    });

    it("does not send data when socket is closed", () => {
      // @ts-expect-error -- normally readonly type being manipulated as a mock
      mockSocket.readyState = 3; // WebSocket.CLOSED
      const testData = "test message";
      adapter.send(testData);
      expect(mockSocket.send).not.toHaveBeenCalled();
    });

    it("closes the socket", () => {
      adapter.close();
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it("returns socket readyState", () => {
      // @ts-expect-error -- normally readonly type being manipulated as a mock
      mockSocket.readyState = 2; // WebSocket.CLOSING
      expect(adapter.readyState).toBe(2);
    });
  });
});
