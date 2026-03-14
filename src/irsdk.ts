import fs from 'node:fs';
import path from 'node:path';
import koffi from 'koffi';
import { SharedMemory } from './shared-memory.ts';
import {
  checkSimStatus,
  extractYamlSection,
  parseIRSDKYaml,
  translateYamlData,
} from './utils.ts';
import {
  type SessionDataKey,
  type SessionDataValue,
  VARS,
  type VarKey,
} from './vars.ts';

type KoffiFunction = (...args: unknown[]) => unknown;
type KoffiBoolFunction = (...args: unknown[]) => boolean;
type KoffiUintFunction = (...args: unknown[]) => number;

type WindowsApi = {
  RegisterWindowMessageW: KoffiUintFunction;
  SendNotifyMessageW: KoffiBoolFunction;
  CloseHandle: KoffiFunction;
  OpenFileMappingW: KoffiFunction;
  MapViewOfFile: KoffiFunction;
  UnmapViewOfFile: KoffiFunction;
};

type SessionInfoCache = {
  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  data: any | null;
  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  dataLast?: any;
  dataBinary?: number[];
  asyncSessionInfoUpdate?: number;
  update?: number;
};

const MEMMAPFILE = 'Local\\IRSDKMemMapFileName';
const MEMMAPFILESIZE = 1164 * 1024;

const STATUS_CONNECTED = 1;

export class IRSDK {
  private isInitialized: boolean = false;
  private lastSessionInfoUpdate: number = 0;

  // @ts-expect-error We initialize this in the static methods, but it confuses TS that it's not set in the constructor
  private sharedMemory: SharedMemory;

  private sessionInfoDict: Map<string, SessionInfoCache> = new Map();

  private windowsApi: WindowsApi = {
    RegisterWindowMessageW: () => 0,
    SendNotifyMessageW: () => false,
    CloseHandle: () => {},
    OpenFileMappingW: () => {},
    MapViewOfFile: () => {},
    UnmapViewOfFile: () => {},
  };
  // biome-ignore lint/suspicious/noExplicitAny: Windows memory map handle
  private memMapHandle: any = null;
  // biome-ignore lint/suspicious/noExplicitAny: Windows mapped view pointer
  private memMapView: any = null;

  static fromDump(filePath: string): IRSDK {
    const instance = Object.create(IRSDK.prototype) as IRSDK;
    instance.isInitialized = false;
    instance.lastSessionInfoUpdate = 0;
    instance.sessionInfoDict = new Map();
    instance.memMapHandle = null;
    instance.memMapView = null;

    const buffer = fs.readFileSync(filePath);
    const data = Array.from(new Uint8Array(buffer));
    instance.sharedMemory = new SharedMemory(data);
    instance.isInitialized = instance.sharedMemory.version >= 1;

    if (instance.isInitialized) {
      instance.sharedMemory.getVarHeaders();
    }

    return instance;
  }

  static async connect(): Promise<IRSDK> {
    if (process.platform !== 'win32') {
      throw new Error(`process.platform ${process.platform} is not supported`);
    }

    const isRunning = await checkSimStatus();
    if (!isRunning) {
      throw new Error(
        'iRacing does not appear to be running. Please start iRacing before connecting.',
      );
    }

    const instance = new IRSDK();

    const user32 = koffi.load('user32.dll');
    const kernel32 = koffi.load('kernel32.dll');

    instance.windowsApi = {
      RegisterWindowMessageW: user32.func(
        'uint RegisterWindowMessageW(str16 lpString)',
      ),
      SendNotifyMessageW: user32.func(
        'bool SendNotifyMessageW(uintptr_t hWnd, uint Msg, uint wParam, uint lParam)',
      ),
      OpenFileMappingW: kernel32.func(
        'void* OpenFileMappingW(uint dwDesiredAccess, bool bInheritHandle, str16 lpName)',
      ),
      CloseHandle: kernel32.func('bool CloseHandle(void* hObject)'),
      MapViewOfFile: kernel32.func(
        'void* MapViewOfFile(void* hFileMappingObject, uint dwDesiredAccess, uint dwFileOffsetHigh, uint dwFileOffsetLow, uintptr_t dwNumberOfBytesToMap)',
      ),
      UnmapViewOfFile: kernel32.func(
        'bool UnmapViewOfFile(void* lpBaseAddress)',
      ),
    };

    const sharedMem = instance.openSharedMemory();
    instance.sharedMemory = new SharedMemory(sharedMem);
    instance.isInitialized = instance.sharedMemory.version >= 1;

    if (!instance.isInitialized) {
      throw new Error('Failed to initialize IRSDK');
    }

    return instance;
  }

