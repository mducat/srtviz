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

function writer_v0(dirs: string[], obj: WritableByteObject, formatter?: ParamsFormatter): WritableByteObject | null {
    let tokens = getRegistry();

    for (let i = 1; i < dirs.length; i++) {
        let el = dirs[i];

        if (!tokens[el]) {
            console.error("Undefined token ", el);
            console.error(JSON.stringify(tokens));
            return null;
        }

        obj.wUint16(tokens[el]);
    }

    if (formatter) {
        formatter(obj);
    }

    return obj;
}

type ParamsFormatter = ((r: WritableByteObject) => void);

type PendingRequest = {
    path: string,
    formatter?: ParamsFormatter,
    cb: (req: ByteObject) => void,
}

let pendingRequests: PendingRequest[] = [];

export function flushRequests() {
    pendingRequests.forEach(r => {
        let obj = parse(r.path, r.formatter);
        if (!obj) return null;

        obj.compile();
        registerCb(obj, r.cb, {path: r.path});
        wsSend(obj);
    });
}


function parse(path: string, formatter?: ParamsFormatter) {
    let obj = new WritableByteObject();

    let dirs = path.split("/").slice(1);

    switch (dirs[0]) {
        case "v0":
            obj.wUint64(BigInt(request_id));

            let ret = writer_v0(dirs, obj, formatter);
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


export const p_send: (p: string, f?: ParamsFormatter) => Promise<ByteObject> | null = (path: string, formatter?: ParamsFormatter) => {
    if (!Object.keys(tokens).length) {
        connect();

        return new Promise(resolve => {
            pendingRequests.push({path: path, formatter: formatter, cb: resolve});
        })
    }

    let obj = parse(path, formatter);
    if (!obj) return null;

    return new Promise((resolve) => {
        obj.compile();
        send(obj, resolve, {path: path});
    });
}
