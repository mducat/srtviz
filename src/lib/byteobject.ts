
export class ByteObject {
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
        let value = this.data.getInt8(this.cursor);
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
        let value = this.data.getUint8(this.cursor);
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

    uint64() {
        let value = this.data.getBigUint64(this.cursor, this.endian);
        this.cursor += 8;

        return value;
    }

    str() {
        let len = this.uint32();

        let sliced = this.raw.slice(this.cursor, this.cursor + len);
        this.cursor += len;

        return ByteObject.decoder.decode(new Uint8Array(sliced));
    }
}


export class WritableByteObject extends ByteObject {
    buffer: any[];
    static encoder = new TextEncoder();

    constructor(byteLength: number = 0) {
        super(new ArrayBuffer(byteLength));
        this.buffer = [];
    }

    compile() {
        const size = this.buffer.reduce((sum, item) => sum + item.byteLength, 0);
        let compiled = new Uint8Array(size);
        let index = 0;

        this.buffer.forEach((item) => {
            let slice = new Uint8Array(item.buffer);

            compiled.set(slice, index);
            index += slice.byteLength;
        });

        this.raw = compiled.buffer;
        this.data = new DataView(this.raw);

        this.cursor = 0;
    }

    add(data: any) {
        this.buffer.push(data);
    }

    wInt8(n: number) {
        this.add(new Int8Array([n]));
    }

    wInt16(n: number) {
        this.add(new Int16Array([n]));
    }

    wInt32(n: number) {
        this.add(new Int32Array([n]));
    }

    wInt64(n: bigint) {
        this.add(new BigInt64Array([n]));
    }

    wUint8(n: number) {
        this.add(new Uint8Array([n]));
    }

    wUint16(n: number) {
        this.add(new Uint16Array([n]));
    }

    wUint32(n: number) {
        this.add(new Uint32Array([n]));
    }

    wUint64(n: bigint) {
        this.add(new BigUint64Array([n]));
    }

    wStr(s: string) {
        this.wUint32(s.length);
        this.add(WritableByteObject.encoder.encode(s));
    }
}

