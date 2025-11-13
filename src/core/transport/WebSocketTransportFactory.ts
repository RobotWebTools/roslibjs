import type { ITransport, ITransportFactory } from "./Transport.js";
import { NativeWebSocketTransport } from "./NativeWebSocketTransport.js";

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
  if (typeof WebSocket === "function") {
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    return new NativeWebSocketTransport(socket);
  }

  // If in Node.js, import ws to replace WebSocket API
  // Dynamically import the dependencies as they may not
  // be available in a browser environment.
  const ws = await import("ws");
  const { WsWebSocketTransport } = await import("./WsWebSocketTransport.js");
  const socket = new ws.WebSocket(url);
  socket.binaryType = "arraybuffer";
  return new WsWebSocketTransport(socket);
};
