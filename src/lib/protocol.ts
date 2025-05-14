import { send } from "$lib/ws.svelte";
import { ByteObject, WritableByteObject } from "$lib/byteobject";
import * as rfc from "$lib/rfc";

import 'reflect-metadata';


const typeKey = Symbol("typeKey");

function Typed(type: string) {
    return Reflect.metadata(typeKey, type);
}

class Layer {
    @Typed("uint8")
    id: number = 0;

    name: string = "";
}


var request_id = 0;

function create(dirs: string[], obj: WritableByteObject, data?: any) {
    obj.wUint8(rfc.CREATE);
    return obj;
}

function read(dirs: string[], obj: WritableByteObject, data?: any) {
    obj.wUint8(rfc.READ);
    return obj;
}

function update(dirs: string[], obj: WritableByteObject, data?: any) {
    obj.wUint8(rfc.UPDATE);
    return obj;
}

function del(dirs: string[], obj: WritableByteObject, data?: any) {
    obj.wUint8(rfc.DELETE);
    return obj;
}

function command(dirs: string[], obj: WritableByteObject, data?: any) {
    obj.wUint8(rfc.COMMAND);

    if (dirs[2] === "meta") {
        obj.wUint16(rfc.CMD_META);

        let meta_items = dirs[3].split("+");
        let meta_opcode = 0;

        meta_items.forEach(item => {
            switch (item) {
                case "type_layers":
                    meta_opcode |= rfc.META_LIST_LAYERS_TYPE;
                    break;
                case "type_nodes":
                    meta_opcode |= rfc.META_LIST_NODES_TYPE;
                    break;
            }
        });

        obj.wUint8(meta_opcode);
    }

    return obj;
}

type Factory = {
    [id: string]: (dirs: string[], obj: WritableByteObject, data?: any) => WritableByteObject;
};

let factory: Factory = {
    "create": create,
    "read": read,
    "update": update,
    "delete": del,
    "del": del,
    "command": command,
    "cmd": command,
};

export const p_send: (p: string, d?: any) => Promise<ByteObject> = (path: string, data?: any) => {

    let obj = new WritableByteObject();

    let dirs = path.split("/").slice(1);

    switch (dirs[0]) {
        case "v0":
            obj.wUint64(BigInt(request_id));
            request_id ++;
            break;
    }

    obj = factory[dirs[1]](dirs, obj, data);

    return new Promise((resolve) => {
        obj.compile();
        send(obj, resolve);
    });
}

/*
p_send("/v0/read/project");

p_send("/v0/delete/project");

p_send("/v0/update/project");

p_send("/v0/create/project");
*/