import {ByteObject, WritableByteObject} from "$lib/byteobject";
import * as rfc from "./rfc";
import { toast } from 'svoast';
import {defineRegistry, flushRequests} from "$lib/protocol";
import {getCookie, setCookie} from "typescript-cookie";

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

const registryKey = 'matrixui-registry-tokens';

function connected() {
    pendingRequests.forEach(request => {
        // might be useless, left as an exercise for the reader
        ws.send(request.raw);
    });

    flushRequests();

    state.connected = true;
}

function queryRegistry() {
    console.debug("[ws] Querying registry");

    let query = new WritableByteObject();
    query.wUint64(BigInt(0));
    query.wUint16(0);

    query.compile();

    wsSend(query);
}


const flip = (data: Object) => Object.fromEntries(
    Object
        .entries(data)
        .map(([key, value]) => [value, key])
);

function onMessage(event: any) {
    let data = new ByteObject(event.data);

    let request_id = Number(data.uint64());

    let status = data.uint8();
    if (status != rfc.STATUS_OK) {
        console.error("[ws] Error received from server with request ID", request_id);
        console.error(`[ws] Debug inf:`, $state.snapshot(state.debug[request_id]));

        let msg;

        switch (status) {
            case rfc.STATUS_INTERNAL_ERROR:
                msg = "Internal Error";
                break;
            case rfc.STATUS_INTERNAL_PANIC:
                msg = "Internal Panic"
                break;
            default: msg = "Unrecognized error status"
        }

        console.error('[ws]', msg, status);
        toast.error(msg);

        delete state.requests[request_id];
        delete state.debug[request_id];

        return;
    }

    if (request_id === 0) {
        let registry: any = data.map("uint16", "str");

        registry = flip(registry);

        console.log("[ws] Registry received from server with request ID", request_id, data.data.byteLength);

        // setCookie(registryKey, registry);
        defineRegistry(registry);

        connected();

        return;
    }

    state.requests[request_id](data);
    delete state.requests[request_id];
    delete state.debug[request_id];
}

let pendingRequests: ByteObject[] = [];

export const connect = () => {
    if (connecting) { return null; }
    console.debug("[ws] Connecting...");

    connecting = true;

    ws = new WebSocket(`ws://${window.location.hostname}:16180`);
    ws.binaryType = "arraybuffer";

    return new Promise((resolve) => {
        ws.onopen = function (e) {
            console.log("[ws] Connection established");

            resolve(state.connected);
            let registry = getCookie(registryKey);

            if (registry) {
                defineRegistry(registry);
                connected();
            } else {
                queryRegistry();
            }
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

export const registerCb = (req: ByteObject, cb: (r: ByteObject) => void, debug: any) => {
    req.cursor = 0;
    let request_id = Number(req.uint64());

    state.requests[request_id] = cb;
    state.debug[request_id] = debug;
}

export const wsSend = (req: ByteObject) => {
    ws.send(req.raw);
}

export const send = (req: ByteObject, cb: (r: ByteObject) => void, debug: any) => {
    registerCb(req, cb, debug);

    if (!state.connected) {
        pendingRequests.push(req);

        connect();
    } else {
        wsSend(req);
    }
}

