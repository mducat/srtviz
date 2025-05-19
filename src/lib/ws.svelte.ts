import {ByteObject} from "$lib/byteobject";
import * as rfc from "./rfc";

type RequestsBuffer = {
    [id: number]: (req: ByteObject) => void;
}

type DebugBuffer = {
    [id: string]: any
}

type State = {
    debug: DebugBuffer;
    requests: RequestsBuffer;
    connected: boolean;
};

export const state : State = $state({
    requests: {},
    debug: {},
    connected: false,
});


let ws : WebSocket;
let connecting : boolean = false;

function onMessage(event: any) {
    let data = new ByteObject(event.data);

    let request_id = Number(data.uint64());

    let status = data.uint8();
    if (status != rfc.STATUS_OK) {
        console.error("[ws] Error received from server with request ID", request_id);
        console.error(`[ws] Debug inf:`, $state.snapshot(state.debug[request_id]));

        switch (status) {
            case rfc.STATUS_INTERNAL_ERROR:
                console.error("[ws] Internal Error", status);
                break;
            case rfc.STATUS_INTERNAL_PANIC:
                console.error("[ws] Internal Panic", status);
                break;
            default: console.error("[ws] Unrecognized status", status);
        }

        return;
    }

    // data.cursor -= 1;

    state.requests[request_id](data);
    delete state.requests[request_id];
    delete state.debug[request_id];
}

let pendingRequests: ByteObject[] = [];

export const connect = () => {
    if (connecting) { return null; }

    connecting = true;

    ws = new WebSocket(`ws://${window.location.hostname}:16180`);
    ws.binaryType = "arraybuffer";

    return new Promise((resolve) => {
        ws.onopen = function (e) {
            console.log("[ws] Connection established");

            pendingRequests.forEach(request => {
                ws.send(request.raw);
            });

            state.connected = true;
            resolve(state.connected);
        }

        ws.addEventListener("message", onMessage);
    });
};


// list available layers type + object types
// const array = new Uint16Array([0x05 | (0x1 << 2 << 8), (0x1 | 0x2)]);

/*
    let status = data.uint8();
    console.log(`[message] Received data from server: ${data.raw.byteLength}, ${status}`);

    let layers_type = data.uint32();

    for (let i = 0; i < layers_type; i++) {
        console.log(data.int8());
        console.log(data.str());
    }

    let nodes_type = data.uint64();

    for (let i = 0; i < nodes_type; i++) {
        console.log(data.uint32());
        console.log(data.str());
    }
 */



export const send = (req: ByteObject, cb: (r: ByteObject) => void, debug: any) => {
    let request_id = Number(req.uint64());

    state.requests[request_id] = cb;
    state.debug[request_id] = debug;

    if (!state.connected) {
        pendingRequests.push(req);

        connect();
    } else {
        ws.send(req.raw);
    }
}

