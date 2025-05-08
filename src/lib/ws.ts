

let socket = new WebSocket("ws://localhost:16180");
let buffer: any[] = [];

socket.binaryType = "arraybuffer";

socket.onopen = function(e) {
    console.log("[open] Connection established");

    // list available layers type + object types
    const array = new Uint16Array([0x05 | (0x1 << 2 << 8), (0x1 | 0x2)]);

    socket.send(array);

    console.log("Sending to server" + array.toString());
};

class ByteObject {
    data: DataView;
    raw: ArrayBuffer;
    cursor: number;

    endian: boolean = true;
    static decoder = new TextDecoder();

    constructor(public value: ArrayBuffer) {
        this.raw = value;
        this.data = new DataView(value);

        this.cursor = 0;
    }

    int8() {
        let value = this.data.getInt16(this.cursor, this.endian);
        this.cursor += 1;

        return value;
    }

    int16() {
        let value = this.data.getInt16(this.cursor, this.endian);
        this.cursor += 2;

        return value;
    }

    int32() {
        let value = this.data.getInt32(this.cursor, this.endian);
        this.cursor += 4;

        return value;
    }

    uint8() {
        let value = this.data.getUint16(this.cursor, this.endian);
        this.cursor += 1;

        return value;
    }

    uint16() {
        let value = this.data.getUint16(this.cursor, this.endian);
        this.cursor += 2;

        return value;
    }

    uint32() {
        let value = this.data.getUint32(this.cursor, this.endian);
        this.cursor += 4;

        return value;
    }

    str() {
        let len = this.uint32();

        let sliced = this.raw.slice(this.cursor, this.cursor + len);
        this.cursor += len;

        return ByteObject.decoder.decode(new Uint8Array(sliced));
    }
}

socket.onmessage = function(event) {
    console.log(`[message] Data received from server: ${event.data}`);

    // let data = new ByteObject(event.data);

    // console.log(data.str());

    let view = new DataView(event.data);

    console.log(view.getUint16(0, true));
    // console.log(view.getUint8(2, true));

    buffer.push(event.data);
    // @ts-ignore
    console.log("Received from server" + buffer.toString());
};

// @ts-ignore
document.socket = socket;