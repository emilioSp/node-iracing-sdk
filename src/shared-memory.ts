import { getTypeSize } from './utils.ts';
import { VAR_TYPE_MAP } from './vars.ts';

type VarBuffer = {
  tickCount: number;
  bufOffset: number;
};

type Vars = {
  type: number;
  typeChar: string;
  typeSize: number;
  offset: number;
  count: number;
  countAsTime: boolean;
  name: string;
  desc: string;
  unit: string;
};

export class SharedMemory {
  readonly version: number;
  readonly status: number;
  readonly tickRate: number;
  readonly sessionInfoUpdate: number;
  readonly sessionInfoLen: number;
  readonly sessionInfoOffset: number;
  readonly numVars: number;
  readonly varHeaderOffset: number;
  readonly bufLen: number;
  readonly numBuf: number;

  private data: number[];
  private varHeadersMap: Map<string, Vars>;

  constructor(data: number[]) {
    this.data = data;
    const view = new DataView(new Uint8Array(data.slice(0, 48)).buffer);
    this.version = view.getInt32(0, true);
    this.status = view.getInt32(4, true);
    this.tickRate = view.getInt32(8, true);
    this.sessionInfoUpdate = view.getInt32(12, true);
    this.sessionInfoLen = view.getInt32(16, true);
    this.sessionInfoOffset = view.getInt32(20, true);
    this.numVars = view.getInt32(24, true);
    this.varHeaderOffset = view.getInt32(28, true);
    this.numBuf = view.getInt32(32, true);
    this.bufLen = view.getInt32(36, true);

    this.varHeadersMap = new Map();

    for (let i = 0; i < this.numVars; i++) {
      const varHeader = this.readVarHeader(this.varHeaderOffset + i * 144);
      this.varHeadersMap.set(varHeader.name, varHeader);
    }
  }

  getVarHeaders(): Map<string, Vars> {
    return this.varHeadersMap;
  }

  getVarHeadersList(): string[] {
    return Array.from(this.varHeadersMap.keys());
  }

  getVarBuffer(): VarBuffer {
    const buffers: VarBuffer[] = [];
    for (let i = 0; i < this.numBuf; i++) {
      const bufOffset = 48 + i * 16;
      const view = new DataView(
        new Uint8Array(this.data.slice(bufOffset, bufOffset + 8)).buffer,
      );
      buffers.push({
        tickCount: view.getInt32(0, true),
        bufOffset: view.getInt32(4, true),
      });
    }
    const sorted = buffers.sort((a, b) => b.tickCount - a.tickCount);
    return sorted.length > 1 ? sorted[1] : sorted[0];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  readVar(key: string): Array<any> {
    const varHeader = this.getVarHeaders().get(key);
    if (!varHeader) {
      throw new Error(`Key ${key} not found in var headers`);
    }

    const varBuffer = this.getVarBuffer();

    // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
    const result: any[] = [];
    for (let i = 0; i < varHeader.count; i++) {
      result.push(
        this.unpackValue(
          varBuffer.bufOffset + varHeader.offset + i * varHeader.typeSize,
          varHeader.typeChar,
        ),
      );
    }
    return result;
  }

  /**
   * Read a var at a specific record index (for IBT file access).
   * Returns the unpacked value(s) for the given var at the given record.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  readVarAtIndex(key: string, index: number): Array<any> {
    const varHeader = this.getVarHeaders().get(key);
    if (!varHeader) {
      throw new Error(`Key ${key} not found in var headers`);
    }

    const varOffset =
      varHeader.offset + this.getVarBuffer().bufOffset + index * this.bufLen;

    // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
    const results: any[] = [];
    for (let i = 0; i < varHeader.count; i++) {
      results.push(
        this.unpackValue(
          varOffset + i * varHeader.typeSize,
          varHeader.typeChar,
        ),
      );
    }
    return results;
  }

  private readVarHeader(offset: number): Vars {
    const view = new DataView(
      new Uint8Array(this.data.slice(offset, offset + 144)).buffer,
    );
    const type = view.getInt32(0, true);

    const typeSize = getTypeSize(VAR_TYPE_MAP[type]);
    return {
      type,
      typeChar: VAR_TYPE_MAP[type],
      typeSize,
      offset: view.getInt32(4, true),
      count: view.getInt32(8, true),
      countAsTime: view.getUint8(12) !== 0,
      name: this.readString(offset + 16, 32),
      desc: this.readString(offset + 48, 64),
      unit: this.readString(offset + 112, 32),
    };
  }

  private readString(offset: number, maxLength: number): string {
    const chars: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      const byte = this.data[offset + i];
      if (byte === 0) break;
      chars.push(byte);
    }
    return String.fromCharCode(...chars);
  }

  unpackValue(offset: number, typeChar: string): number | boolean {
    const bytes = new Uint8Array(this.data.slice(offset, offset + 8));
    const view = new DataView(bytes.buffer);

    switch (typeChar) {
      case 'i':
        return view.getInt32(0, true);
      case 'I':
        return view.getUint32(0, true);
      case 'f':
        return view.getFloat32(0, true);
      case 'd':
        return view.getFloat64(0, true);
      case '?':
        return this.data[offset] !== 0;
      case 'c':
        return this.data[offset] & 0xff;
      default:
        return 0;
    }
  }

  slice(offset: number, length: number): number[] {
    return this.data.slice(offset, offset + length);
  }

  updateData(fresh: number[]): void {
    this.data = fresh;
  }
}
