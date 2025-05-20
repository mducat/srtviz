import { send } from "$lib/ws.svelte";
import { ByteObject, WritableByteObject } from "$lib/byteobject";
import * as rfc from "$lib/rfc";




let request_id = 0;

type Instructions = {
    [id: string]: {
        magic: number,
        sub?: Instructions,
        multiple?: boolean,
        subSize?: string
    };
};

let objTypes: Instructions = {
    "project": { magic: rfc.INSTANCE_PROJECT },
    "layer":   { magic: rfc.INSTANCE_LAYER },
    "object":  { magic: rfc.INSTANCE_OBJECT }
};

let metaItems: Instructions = {
    "type_layers": { magic: rfc.META_LIST_LAYERS_TYPE },
    "type_nodes":  { magic: rfc.META_LIST_NODES_TYPE },
};

let commands: Instructions = {
    "meta":   { magic: rfc.CMD_META, sub: metaItems, multiple: true },
    "status": { magic: rfc.CMD_STATUS },
};

let instructions: Instructions = {
    "create":   { magic: rfc.CREATE,  sub: objTypes },
    "read":     { magic: rfc.READ,    sub: objTypes },
    "update":   { magic: rfc.UPDATE,  sub: objTypes },
    "delete":   { magic: rfc.DELETE,  sub: objTypes },
    "del":      { magic: rfc.DELETE,  sub: objTypes },
    "command":  { magic: rfc.COMMAND, sub: commands, subSize: "wUint16" },
    "cmd":      { magic: rfc.COMMAND, sub: commands, subSize: "wUint16" },
};

console.log(instructions);

// @todo delete this
function writer_v0(dirs: string[], obj: WritableByteObject, data?: any): WritableByteObject | null {
    let current: Instructions | null = instructions;
    let multiple = false;

    let defaultMagicSize = "wUint8";
    let size = defaultMagicSize;

    for (let i = 1; i < dirs.length; i++) {
        let toParse = dirs[i];
        let subItems: string[] = [];

        if (!current) {
            console.error("[protocol] Error formatting current element (no instructions)", toParse);
            return null;
        }

        if (multiple) {
            subItems = toParse.split('+');
        } else {
            subItems = [toParse];
        }

        let magic = 0;
        let item: any = current[subItems[0]];

        subItems.forEach(el => {
            if (!current || !current[el]) {
                console.error("[protocol] Error formatting current element", el);
                return null;
            }

            item = current[el];

            magic |= item.magic;
        });

        obj.dyn(size, magic);

        if (item?.subSize) {
            size = item.subSize;
        } else {
            size = defaultMagicSize;
        }

        current = item?.sub;
        multiple = item?.multiple;
    }

    // data => leave access to byteobject

    return obj;
}

export const p_send: (p: string, d?: any) => Promise<ByteObject> | null = (path: string, data?: any) => {

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

    return new Promise((resolve) => {
        obj.compile();
        send(obj, resolve, {path: path, data: data});
    });
}
