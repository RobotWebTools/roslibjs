// This file serves as the source for socket.io when in Node.js. Otherwise
// ./shim/socket.io.js handles the import when in a browser.

import * as io from 'socket.io';

// Emulate the default export that CommonJS users have, which is missing for ESM
// users (see https://github.com/socketio/socket.io/pull/4100)
export default (srv, opts) => new io.Server(srv, opts);

export const Server = io.Server;
export const Namespace = io.Namespace;
export const Socket = io.Socket;