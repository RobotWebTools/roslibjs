export default thro
export const Server = thro
export const Namespace = thro
export const Socket = thro

function thro() {
    throw new Error('transportLibrary "socket.io" is not supported in browsers. Set the `transportLibrary` option to "socket.io" only if you are use roslib in an environment like Node.js or Electron.')
}