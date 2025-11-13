/* eslint-disable @typescript-eslint/unbound-method -- to expect spy methods */

import type { MockedObject } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NativeWebSocketTransport,
  WebSocketTransportFactory,
  WsWebSocketTransport,
} from "../src/core/Transport.js";
import * as ws from "ws";
import type { RosbridgeMessage } from "../src/types/protocol.js";

describe("Transport", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("AbstractTransport", () => {
    it.todo("todo");
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

      transport.send({ op: "test" });

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ op: "test" }),
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
        op: "test",
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

      transport.send({ op: "test" });

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ op: "test" }),
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
        op: "test",
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

      const factory = new WebSocketTransportFactory();

      const transport = await factory.createTransport("ws://localhost:9090");

      expect(transport).toBeInstanceOf(NativeWebSocketTransport);
    });

    it("uses ws package WebSocket when native WebSocket is not available", async () => {
      vi.stubGlobal("WebSocket", undefined);
      expect(typeof WebSocket).toBe("undefined");

      const factory = new WebSocketTransportFactory();

      const transport = await factory.createTransport("ws://localhost:9090");

      expect(transport).toBeInstanceOf(WsWebSocketTransport);
    });
  });
});