  shutdown(): void {
    this.isInitialized = false;
    this.lastSessionInfoUpdate = 0;

    try {
      this.windowsApi.UnmapViewOfFile(this.memMapView);
      this.windowsApi.CloseHandle(this.memMapHandle);
    } catch (error) {
      // ignore cleanup errors
      console.debug('Error during shutdown cleanup, but ignoring:', error);
    }

    this.memMapHandle = null;
    this.memMapView = null;
    this.sessionInfoDict.clear();
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  get(key: VarKey): Array<any> {
    const result = this.sharedMemory.readVar(key);
    return Array.isArray(result) ? result : [result];
  }

  getSessionInfo<K extends SessionDataKey>(
    key: K,
  ): K extends keyof SessionDataValue ? SessionDataValue[K] : unknown {
    if (this.lastSessionInfoUpdate < this.sessionInfoUpdate) {
      this.lastSessionInfoUpdate = this.sessionInfoUpdate;

      for (const cache of this.sessionInfoDict.values()) {
        if (cache.data) {
          cache.dataLast = cache.data;
        }
        cache.data = null;
      }
    }

    if (!this.sessionInfoDict.has(key)) {
      this.sessionInfoDict.set(key, { data: null });
    }

    // biome-ignore lint/style/noNonNullAssertion: We just ensured this above with has() check
    const cache = this.sessionInfoDict.get(key)!;

    if (cache.data) {
      return cache.data;
    }

    this.parseYamlContent(key, cache);

    return cache.data;
  }

  isConnected(): boolean {
    if (!this.sharedMemory) {
      return false;
    }

    if (this.sharedMemory.status !== STATUS_CONNECTED) {
      return false;
    }

    if (this.get(VARS.SESSION_NUM) === null) {
      return false;
    }

    return true;
  }

  get sessionInfoUpdate(): number {
    return this.sharedMemory?.sessionInfoUpdate ?? 0;
  }

  getVarHeadersNamesList(): string[] {
    return this.sharedMemory.getVarHeadersList();
  }

  dumpSharedMemory(outputPath: string): void {
    if (!this.sharedMemory) {
      console.warn('Shared memory not initialized. Call connect() first.');
      return;
    }

    console.log(`  Version: ${this.sharedMemory.version}`);
    console.log(`  Status: ${this.sharedMemory.status}`);
    console.log(`  Tick Rate: ${this.sharedMemory.tickRate}`);
    console.log(`  Num Vars: ${this.sharedMemory.numVars}`);
    console.log(`  Session Info Len: ${this.sharedMemory.sessionInfoLen}`);
    console.log(`  Num Buffers: ${this.sharedMemory.numBuf}`);
    console.log(`  Buffer Len: ${this.sharedMemory.bufLen}`);

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // We need the raw data for dumping - use slice to get it all
    const rawData = this.sharedMemory.slice(0, MEMMAPFILESIZE);
    const buffer = Buffer.from(new Uint8Array(rawData));
    fs.writeFileSync(outputPath, buffer);

    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    console.log(`\n✓ Shared memory dumped to: ${outputPath}`);
    console.log(`  Size: ${sizeMB} MB (${buffer.length} bytes)`);
  }

  /**
   * Re-reads the latest data from the mapped shared memory into this.sharedMem.
   * Call this before reading telemetry to get up-to-date values.
   */
  refreshSharedMemory(): void {
    if (!this.memMapView || !this.sharedMemory) {
      return;
    }

    try {
      const fresh: number[] = koffi.decode(
        this.memMapView,
        koffi.types.uint8,
        MEMMAPFILESIZE,
      );
      this.sharedMemory.updateData(fresh);
    } catch (error) {
      console.error(
        'Error refreshing shared memory data. Data may be stale.',
        error,
      );
    }
  }

  // Private methods

  private openSharedMemory(): number[] {
    this.memMapHandle = this.windowsApi.OpenFileMappingW(
      0x0004,
      false,
      MEMMAPFILE,
    );

    if (!this.memMapHandle) {
      throw new Error(
        `Failed to open iRacing shared memory mapping "${MEMMAPFILE}". Ensure iRacing is running and the sim is active.`,
      );
    }

    this.memMapView = this.windowsApi.MapViewOfFile(
      this.memMapHandle,
      0x0004,
      0,
      0,
      MEMMAPFILESIZE,
    );

    if (!this.memMapView) {
      this.windowsApi.CloseHandle(this.memMapHandle);
      this.memMapHandle = null;
      throw new Error('Failed to map view of iRacing shared memory.');
    }

    // koffi.decode returns a plain JS Array of uint8 values — exactly what we need
    const sharedMem = koffi.decode(
      this.memMapView,
      koffi.types.uint8,
      MEMMAPFILESIZE,
    );

    return sharedMem;
  }

  private parseYamlContent(key: string, cache: SessionInfoCache): void {
    const sessionInfoUpdate = this.lastSessionInfoUpdate;
    const dataBinary = this.getSessionInfoBinary(key);

    if (!dataBinary) {
      if (cache.dataLast) {
        cache.data = cache.dataLast;
      }
      return;
    }

    // Check if binary data is the same as last time
    if (
      cache.dataBinary &&
      dataBinary.length === cache.dataBinary.length &&
      dataBinary.every((v, i) => v === cache.dataBinary?.[i]) &&
      cache.dataLast
    ) {
      cache.data = cache.dataLast;
      return;
    }

    cache.dataBinary = dataBinary;

    // Parse YAML
    const yamlStr = translateYamlData(dataBinary);
    const parsed = parseIRSDKYaml(yamlStr);

    if (parsed && this.lastSessionInfoUpdate === sessionInfoUpdate) {
      const result = parsed[key];
      if (result) {
        cache.data = result;
        cache.update = sessionInfoUpdate;
      } else if (cache.dataLast) {
        cache.data = cache.dataLast;
      }
    }
  }

  private getSessionInfoBinary(key: string): number[] | null {
    if (!this.sharedMemory) {
      return null;
    }

    const sessionData = this.sharedMemory.slice(
      this.sharedMemory.sessionInfoOffset,
      this.sharedMemory.sessionInfoLen,
    );

    return extractYamlSection(sessionData, 0, sessionData.length, key);
  }
}
