/* eslint-disable @typescript-eslint/unbound-method */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ITransport,
  ITransportFactory,
  TransportEvent,
} from "../src/core/transport/Transport.ts";
import { WebSocketTransportFactory } from "../src/core/transport/WebSocketTransportFactory.ts";
import Ros from "../src/core/Ros.ts";
import type { RosbridgeMessage } from "../src/types/protocol.ts";

describe("Ros", function () {
  let mockRosUrl: string;
  let mockTransport: ITransport;
  let mockTransportFactory: ITransportFactory;

  let mockTransportListeners: {
    open: ((event: TransportEvent) => void)[];
    close: ((event: TransportEvent) => void)[];
    error: ((event: TransportEvent) => void)[];
    message: ((event: RosbridgeMessage) => void)[];
  };

  const publishMockTransportEvent = (event: string, value: unknown) => {
    switch (event) {
      case "open":
        mockTransport.isConnecting = vi.fn().mockReturnValue(false);
        mockTransport.isOpen = vi.fn().mockReturnValue(true);
        mockTransport.isClosing = vi.fn().mockReturnValue(false);
        mockTransport.isClosed = vi.fn().mockReturnValue(false);

        mockTransportListeners.open.forEach((listener) => {
          listener(value);
        });
        break;
      case "close":
        mockTransport.isConnecting = vi.fn().mockReturnValue(false);
        mockTransport.isOpen = vi.fn().mockReturnValue(false);
        mockTransport.isClosing = vi.fn().mockReturnValue(false);
        mockTransport.isClosed = vi.fn().mockReturnValue(true);

        mockTransportListeners.close.forEach((listener) => {
          listener(value);
        });
        break;
      case "error":
        mockTransportListeners.error.forEach((listener) => {
          listener(value);
        });
        break;
      case "message":
        mockTransportListeners.message.forEach((listener) => {
          listener(value as RosbridgeMessage);
        });
        break;
    }
  };

  beforeEach(() => {
    mockRosUrl = "ws://localhost:9090";

    mockTransportListeners = {
      open: new Array<(event: TransportEvent) => void>(),
      close: new Array<(event: TransportEvent) => void>(),
      error: new Array<(event: TransportEvent) => void>(),
      message: new Array<(event: RosbridgeMessage) => void>(),
    };

    mockTransport = {
      on: vi
        .fn()
        .mockImplementation(
          (event: string, listener: (event: TransportEvent) => void) => {
            switch (event) {
              case "open":
                mockTransportListeners.open.push(listener);
                break;
              case "close":
                mockTransportListeners.close.push(listener);
                break;
              case "error":
                mockTransportListeners.error.push(listener);
                break;
              case "message":
                mockTransportListeners.message.push(listener);
                break;
            }
          },
        ),
      send: vi.fn(),
      close: vi.fn().mockImplementation(() => {
        publishMockTransportEvent("close", new Event("close"));
      }),
      isConnecting: vi.fn(),
      isOpen: vi.fn(),
      isClosing: vi.fn(),
      isClosed: vi.fn(),
    };

    mockTransportFactory = vi.fn().mockReturnValue(mockTransport);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("connect", () => {
    it("defaults to WebSocketTransportFactory", () => {
      const ros = new Ros();

      // @ts-expect-error -- spying on private property
      expect(ros.transportFactory).toBe(WebSocketTransportFactory);
    });

    it("creates a transport using a factory function", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      await ros.connect(mockRosUrl);

      expect(mockTransportFactory).toHaveBeenCalledWith(mockRosUrl);
    });

    it("does not create a new transport if the socket is not closed", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      // always creates a new transport the first time
      await ros.connect(mockRosUrl);
      expect(mockTransportFactory).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // socket is not closed so no new transport is created
      await ros.connect(mockRosUrl);
      expect(mockTransportFactory).toHaveBeenCalledTimes(0);
    });

    it("creates a new transport if the socket is closed", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      // always creates a new transport the first time
      await ros.connect(mockRosUrl);
      expect(mockTransportFactory).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      mockTransport.close();

      // socket is closed so a new transport is created
      await ros.connect(mockRosUrl);
      expect(mockTransportFactory).toHaveBeenCalledTimes(1);
    });
  });

  describe("isConnected", () => {
    it("returns false when not connected", () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      expect(ros.isConnected).toBe(false);
    });

    it("returns true when connected", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      await ros.connect(mockRosUrl);
      publishMockTransportEvent("open", new Event("open"));

      expect(ros.isConnected).toBe(true);
    });

    it("returns false when disconnected", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      await ros.connect(mockRosUrl);

      mockTransport.close();

      expect(ros.isConnected).toBe(false);
    });
  });

  describe("close", () => {
    it("closes the transport if it is not closed", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      await ros.connect(mockRosUrl);
      publishMockTransportEvent("open", new Event("open"));

      ros.close();

      expect(mockTransport.close).toHaveBeenCalled();
      expect(ros.isConnected).toBe(false);
    });

    it("does not close the transport if it is already closed", () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      ros.close();

      expect(mockTransport.close).not.toHaveBeenCalled();
      expect(ros.isConnected).toBe(false);
    });
  });

  describe("callOnConnection", () => {
    it("sends the message immediately if connected", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      await ros.connect(mockRosUrl);
      publishMockTransportEvent("open", new Event("open"));

      const rosOnceSpy = vi.spyOn(ros, "once");
      ros.callOnConnection({ op: "set_level", level: "info" });

      expect(rosOnceSpy).not.toHaveBeenCalled();
      expect(mockTransport.send).toHaveBeenCalledWith({
        op: "set_level",
        level: "info",
      });
    });

    it("queues the message to send once connected", async () => {
      const ros = new Ros({
        transportFactory: mockTransportFactory,
      });

      // When disconnected, the message is queued to send
      const rosOnceSpy = vi.spyOn(ros, "once");
      ros.callOnConnection({ op: "set_level", level: "info" });

      expect(rosOnceSpy).toHaveBeenCalledWith(
        "connection",
        expect.any(Function),
      );
      expect(mockTransport.send).not.toHaveBeenCalled();

      // Once connected, the message is sent
      await ros.connect(mockRosUrl);
      publishMockTransportEvent("open", new Event("open"));

      expect(mockTransport.send).toHaveBeenCalledWith({
        op: "set_level",
        level: "info",
      });
    });
  });
});
