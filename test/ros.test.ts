/* eslint-disable */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ROSLIB from "../src/RosLib.js";
import type { TransportFactory } from "../src/core/Ros.js";
import type { RequiredSocketInterface } from "../src/core/SocketAdapter.js";

const { mockNativeWebSocketConstructor, mockPackageWebSocketConstructor } =
  vi.hoisted(() => {
    return {
      mockNativeWebSocketConstructor: vi.fn(),
      mockPackageWebSocketConstructor: vi.fn(),
    };
  });

vi.mock("ws", () => {
  return {
    WebSocket: MockWsWebSocketClass,
  };
});

class MockNativeWebSocketClass {
  constructor() {
    return mockNativeWebSocketConstructor();
  }
}

class MockWsWebSocketClass {
  constructor() {
    return mockPackageWebSocketConstructor();
  }
}

describe("Ros", function () {
  let mockSocket: RequiredSocketInterface;
  let mockTransportFactory: TransportFactory;

  beforeEach(() => {
    mockSocket = {
      onopen: vi.fn(),
      onclose: vi.fn(),
      onerror: vi.fn(),
      onmessage: vi.fn(),
      readyState: 1, // WebSocket.OPEN
      send: vi.fn(),
      close: vi.fn(),
    };

    mockNativeWebSocketConstructor.mockReturnValue(mockSocket);
    mockPackageWebSocketConstructor.mockReturnValue(mockSocket);

    mockTransportFactory = vi
      .fn<TransportFactory>()
      .mockResolvedValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("#createTransport", () => {
    it("creates a transport using a factory function", async () => {
      const mockTransportFactory = vi
        .fn<TransportFactory>()
        .mockResolvedValue(mockSocket);

      const ros = new ROSLIB.Ros({
        transportLibrary: mockTransportFactory,
      });

      await ros.connect("ws://localhost:9090");

      expect(mockTransportFactory).toHaveBeenCalledWith("ws://localhost:9090");
    });

    it("does not create a new transport if the socket is not closed", async () => {
      const ros = new ROSLIB.Ros({
        transportLibrary: mockTransportFactory,
      });

      // always creates a new transport the first time
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // socket is open, so no new transport is created
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(0);

      // For good measure, let's test the ready states individually.

      // @ts-expect-error -- normally readonly type being manipulated as a mock
      mockSocket.readyState = 0; // WebSocket.CONNECTING
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(0);

      // @ts-expect-error -- normally readonly type being manipulated as a mock
      mockSocket.readyState = 1; // WebSocket.OPEN
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(0);

      // @ts-expect-error -- normally readonly type being manipulated as a mock
      mockSocket.readyState = 2; // WebSocket.CLOSING
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(0);
    });

    it("creates a new transport if the socket is closed", async () => {
      const ros = new ROSLIB.Ros({
        transportLibrary: mockTransportFactory,
      });

      // always creates a new transport the first time
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // @ts-expect-error -- normally readonly type being manipulated as a mock
      mockSocket.readyState = 3; // WebSocket.CLOSED
      await ros.connect("ws://localhost:9090");
      expect(mockTransportFactory).toHaveBeenCalledTimes(1);
    });

    it("uses native WebSocket when available", async () => {
      vi.stubGlobal("WebSocket", MockNativeWebSocketClass);
      expect(typeof WebSocket).toBe("function");

      const ros = new ROSLIB.Ros({
        transportLibrary: "websocket",
      });

      await ros.connect("ws://localhost:9090");

      expect(mockNativeWebSocketConstructor).toHaveBeenCalledTimes(1);
      expect(mockPackageWebSocketConstructor).toHaveBeenCalledTimes(0);
    });

    it("uses ws package WebSocket when native WebSocket is not available", async () => {
      vi.stubGlobal("WebSocket", undefined);
      expect(typeof WebSocket).toBe("undefined");

      const ros = new ROSLIB.Ros({
        transportLibrary: "websocket",
      });

      await ros.connect("ws://localhost:9090");

      expect(mockNativeWebSocketConstructor).toHaveBeenCalledTimes(0);
      expect(mockPackageWebSocketConstructor).toHaveBeenCalledTimes(1);
    });
  });
});
