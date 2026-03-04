/**
 * Helper functions to read binary values from a plain number[] array.
 * These replace Node.js Buffer methods (readInt32LE, readFloatLE, etc.)
 * so the codebase works with plain JavaScript arrays from koffi.decode().
 */

function readUInt8(data: number[], offset: number): number {
  return data[offset] & 0xff;
}

function readInt32LE(data: number[], offset: number): number {
  const val =
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24);
  return val; // already signed due to << 24
}

function readUInt32LE(data: number[], offset: number): number {
  return (
    (data[offset] +
      data[offset + 1] * 0x100 +
      data[offset + 2] * 0x10000 +
      data[offset + 3] * 0x1000000) >>>
    0
  );
}

function readFloatLE(data: number[], offset: number): number {
  const bytes = new Uint8Array([
    data[offset],
    data[offset + 1],
    data[offset + 2],
    data[offset + 3],
  ]);
  return new DataView(bytes.buffer).getFloat32(0, true);
}

function readDoubleLE(data: number[], offset: number): number {
  const bytes = new Uint8Array([
    data[offset],
    data[offset + 1],
    data[offset + 2],
    data[offset + 3],
    data[offset + 4],
    data[offset + 5],
    data[offset + 6],
    data[offset + 7],
  ]);
  return new DataView(bytes.buffer).getFloat64(0, true);
}

export class IRSDKStruct {
  protected _sharedMem: number[];
  protected _offset: number;

  constructor(sharedMem: number[], offset: number = 0) {
    this._sharedMem = sharedMem;
    this._offset = offset;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Binary data can be various primitive types
  protected getValue(offset: number, type: string): any {
    const absoluteOffset = this._offset + offset;

    switch (type) {
      case 'i': // int32
        return readInt32LE(this._sharedMem, absoluteOffset);
      case 'I': // uint32
        return readUInt32LE(this._sharedMem, absoluteOffset);
      case 'f': // float
        return readFloatLE(this._sharedMem, absoluteOffset);
      case 'd': // double
        return readDoubleLE(this._sharedMem, absoluteOffset);
      case '?': // bool
        return readUInt8(this._sharedMem, absoluteOffset) !== 0;
      case 'c': // char
        return readUInt8(this._sharedMem, absoluteOffset);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  protected getStringValue(offset: number, maxLength: number): string {
    const absoluteOffset = this._offset + offset;
    const chars: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      const byte = this._sharedMem[absoluteOffset + i];
      if (byte === 0) break;
      chars.push(byte);
    }
    // Decode as latin1 (each byte maps directly to its char code)
    return String.fromCharCode(...chars);
  }
}

export class Header extends IRSDKStruct {
  get version(): number {
    return this.getValue(0, 'i');
  }

  get status(): number {
    return this.getValue(4, 'i');
  }

  get tickRate(): number {
    return this.getValue(8, 'i');
  }

  get sessionInfoUpdate(): number {
    return this.getValue(12, 'i');
  }

  get sessionInfoLen(): number {
    return this.getValue(16, 'i');
  }

  get sessionInfoOffset(): number {
    return this.getValue(20, 'i');
  }

  get numVars(): number {
    return this.getValue(24, 'i');
  }

  get varHeaderOffset(): number {
    return this.getValue(28, 'i');
  }

  get numBuf(): number {
    return this.getValue(32, 'i');
  }

  get bufLen(): number {
    return this.getValue(36, 'i');
  }

  get varBuf(): VarBuffer[] {
    const buffers: VarBuffer[] = [];
    for (let i = 0; i < this.numBuf; i++) {
      buffers.push(new VarBuffer(this._sharedMem, 48 + i * 16, this.bufLen));
    }
    return buffers;
  }
}

export class VarBuffer extends IRSDKStruct {
  private _bufLen: number;
  private _isFrozen: boolean = false;
  private _frozenMemory: number[] | null = null;

  constructor(sharedMem: number[], offset: number, bufLen: number) {
    super(sharedMem, offset);
    this._bufLen = bufLen;
  }

  get tickCount(): number {
    return this.getValue(0, 'i');
  }

  get _bufOffset(): number {
    return this.getValue(4, 'i');
  }

  get bufOffset(): number {
    return this._isFrozen ? 0 : this._bufOffset;
  }

  get isMemoryFrozen(): boolean {
    return this._isFrozen;
  }

  freeze(): void {
    this._frozenMemory = this._sharedMem.slice(
      this._bufOffset,
      this._bufOffset + this._bufLen,
    );
    this._isFrozen = true;
  }

  unfreeze(): void {
    this._frozenMemory = null;
    this._isFrozen = false;
  }

  getMemory(): number[] {
    return this._isFrozen && this._frozenMemory
      ? this._frozenMemory
      : this._sharedMem;
  }
}

export class VarHeader extends IRSDKStruct {
  get type(): number {
    return this.getValue(0, 'i');
  }

  get offset(): number {
    return this.getValue(4, 'i');
  }

  get count(): number {
    return this.getValue(8, 'i');
  }

  get countAsTime(): boolean {
    return this.getValue(12, '?');
  }

  get name(): string {
    return this.getStringValue(16, 32);
  }

  get desc(): string {
    return this.getStringValue(48, 64);
  }

  get unit(): string {
    return this.getStringValue(112, 32);
  }
}

export class DiskSubHeader extends IRSDKStruct {
  get sessionStartDate(): number {
    const lo = this.getValue(0, 'i');
    const hi = this.getValue(4, 'i');
    return hi * 0x100000000 + (lo >>> 0);
  }

  get sessionStartTime(): number {
    return this.getValue(8, 'd');
  }

  get sessionEndTime(): number {
    return this.getValue(16, 'd');
  }

  get sessionLapCount(): number {
    return this.getValue(24, 'i');
  }

  get sessionRecordCount(): number {
    return this.getValue(28, 'i');
  }
}
