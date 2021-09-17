// This file is a shim for the browser build, otherwise ../socket.io.js
// provides the import when in Node.js.

let io = globalThis.io;

export default io;
export const Server = io?.Server;
export const Namespace = io?.Namespace;
export const Socket = io?.Socket;