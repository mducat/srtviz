import {ByteObject} from "$lib/byteobject";

type RequestsBuffer = {
    [id: number]: (req: ByteObject) => void;
}

type State = {
    requests: RequestsBuffer;
    connected: boolean;
};

export const state : State = $state({
    requests: {},
    connected: false,
});


let ws : WebSocket;

export const connect = () => {
    ws = new WebSocket(`ws://${window.location.hostname}:16180`);
    ws.binaryType = "arraybuffer";

    let promise = new Promise((resolve) => {
        ws.onopen = function(e) {
            console.log("[open] Connection established");

            state.connected = true;
            resolve(state.connected);
        }

        ws.addEventListener("message", (event: any) => {
            let data = new ByteObject(event.data);

            let request_id = Number(data.uint64());

            state.requests[request_id](data);
            delete state.requests[request_id];
        });
    });

    return promise;
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


export const send = (req: ByteObject, cb: (r: ByteObject) => void) => {
    if (!state.connected) {
        // @TODO: fix this shit

        connect().then(() => {
            let request_id = Number(req.uint64());
            state.requests[request_id] = cb;

            ws.send(req.raw);
        });

    } else {

        let request_id = Number(req.uint64());
        state.requests[request_id] = cb;

        ws.send(req.raw);
    }
}

