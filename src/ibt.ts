/**
 * IBT file reader for iRacing telemetry replay files
 */

import * as fs from 'fs';
import { Header, VarHeader, DiskSubHeader } from './structs.js';
import { VAR_TYPE_MAP } from './constants.js';

export class IBT {
  private ibtFile: fs.ReadStream | null = null;
  private sharedMem: Buffer | null = null;
  private header: Header | null = null;
  private diskHeader: DiskSubHeader | null = null;

  private varHeaders: VarHeader[] | null = null;
  private varHeadersDict: Map<string, VarHeader> = new Map();
  private varHeadersNames: string[] | null = null;

  get fileName(): string | null {
    return this.ibtFile ? (this.ibtFile as any).path : null;
  }

  get varHeaderBufferTick(): number | null {
    return this.header && this.header.varBuf[0] ? this.header.varBuf[0].tickCount : null;
  }

  get varHeadersNamesList(): string[] | null {
    if (!this.header) {
      return null;
    }

    if (!this.varHeadersNames) {
      this.varHeadersNames = this.getVarHeaders().map((h) => h.name);
    }

    return this.varHeadersNames;
  }

  /**
   * Open an IBT file
   */
  open(ibtFilePath: string): void {
    this.ibtFile = fs.createReadStream(ibtFilePath);
    const fileData = fs.readFileSync(ibtFilePath);
    this.sharedMem = fileData;

    if (this.sharedMem) {
      this.header = new Header(this.sharedMem);
      this.diskHeader = new DiskSubHeader(this.sharedMem, 112);
    }
  }

  /**
   * Close the IBT file
   */
  close(): void {
    if (this.ibtFile) {
      this.ibtFile.destroy();
      this.ibtFile = null;
    }

    this.sharedMem = null;
    this.header = null;
    this.diskHeader = null;

    this.varHeaders = null;
    this.varHeadersDict.clear();
    this.varHeadersNames = null;
  }

  /**
   * Get value at specific index
   */
  get(index: number, key: string): any {
    if (!this.header || !this.diskHeader || !this.sharedMem) {
      return null;
    }

    if (index < 0 || index >= this.diskHeader.sessionRecordCount) {
      return null;
    }

    const varHeader = this.varHeadersDict.get(key);
    if (!varHeader) {
      return null;
    }

    const typeChar = VAR_TYPE_MAP[varHeader.type];
    const varOffset = varHeader.offset + this.header.varBuf[0]._bufOffset + index * this.header.bufLen;

    return this.unpackValues(varOffset, typeChar, varHeader.count);
  }

  /**
   * Get value at latest index (alias)
   */
  operator_getitem(key: string): any {
    if (!this.diskHeader) {
      return null;
    }
    return this.get(this.diskHeader.sessionRecordCount - 1, key);
  }

  /**
   * Get all values for a key across all records
   */
  getAll(key: string): any[] | null {
    if (!this.header || !this.diskHeader || !this.sharedMem) {
      return null;
    }

    const varHeader = this.varHeadersDict.get(key);
    if (!varHeader) {
      return null;
    }

    const typeChar = VAR_TYPE_MAP[varHeader.type];
    const results: any[] = [];
    const bufLen = this.header.bufLen;
    const varOffset = varHeader.offset + this.header.varBuf[0]._bufOffset;

    for (let i = 0; i < this.diskHeader.sessionRecordCount; i++) {
      const value = this.unpackValues(varOffset + i * bufLen, typeChar, varHeader.count);
      results.push(value);
    }

    return results;
  }

  // Private methods

  private getVarHeaders(): VarHeader[] {
    if (!this.varHeaders && this.header && this.sharedMem) {
      this.varHeaders = [];
      this.varHeadersDict.clear();

      for (let i = 0; i < this.header.numVars; i++) {
        const varHeader = new VarHeader(this.sharedMem, this.header.varHeaderOffset + i * 144);
        this.varHeaders.push(varHeader);
        this.varHeadersDict.set(varHeader.name, varHeader);
      }
    }

    return this.varHeaders || [];
  }

  private unpackValues(offset: number, typeChar: string, count: number): any {
    if (!this.sharedMem) {
      return null;
    }

    if (count === 1) {
      return this.unpackSingleValue(offset, typeChar);
    } else {
      const results: any[] = [];
      const typeSize = this.getTypeSize(typeChar);
      for (let i = 0; i < count; i++) {
        results.push(this.unpackSingleValue(offset + i * typeSize, typeChar));
      }
      return results;
    }
  }

  private unpackSingleValue(offset: number, typeChar: string): any {
    if (!this.sharedMem) {
      return null;
    }

    switch (typeChar) {
      case 'i':
        return this.sharedMem.readInt32LE(offset);
      case 'I':
        return this.sharedMem.readUInt32LE(offset);
      case 'f':
        return this.sharedMem.readFloatLE(offset);
      case 'd':
        return this.sharedMem.readDoubleLE(offset);
      case '?':
        return this.sharedMem.readUInt8(offset) !== 0;
      case 'c':
        return this.sharedMem.readUInt8(offset);
      default:
        return 0;
    }
  }

  private getTypeSize(typeChar: string): number {
    switch (typeChar) {
      case 'i':
      case 'I':
      case 'f':
        return 4;
      case 'd':
        return 8;
      case '?':
      case 'c':
        return 1;
      default:
        return 0;
    }
  }
}

export default IBT;

