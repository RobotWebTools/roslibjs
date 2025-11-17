/* eslint-disable @typescript-eslint/unbound-method -- to expect spy methods */

import type { MockedObject } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AbstractTransport } from "../src/core/transport/Transport.ts";
import { WebSocketTransportFactory } from "../src/core/transport/WebSocketTransportFactory.ts";
import type {
  RosbridgeMessage,
  RosbridgePngMessage,
} from "../src/types/protocol.ts";
import { encode } from "cbor2";
import * as fastpng from "fast-png";
import * as bson from "bson";
import * as ws from "ws";
import { NativeWebSocketTransport } from "../src/core/transport/NativeWebSocketTransport.ts";
import { WsWebSocketTransport } from "../src/core/transport/WsWebSocketTransport.ts";

vi.mock("fast-png");

describe("Transport", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("AbstractTransport", () => {
    const messageListener = vi.fn();
    const errorListener = vi.fn();

    let mockPngParseModule: MockedObject<typeof fastpng>;
    let mockSocket: MockedObject<WebSocket>;

    let transport: AbstractTransport;

    beforeEach(() => {
      // So that the nodejs decompress png util is used, not the browser one
      vi.stubGlobal("window", undefined);

      mockPngParseModule = vi.mocked(fastpng);

      mockSocket = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: WebSocket.OPEN,
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
      } as unknown as MockedObject<WebSocket>;

      transport = new NativeWebSocketTransport(mockSocket);

      transport.on("message", messageListener);
      transport.on("error", errorListener);
    });

    it("should handle RosbridgeMessage", () => {
      const message: RosbridgeMessage = {
        op: "set_level",
        level: "info",
      };

      const messageEvent: Partial<MessageEvent> = {
        type: "message",
        data: JSON.stringify(message),
      };

      mockSocket.onmessage?.(messageEvent as MessageEvent);

      expect(messageListener).toHaveBeenCalledWith(message);
    });

    describe("should handle RosbridgeFragmentMessage", () => {
      const sendFragment = (
        id: string,
        total: number,
        fragments: unknown[],
      ) => {
        for (let i = 0; i < fragments.length; i++) {
          mockSocket.onmessage?.({
            type: "message",
            data: JSON.stringify({
              op: "fragment",
              id,
              data: fragments[i],
              num: i,
              total,
            }),
          } as MessageEvent);
        }
      };

      it("reassembles fragments and emits message", () => {
        const id = "test1";
        const total = 3;
        const msg = { op: "publish", topic: "foo", msg: { data: 42 } };
        const json = JSON.stringify(msg);
        const fragments = [
          json.slice(0, 10),
          json.slice(10, 20),
          json.slice(20),
        ];
        sendFragment(id, total, fragments);
        expect(messageListener).toHaveBeenCalledWith(msg);
        expect(messageListener).toHaveBeenCalledTimes(1);
        expect(errorListener).toHaveBeenCalledTimes(0);
      });

      it("handles float total by using integer part", () => {
        const id = "test2";
        const total = 2.9;
        const msg = { op: "publish", topic: "bar", msg: { data: 99 } };
        const json = JSON.stringify(msg);
        const fragments = [json.slice(0, 10), json.slice(10)];
        sendFragment(id, total, fragments);
        expect(messageListener).toHaveBeenCalledWith(msg);
        expect(messageListener).toHaveBeenCalledTimes(1);
        expect(errorListener).toHaveBeenCalledTimes(0);
      });

      it("handles extra fragments beyond integer total", () => {
        const id = "test3";
        const total = 2.1;
        const msg = { op: "publish", topic: "baz", msg: { data: 7 } };
        const json = JSON.stringify(msg);
        const fragments = [json.slice(0, 10), json.slice(10), "extra"];
        sendFragment(id, total, fragments);
        expect(messageListener).toHaveBeenCalledWith(msg);
        expect(messageListener).toHaveBeenCalledTimes(1);
        expect(errorListener).toHaveBeenCalledTimes(0);
      });

      it("does not emit if fragments are missing", () => {
        const id = "test4";
        const total = 2;
        const msg = { op: "publish", topic: "qux", msg: { data: 123 } };
        const json = JSON.stringify(msg);
        const fragments = [json.slice(0, 10)]; // missing one fragment
        sendFragment(id, total, fragments);
        expect(messageListener).toHaveBeenCalledTimes(0);
        expect(errorListener).toHaveBeenCalledTimes(0);
      });

      it("ignores malformed fragments", () => {
        mockSocket.onmessage?.({
          type: "message",
          data: JSON.stringify({ op: "fragment", id: "bad" }),
        } as MessageEvent);
        expect(messageListener).toHaveBeenCalledTimes(0);
        expect(errorListener).toHaveBeenCalledTimes(0);
      });

      it("emits error when reassembled message is invalid", () => {
        const id = "test5";
        const total = 1;
        const fragments = ['{ "foo": "bar" }'];
        sendFragment(id, total, fragments);
        expect(messageListener).toHaveBeenCalledTimes(0);
        expect(errorListener).toHaveBeenCalledTimes(1);
        expect(errorListener).toHaveBeenCalledWith(
          new Error("Received invalid rosbridge message!"),
        );
      });

      it("emits error when reassembled message is invalid JSON", () => {
        const id = "test6";
        const total = 1;
        const fragments = ["{ not valid json }"];
        sendFragment(id, total, fragments);
        expect(messageListener).toHaveBeenCalledTimes(0);
        expect(errorListener).toHaveBeenCalledTimes(1);
        expect(errorListener).toHaveBeenCalledWith(
          new Error("Fragments did not form a valid JSON message!"),
        );
      });
    });

    it("should handle RosbridgePngMessage", async () => {
      mockPngParseModule.decode.mockImplementation(
        (
          // Normally, this is the compressed PNG data.
          // For our tests, it's a string buffer of "success" or "failure".
          data: fastpng.DecoderInputType,
        ) => {
          const decodedImage: fastpng.DecodedPng = {
            width: 100,
            height: 100,
            depth: 8,
            channels: 1,
            text: {},
            data: Buffer.from(JSON.stringify({ op: "test" })),
          };
          switch (new TextDecoder().decode(data)) {
            case "success":
              return decodedImage;
            case "failure":
              throw new Error("test");
            default:
              throw new Error("invalid test data");
          }
        },
      );

      // Obviously these are not real PNG encoded messages.
      // But they're good enough for mocking responses in our tests.
      const successMessage: RosbridgePngMessage = {
        op: "png",
        data: Buffer.from("success").toString("base64"),
      };

      const failureMessage: RosbridgePngMessage = {
        op: "png",
        data: Buffer.from("failure").toString("base64"),
      };

      // -- SUCCESS -- //

      mockSocket.onmessage?.({
        type: "message",
        data: JSON.stringify(successMessage),
      } as MessageEvent);

      // Wait for the message to be processed.
      // PNG decompression occurs asynchronously.
      await vi.waitFor(() => {
        expect(errorListener).not.toHaveBeenCalled();
        expect(messageListener).toHaveBeenCalledWith({ op: "test" });
      }, 500);

      vi.clearAllMocks();

      // -- FAILURE -- //

      mockSocket.onmessage?.({
        type: "message",
        data: JSON.stringify(failureMessage),
      } as MessageEvent);

      // Wait for the message to be processed.
      // PNG decompression occurs asynchronously.
      await vi.waitFor(() => {
        expect(errorListener).toHaveBeenCalledWith(
          new Error("Error decoding PNG buffer"),
        );
        expect(messageListener).not.toHaveBeenCalled();
      }, 500);
    });

    it("should handle BSON message", async () => {
      const goodBsonData = bson.serialize({ op: "test" });
      const successMessage = new Blob([Buffer.from(goodBsonData)]);

      const badBsonData = bson.serialize({ foo: "bar" });
      const failureMessage = new Blob([Buffer.from(badBsonData)]);

      // -- SUCCESS -- //

      mockSocket.onmessage?.({
        type: "message",
        data: successMessage,
      } as MessageEvent);

      // Wait for the message to be processed.
      // BSON decompression occurs asynchronously.
      await vi.waitFor(() => {
        expect(errorListener).not.toHaveBeenCalled();
        expect(messageListener).toHaveBeenCalledWith({ op: "test" });
      }, 500);

      vi.clearAllMocks();

      // -- FAILURE -- //

      mockSocket.onmessage?.({
        type: "message",
        data: failureMessage,
      } as MessageEvent);

      // Wait for the message to be processed.
      // BSON decompression occurs asynchronously.
      await vi.waitFor(() => {
        expect(errorListener).toHaveBeenCalledWith(
          new Error("Decoded BSON data was invalid!"),
        );
        expect(messageListener).not.toHaveBeenCalled();
      }, 500);
    });

    it("should handle CBOR message", async () => {
      // CBOR data comes as ArrayBuffer from WebSocket, not Uint8Array
      const successMessage = encode({ op: "test" }).buffer;
      const failureMessage = encode({ foo: "bar" }).buffer;

      // -- SUCCESS -- //

      mockSocket.onmessage?.({
        type: "message",
        data: successMessage,
      } as MessageEvent);

      // Wait for the message to be processed.
      // CBOR decompression occurs asynchronously.
      await vi.waitFor(() => {
        expect(errorListener).not.toHaveBeenCalled();
        expect(messageListener).toHaveBeenCalledWith({ op: "test" });
      }, 500);

      vi.clearAllMocks();

      // -- FAILURE -- //

      mockSocket.onmessage?.({
        type: "message",
        data: failureMessage,
      } as MessageEvent);

      // Wait for the message to be processed.
      // CBOR decompression occurs asynchronously.
      await vi.waitFor(() => {
        expect(errorListener).toHaveBeenCalledWith(
          new Error("Decoded CBOR data was invalid!"),
        );
        expect(messageListener).not.toHaveBeenCalled();
      }, 500);
    });

    it("should handle JSON message", () => {
      const successMessage = JSON.stringify({ op: "test" });
      const failureMessage = JSON.stringify({ foo: "bar" });

      // -- SUCCESS -- //

      mockSocket.onmessage?.({
        type: "message",
        data: successMessage,
      } as MessageEvent);

      expect(errorListener).not.toHaveBeenCalled();
      expect(messageListener).toHaveBeenCalledWith({ op: "test" });

      vi.clearAllMocks();

      // -- FAILURE -- //

      mockSocket.onmessage?.({
        type: "message",
        data: failureMessage,
      } as MessageEvent);

      expect(errorListener).toHaveBeenCalledWith(
        new Error("Received invalid rosbridge message!"),
      );
      expect(messageListener).not.toHaveBeenCalled();
    });
  });

  describe("NativeWebSocketTransport", () => {
    let mockSocket: MockedObject<WebSocket>;

    beforeEach(() => {
      mockSocket = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: WebSocket.OPEN,
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
      } as unknown as MockedObject<WebSocket>;
    });

    it("should send messages as JSON", () => {
      const transport = new NativeWebSocketTransport(mockSocket);

      transport.send({ op: "set_level", level: "info" });

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ op: "set_level", level: "info" }),
      );
    });

    it("should close the socket", () => {
      const transport = new NativeWebSocketTransport(mockSocket);

      transport.close();

      expect(mockSocket.close).toHaveBeenCalled();
    });

    it("should reflect the socket's ready state", () => {
      const transport = new NativeWebSocketTransport(mockSocket);

      // -- CONNECTING --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = WebSocket.CONNECTING;

      expect(transport.isConnecting()).toBe(true);
      expect(transport.isOpen()).toBe(false);
      expect(transport.isClosing()).toBe(false);
      expect(transport.isClosed()).toBe(false);

      // -- OPEN --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = WebSocket.OPEN;

      expect(transport.isConnecting()).toBe(false);
      expect(transport.isOpen()).toBe(true);
      expect(transport.isClosing()).toBe(false);
      expect(transport.isClosed()).toBe(false);

      // -- CLOSING --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = WebSocket.CLOSING;

      expect(transport.isConnecting()).toBe(false);
      expect(transport.isOpen()).toBe(false);
      expect(transport.isClosing()).toBe(true);
      expect(transport.isClosed()).toBe(false);

      // -- CLOSED --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = WebSocket.CLOSED;

      expect(transport.isConnecting()).toBe(false);
      expect(transport.isOpen()).toBe(false);
      expect(transport.isClosing()).toBe(false);
      expect(transport.isClosed()).toBe(true);
    });

    it("should emit events when the socket is opened, closed, or errors", () => {
      const transport = new NativeWebSocketTransport(mockSocket);

      const openListener = vi.fn();
      const closeListener = vi.fn();
      const errorListener = vi.fn();

      transport.on("open", openListener);
      transport.on("close", closeListener);
      transport.on("error", errorListener);

      // -- OPEN -- //

      const openEvent: Partial<Event> = { type: "open" };

      mockSocket.onopen?.(openEvent as Event);

      expect(openListener).toHaveBeenCalledWith(openEvent);
      expect(closeListener).not.toHaveBeenCalled();
      expect(errorListener).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // -- CLOSE -- //

      const closeEvent: Partial<CloseEvent> = { type: "close" };

      mockSocket.onclose?.(closeEvent as CloseEvent);

      expect(openListener).not.toHaveBeenCalled();
      expect(closeListener).toHaveBeenCalledWith(closeEvent);
      expect(errorListener).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // -- ERROR -- //

      const errorEvent: Partial<ErrorEvent> = { type: "error" };

      mockSocket.onerror?.(errorEvent as ErrorEvent);

      expect(openListener).not.toHaveBeenCalled();
      expect(closeListener).not.toHaveBeenCalled();
      expect(errorListener).toHaveBeenCalledWith(errorEvent);
    });

    it("should emit messages as RosbridgeMessage objects", () => {
      const transport = new NativeWebSocketTransport(mockSocket);

      const messageListener = vi.fn();

      transport.on("message", messageListener);

      const message: RosbridgeMessage = {
        op: "set_level",
        level: "info",
      };

      const messageEvent: Partial<MessageEvent> = {
        type: "message",
        data: JSON.stringify(message),
      };

      mockSocket.onmessage?.(messageEvent as MessageEvent);

      expect(messageListener).toHaveBeenCalledWith(message);
    });
  });

  describe("WsWebSocketTransport", () => {
    let mockSocket: MockedObject<ws.WebSocket>;

    beforeEach(() => {
      mockSocket = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: ws.WebSocket.OPEN,
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
      } as unknown as MockedObject<ws.WebSocket>;
    });

    it("should send messages as JSON", () => {
      const transport = new WsWebSocketTransport(mockSocket);

      transport.send({ op: "set_level", level: "info" });

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ op: "set_level", level: "info" }),
      );
    });

    it("should close the socket", () => {
      const transport = new WsWebSocketTransport(mockSocket);

      transport.close();

      expect(mockSocket.close).toHaveBeenCalled();
    });

    it("should reflect the socket's ready state", () => {
      const transport = new WsWebSocketTransport(mockSocket);

      // -- CONNECTING --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = ws.WebSocket.CONNECTING;

      expect(transport.isConnecting()).toBe(true);
      expect(transport.isOpen()).toBe(false);
      expect(transport.isClosing()).toBe(false);
      expect(transport.isClosed()).toBe(false);

      // -- OPEN --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = ws.WebSocket.OPEN;

      expect(transport.isConnecting()).toBe(false);
      expect(transport.isOpen()).toBe(true);
      expect(transport.isClosing()).toBe(false);
      expect(transport.isClosed()).toBe(false);

      // -- CLOSING --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = ws.WebSocket.CLOSING;

      expect(transport.isConnecting()).toBe(false);
      expect(transport.isOpen()).toBe(false);
      expect(transport.isClosing()).toBe(true);
      expect(transport.isClosed()).toBe(false);

      // -- CLOSED --

      // @ts-expect-error -- mocking readonly property
      mockSocket.readyState = ws.WebSocket.CLOSED;

      expect(transport.isConnecting()).toBe(false);
      expect(transport.isOpen()).toBe(false);
      expect(transport.isClosing()).toBe(false);
      expect(transport.isClosed()).toBe(true);
    });

    it("should emit events when the socket is opened, closed, or errors", () => {
      const transport = new WsWebSocketTransport(mockSocket);

      const openListener = vi.fn();
      const closeListener = vi.fn();
      const errorListener = vi.fn();

      transport.on("open", openListener);
      transport.on("close", closeListener);
      transport.on("error", errorListener);

      // -- OPEN -- //

      const openEvent: Partial<ws.Event> = { type: "open" };

      mockSocket.onopen?.(openEvent as ws.Event);

      expect(openListener).toHaveBeenCalledWith(openEvent);
      expect(closeListener).not.toHaveBeenCalled();
      expect(errorListener).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // -- CLOSE -- //

      const closeEvent: Partial<ws.CloseEvent> = { type: "close" };

      mockSocket.onclose?.(closeEvent as ws.CloseEvent);

      expect(openListener).not.toHaveBeenCalled();
      expect(closeListener).toHaveBeenCalledWith(closeEvent);
      expect(errorListener).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // -- ERROR -- //

      const errorEvent: Partial<ws.ErrorEvent> = { type: "error" };

      mockSocket.onerror?.(errorEvent as ws.ErrorEvent);

      expect(openListener).not.toHaveBeenCalled();
      expect(closeListener).not.toHaveBeenCalled();
      expect(errorListener).toHaveBeenCalledWith(errorEvent);
    });

    it("should emit messages as RosbridgeMessage objects", () => {
      const transport = new WsWebSocketTransport(mockSocket);

      const messageListener = vi.fn();

      transport.on("message", messageListener);

      const message: RosbridgeMessage = {
        op: "set_level",
        level: "info",
      };

      const messageEvent: ws.MessageEvent = {
        type: "message",
        target: mockSocket,
        data: JSON.stringify(message),
      };

      mockSocket.onmessage?.(messageEvent);

      expect(messageListener).toHaveBeenCalledWith(message);
    });
  });

  describe("WebSocketTransportFactory", () => {
    it("uses native WebSocket when available", async () => {
      vi.stubGlobal("WebSocket", WebSocket);
      expect(typeof WebSocket).toBe("function");

      const transport = await WebSocketTransportFactory("ws://localhost:9090");

      expect(transport).toBeInstanceOf(NativeWebSocketTransport);
    });

    it("uses ws package WebSocket when native WebSocket is not available", async () => {
      vi.stubGlobal("WebSocket", undefined);
      expect(typeof WebSocket).toBe("undefined");

      const transport = await WebSocketTransportFactory("ws://localhost:9090");

      expect(transport).toBeInstanceOf(WsWebSocketTransport);
    });
  });
});
