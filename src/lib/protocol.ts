import {connect, registerCb, send, wsSend} from "$lib/ws.svelte";
import { ByteObject, WritableByteObject } from "$lib/byteobject";



let request_id = 1;

let tokens: any = {};

export function defineRegistry(tok: any) {
    console.log("[ws] DefineRegistry");
    tokens = tok;
}

export function getRegistry() {
    return tokens;
}

function writer_v0(dirs: string[], obj: WritableByteObject, data?: any): WritableByteObject | null {
    let tokens = getRegistry();

    for (let i = 1; i < dirs.length; i++) {
        let el = dirs[i];

        if (!tokens[el]) {
            console.error("Undefined token ", el);
            return null;
        }

        obj.wUint16(tokens[el]);
    }

    return obj;
}

type PendingRequest = {
    path: string,
    data?: any,
    cb: (req: ByteObject) => void,
}

let pendingRequests: PendingRequest[] = [];

export function flushRequests() {
    pendingRequests.forEach(r => {
        let obj = parse(r.path, r.data);
        if (!obj) return null;

        obj.compile();
        registerCb(obj, r.cb, {path: r.path, data: r.data});
        wsSend(obj);
    });
}


function parse(path: string, data?: any) {
    let obj = new WritableByteObject();

    let dirs = path.split("/").slice(1);

    switch (dirs[0]) {
        case "v0":
            obj.wUint64(BigInt(request_id));

            let ret = writer_v0(dirs, obj, data);
            if (!ret) return null;
            obj = ret;
            request_id ++;
            break;
        default:
            console.error("[protocol] Error formatting the following route:", path);
            return null;
    }

    return obj;
}


export const p_send: (p: string, d?: any) => Promise<ByteObject> | null = (path: string, data?: any) => {
    if (!Object.keys(tokens).length) {
        connect();

        return new Promise(resolve => {
            pendingRequests.push({path: path, data: data, cb: resolve});
        })
    }

    let obj = parse(path, data);
    if (!obj) return null;

    return new Promise((resolve) => {
        obj.compile();
        send(obj, resolve, {path: path, data: data});
    });
}
