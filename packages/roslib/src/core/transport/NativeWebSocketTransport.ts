import type { RosbridgeMessage } from "../../types/protocol.ts";
import { AbstractTransport } from "./Transport.ts";

/**
 * Uses the native `WebSocket` class to send and receive messages.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 */
export class NativeWebSocketTransport extends AbstractTransport {
  private socket: WebSocket;

  constructor(socket: WebSocket) {
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
    return this.socket.readyState === WebSocket.CONNECTING;
  }

  public isOpen(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  public isClosing(): boolean {
    return this.socket.readyState === WebSocket.CLOSING;
  }

  public isClosed(): boolean {
    return this.socket.readyState === WebSocket.CLOSED;
  }

  private registerEventListeners(): void {
    this.socket.onopen = (event: Event) => {
      this.emit("open", event);
    };

    this.socket.onclose = (event: CloseEvent) => {
      this.emit("close", event);
    };

    this.socket.onerror = (event: Event) => {
      this.emit("error", event);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.handleRawMessage(event.data);
    };
  }
}
