/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 * @fileOverview
 */

import type { MessageEvent as NodeSocketMessageEvent, ErrorEvent as NodeSocketErrorEvent, CloseEvent as NodeSocketCloseEvent, Event as NodeSocketEvent } from 'ws';
import { decode } from 'cbor2';
import type Ros from './Ros.js';
import { isBridgeProtoOp } from '../types/ProtocolTypes.ts';
import { MessageCallback } from '../types/CallbackTypes.ts';
import { Nullable } from '../types/interface-types.ts';

export type SocketOpenEvent = Event | NodeSocketEvent;
export type SocketCloseEvent = CloseEvent | Event | NodeSocketCloseEvent;
export type SocketErrorEvent = RTCErrorEvent | Event | NodeSocketErrorEvent;
export type SocketMessageEvent = MessageEvent<unknown> | NodeSocketMessageEvent;

export interface ISocketAdapter {
  onopen: (event: SocketOpenEvent) => void;
  onclose: (event: SocketCloseEvent) => void;
  onerror: (event: SocketErrorEvent) => void;
  onmessage: (event: SocketMessageEvent) => void;
}

// This is very weird, but BSON is never bundled by us, so let's define a type for it.
let BSON: Nullable<{ deserialize(data: Uint8Array): unknown }> = null;
if (typeof bson !== 'undefined') {
  BSON = bson().BSON;
}

/**
 * FIXME: Need Answers:
 * 1. onopen emits 'connection' event with an object, the typedoc says it's a function, but no examples use it. What is this type?
 * 2. onclose emits 'close' event with an object, the typedoc says it's a function, but no examples use it. What is this type?
 * 3. onerror emits 'error' event with an object, the typedoc says it's a function, but every example uses it like a string. What is this type?
 */

/**
 * Event listeners for a WebSocket or TCP socket to a JavaScript
 * ROS Client. Sets up Messages for a given topic to trigger an
 * event on the ROS client.
 *
 * @namespace SocketAdapter
 * @private
 */
export default function SocketAdapter(client: Ros): ISocketAdapter {
  let decoder: Nullable<((raw: unknown, outputFunc: (message: object) => void) => void)> = null;
  // FIXME: Ros Client types not ready yet
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (client.transportOptions.decoder) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    decoder = client.transportOptions.decoder;
  }

  function handleMessage(message: unknown) {
    if (!isBridgeProtoOp(message)) {
      return;
    }

    if (message.op === 'publish') {
      client.emit(message.topic, message.msg);
    } else if (message.op === 'service_response') {
      client.emit(message.id, message);
    } else if (message.op === 'call_service') {
      client.emit(message.service, message);
    } else if (message.op === 'send_action_goal') {
      client.emit(message.action, message);
    } else if (message.op === 'cancel_action_goal') {
      client.emit(message.id, message);
    } else if (message.op === 'action_feedback') {
      client.emit(message.id, message);
    } else if (message.op === 'action_result') {
      client.emit(message.id, message);
    } else if (message.op === 'status') {
      if (message.id) {
        client.emit(`status:${message.id}`, message);
      } else {
        client.emit('status', message);
      }
    }
  }

  function handlePng(message: unknown, decodedCallback: MessageCallback<unknown>) {
    if (isBridgeProtoOp(message) && message.op === 'png') {
      // If in Node.js...
      if (typeof window === 'undefined') {
        void import('../util/decompressPng.js').then(({ default: decompressPng }) => {
          decompressPng(message.data, decodedCallback);
        });
      } else {
        // if in browser...
        void import('../util/shim/decompressPng.js').then(({ default: decompressPng }) => {
          decompressPng(message.data, decodedCallback);
        });
      }
    } else {
      decodedCallback(message);
    }
  }

  function decodeBSON(data: Blob, callback: MessageCallback<unknown>) {
    if (!BSON) {
      throw new Error('Cannot process BSON encoded message without BSON header.');
    }
    const reader = new FileReader();
    reader.onload = function (this: FileReader) {
      // @ts-expect-error -- this doesn't seem right, but don't want to break current type coercion assumption
      const uint8Array = new Uint8Array(this.result);
      const msg = BSON.deserialize(uint8Array);
      callback(msg);
    };
    reader.readAsArrayBuffer(data);
  }

  return {
    /**
     * Emit a 'connection' event on WebSocket connection.
     *
     * @param event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onopen: function onOpen(event: SocketOpenEvent) {
      client.isConnected = true;
      client.emit('connection', event);
    },

    /**
     * Emit a 'close' event on WebSocket disconnection.
     *
     * @param event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onclose: function onClose(event: SocketCloseEvent) {
      client.isConnected = false;
      client.emit('close', event);
    },

    /**
     * Emit an 'error' event whenever there was an error.
     *
     * @param event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onerror: function onError(event: SocketErrorEvent) {
      client.emit('error', event);
    },

    /**
     * Parse message responses from rosbridge and send to the appropriate
     * topic, service, or param.
     *
     * @param {Object} data - The raw JSON message from rosbridge.
     * @memberof SocketAdapter
     */
    onmessage: function onMessage(data: SocketMessageEvent) {
      if (decoder) {
        // FIXME: Ros Client types not ready yet
         
        decoder(data.data, handleMessage);
        return;
      }

      if (typeof Blob !== 'undefined' && data.data instanceof Blob) {
        decodeBSON(data.data, function (message) {
          handlePng(message, handleMessage);
        });
        return;
      }

      if (data.data instanceof ArrayBuffer || ArrayBuffer.isView(data.data)) {
        let binary: Uint8Array;
        if (data.data instanceof ArrayBuffer) {
          binary = new Uint8Array(data.data);
        } else {
          const view = data.data;
          binary = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        }
        const decoded = decode(binary);
        handleMessage(decoded);
        return;
      }

      if(typeof data.data !== 'string') {
        throw new Error('Expected incoming data to be a string at this branch');
      }

      const message: unknown = JSON.parse(data.data);
      handlePng(message, handleMessage);
    }
  };
}
