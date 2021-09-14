const result = typeof window !== 'undefined' ? window.WebSocket : WebSocket;
export default result;
