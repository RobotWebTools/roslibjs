import type { ITransport, ITransportFactory } from "./Transport.ts";

/**
 * Detect if we're running in a jsdom environment.
 * jsdom provides WebSocket but has cross-realm issues with Event objects.
 */
function isJsdomEnvironment(): boolean {
  // Check for navigator.userAgent containing "jsdom" or window.name === "nodejs"
  // which are common indicators of jsdom
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return navigator.userAgent.includes("jsdom");
  }
  // Check for window.name which jsdom sets to "nodejs"
  if (typeof window !== "undefined" && window.name === "nodejs") {
    return true;
  }
  return false;
}

/**
 * A transport factory that uses WebSockets to send and receive messages.
 * Will use the native `WebSocket` class if available, otherwise falls back
 * to the `ws` package.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * @see https://github.com/websockets/ws
 */
export const WebSocketTransportFactory: ITransportFactory = async (
  url: string,
): Promise<ITransport> => {
  // Browsers, Deno, Bun, and Node 22+ support WebSockets natively
  // However, jsdom has cross-realm issues with WebSocket events, so we
  // need to use the ws package in jsdom environments
  if (typeof WebSocket === "function" && !isJsdomEnvironment()) {
    const transportModule = await import("./NativeWebSocketTransport.ts");
    const { NativeWebSocketTransport } = transportModule;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    return new NativeWebSocketTransport(socket);
  }

  // If in Node.js, import ws to replace WebSocket API
  // Dynamically import the dependencies as they may not
  // be available in a browser environment.
  const ws = await import("ws");
  const transportModule = await import("./WsWebSocketTransport.ts");
  const { WsWebSocketTransport } = transportModule;
  const socket = new ws.WebSocket(url);
  socket.binaryType = "arraybuffer";
  return new WsWebSocketTransport(socket);
};
