/**
 * Binary data structures for iRacing SDK
 */

export class IRSDKStruct {
  protected _sharedMem: Buffer;
  protected _offset: number;

  constructor(sharedMem: Buffer, offset: number = 0) {
    this._sharedMem = sharedMem;
    this._offset = offset;
  }

  protected getValue(offset: number, type: string): any {
    const absoluteOffset = this._offset + offset;

    switch (type) {
      case 'i': // int32
        return this._sharedMem.readInt32LE(absoluteOffset);
      case 'I': // uint32
        return this._sharedMem.readUInt32LE(absoluteOffset);
      case 'f': // float
        return this._sharedMem.readFloatLE(absoluteOffset);
      case 'd': // double
        return this._sharedMem.readDoubleLE(absoluteOffset);
      case '?': // bool
        return this._sharedMem.readUInt8(absoluteOffset) !== 0;
      case 'c': // char
        return this._sharedMem.readUInt8(absoluteOffset);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  protected getStringValue(offset: number, maxLength: number): string {
    const absoluteOffset = this._offset + offset;
    const buffer = this._sharedMem.slice(absoluteOffset, absoluteOffset + maxLength);
    const nullIndex = buffer.indexOf(0);
    const actualBuffer = nullIndex === -1 ? buffer : buffer.slice(0, nullIndex);
    return actualBuffer.toString('latin1');
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
  private _frozenMemory: Buffer | null = null;

  constructor(sharedMem: Buffer, offset: number, bufLen: number) {
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
    this._frozenMemory = this._sharedMem.slice(this._bufOffset, this._bufOffset + this._bufLen);
    this._isFrozen = true;
  }

  unfreeze(): void {
    this._frozenMemory = null;
    this._isFrozen = false;
  }

  getMemory(): Buffer {
    return this._isFrozen && this._frozenMemory ? this._frozenMemory : this._sharedMem;
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
    return (hi * 0x100000000) + (lo >>> 0);
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

