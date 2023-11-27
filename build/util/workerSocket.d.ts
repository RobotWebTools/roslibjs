export = WorkerSocket;
declare class WorkerSocket {
    constructor(uri: any);
    onclose: any;
    onerror: any;
    onopen: any;
    onmessage: any;
    socket_: any;
    handleWorkerMessage_(ev: any): void;
    send(data: any): void;
    close(): void;
}
