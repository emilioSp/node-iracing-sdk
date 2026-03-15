import * as fs from 'node:fs';
import { SharedMemory } from './shared-memory.ts';

const readInt32LE = (data: number[], offset: number): number => {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  );
};

export class IBT {
  private ibtFile: fs.ReadStream | null = null;
  private sharedMemory: SharedMemory | null = null;
  private sessionRecordCount: number = 0;

  get varHeadersNamesList(): string[] | null {
    if (!this.sharedMemory) {
      return null;
    }

    return this.sharedMemory.getVarHeadersList();
  }

  /**
   * Open an IBT file
   */
  open(ibtFilePath: string): void {
    this.ibtFile = fs.createReadStream(ibtFilePath);
    const buf = fs.readFileSync(ibtFilePath);
    const fileData = [...buf];

    this.sharedMemory = new SharedMemory(fileData);
    this.sessionRecordCount = readInt32LE(fileData, 140);
    this.sharedMemory.getVarHeaders();
  }

  /**
   * Close the IBT file
   */
  close(): void {
    if (this.ibtFile) {
      this.ibtFile.destroy();
      this.ibtFile = null;
    }

    this.sharedMemory = null;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  get(index: number, key: string): any {
    if (!this.sharedMemory) {
      return null;
    }

    if (index < 0 || index >= this.sessionRecordCount) {
      return null;
    }

    return this.sharedMemory.readVarAtIndex(key, index);
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  getAll(key: string): any[] | null {
    if (!this.sharedMemory) {
      return null;
    }

    const varHeaders = this.sharedMemory.getVarHeaders();
    const varHeader = varHeaders.get(key);
    if (!varHeader) {
      return null;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
    const results: any[] = [];
    for (let i = 0; i < this.sessionRecordCount; i++) {
      results.push(this.sharedMemory.readVarAtIndex(key, i));
    }

    return results;
  }
}
