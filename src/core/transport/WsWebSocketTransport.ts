import * as ws from "ws";
import type { RosbridgeMessage } from "../../types/protocol.ts";
import { AbstractTransport } from "./Transport.ts";

/**
 * Uses the `ws` package to send and receive messages.
 *
 * @see https://github.com/websockets/ws
 */
export class WsWebSocketTransport extends AbstractTransport {
  private socket: ws.WebSocket;

  constructor(socket: ws.WebSocket) {
    super();
    this.socket = socket;
    this.registerEventListeners();
  }

  public send(message: RosbridgeMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  public close(): void {
    this.socket.close();
  }

  public isConnecting(): boolean {
    return this.socket.readyState === ws.WebSocket.CONNECTING;
  }

  public isOpen(): boolean {
    return this.socket.readyState === ws.WebSocket.OPEN;
  }

  public isClosing(): boolean {
    return this.socket.readyState === ws.WebSocket.CLOSING;
  }

  public isClosed(): boolean {
    return this.socket.readyState === ws.WebSocket.CLOSED;
  }

  private registerEventListeners(): void {
    this.socket.onopen = (event: ws.Event) => {
      this.emit("open", event);
    };

    this.socket.onclose = (event: ws.CloseEvent) => {
      this.emit("close", event);
    };

    this.socket.onerror = (event: ws.ErrorEvent) => {
      this.emit("error", event);
    };

    this.socket.onmessage = (event: ws.MessageEvent) => {
      this.handleRawMessage(event.data);
    };
  }
}
