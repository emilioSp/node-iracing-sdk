import fs from 'node:fs';
import path from 'node:path';
import koffi from 'koffi';
import {
  Header,
  type VarBuffer as VarBufferClass,
  VarHeader,
} from './structs.ts';
import {
  checkSimStatus,
  extractYamlSection,
  parseIRSDKYaml,
  translateYamlData,
} from './utils.ts';
import {
  type SessionDataKey,
  type SessionDataValue,
  VAR_TYPE_MAP,
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
  private parseYamlAsync: boolean = false;

  private sharedMem: number[] | null = null;
  private header: Header | null = null;

  private varHeaders: VarHeader[] | null = null;
  private varHeadersDict: Map<string, VarHeader> = new Map();
  private varHeadersNames: string[] | null = null;
  private varBufferLatest: VarBufferClass | null = null;
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
    instance.parseYamlAsync = false;
    instance.varHeaders = null;
    instance.varHeadersDict = new Map();
    instance.varHeadersNames = null;
    instance.varBufferLatest = null;
    instance.sessionInfoDict = new Map();
    instance.memMapHandle = null;
    instance.memMapView = null;

    const buffer = fs.readFileSync(filePath);
    instance.sharedMem = Array.from(new Uint8Array(buffer));
    instance.header = new Header(instance.sharedMem);
    instance.isInitialized =
      instance.header.version >= 1 && instance.header.varBuf.length > 0;

    if (instance.isInitialized) {
      instance.initVarHeaders();
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
    instance.parseYamlAsync = false; // TODO: check this value

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

    instance.sharedMem = instance.openSharedMemory();
    instance.header = new Header(instance.sharedMem);
    instance.isInitialized =
      instance.header.version >= 1 && instance.header.varBuf.length > 0;

    if (instance.isInitialized) {
      instance.initVarHeaders();
    } else {
      throw new Error('Failed to initialize IRSDK instance from shared memory');
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
    this.sharedMem = null;
    this.header = null;
    this.varHeaders = null;
    this.varHeadersDict.clear();
    this.varHeadersNames = null;
    this.varBufferLatest = null;
    this.sessionInfoDict.clear();
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  get(key: VarKey): any {
    if (!this.isInitialized || !this.header) {
      return undefined;
    }

    // Refresh shared memory for live data when not frozen
    if (!this.varBufferLatest) {
      this.refreshSharedMemory();
    }

    const varHeader = this.varHeadersDict.get(key);
    if (varHeader) {
      const varBufLatest = this.getVarBufferLatest();
      if (!varBufLatest) {
        return undefined;
      }

      const memory = varBufLatest.getMemory();
      const offset = varBufLatest.bufOffset + varHeader.offset;
      const typeChar = VAR_TYPE_MAP[varHeader.type];

      if (varHeader.count === 1) {
        return this.unpackValue(memory, offset, typeChar);
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
        const result: any[] = [];
        for (let i = 0; i < varHeader.count; i++) {
          result.push(
            this.unpackValue(
              memory,
              offset + i * this.getTypeSize(typeChar),
              typeChar,
            ),
          );
        }
        return result;
      }
    }

    throw new Error(`Key ${key} not found in var headers`);
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

    if (this.parseYamlAsync) {
      if (
        !cache.asyncSessionInfoUpdate ||
        cache.asyncSessionInfoUpdate < this.lastSessionInfoUpdate
      ) {
        cache.asyncSessionInfoUpdate = this.lastSessionInfoUpdate;
        this.parseYamlAsync && this.parseYamlContent(key, cache);
      }
    } else {
      this.parseYamlContent(key, cache);
    }

    return cache.data;
  }

  isConnected(): boolean {
    if (this.header === null) {
      return false;
    }

    if (this.header.status !== STATUS_CONNECTED) {
      return false;
    }

    if (this.get(VARS.SESSION_NUM) === null) {
      return false;
    }

    return true;
  }

  get sessionInfoUpdate(): number {
    return this.header?.sessionInfoUpdate ?? 0;
  }

  getVarHeadersNamesList(): string[] {
    if (!this.varHeadersNames && this.header) {
      if (this.varHeaders === null) {
        throw new Error('Var headers not initialized');
      }
      this.varHeadersNames = this.varHeaders.map((h) => h.name);
    }
    return this.varHeadersNames || [];
  }

  freezeVarBufferLatest(): void {
    this.unfreezeVarBufferLatest();
    this.refreshSharedMemory();

    if (this.header) {
      const sorted = [...this.header.varBuf].sort(
        (a, b) => b.tickCount - a.tickCount,
      );
      this.varBufferLatest = sorted[0];
      this.varBufferLatest.freeze();
    }
  }

  unfreezeVarBufferLatest(): void {
    if (this.varBufferLatest) {
      this.varBufferLatest.unfreeze();
      this.varBufferLatest = null;
    }
  }

  dumpSharedMemory(outputPath: string): void {
    if (!this.sharedMem) {
      console.warn('Shared memory not initialized. Call connect() first.');
      return;
    }

    if (!this.header) {
      console.warn('Header not initialized. Call connect() first.');
      return;
    }

    console.log(`  Version: ${this.header.version}`);
    console.log(`  Status: ${this.header.status}`);
    console.log(`  Tick Rate: ${this.header.tickRate}`);
    console.log(`  Num Vars: ${this.header.numVars}`);
    console.log(`  Session Info Len: ${this.header.sessionInfoLen}`);
    console.log(`  Num Buffers: ${this.header.numBuf}`);
    console.log(`  Buffer Len: ${this.header.bufLen}`);

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const buffer = Buffer.from(new Uint8Array(this.sharedMem));
    fs.writeFileSync(outputPath, buffer);

    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    console.log(`\n✓ Shared memory dumped to: ${outputPath}`);
    console.log(`  Size: ${sizeMB} MB (${buffer.length} bytes)`);
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

  /**
   * Re-reads the latest data from the mapped shared memory into this.sharedMem.
   * Call this before reading telemetry to get up-to-date values.
   */
  private refreshSharedMemory(): void {
    if (!this.memMapView || !this.sharedMem) {
      return;
    }

    try {
      const fresh: number[] = koffi.decode(
        this.memMapView,
        koffi.types.uint8,
        MEMMAPFILESIZE,
      );
      // Overwrite in-place so all existing references (header, varHeaders, etc.) see the new data
      for (let i = 0; i < fresh.length; i++) {
        this.sharedMem[i] = fresh[i];
      }
    } catch (error) {
      console.error(
        'Error refreshing shared memory data. Data may be stale.',
        error,
      );
    }
  }

  private initVarHeaders() {
    if (!this.varHeaders && this.header && this.sharedMem) {
      this.varHeaders = [];
      this.varHeadersDict.clear();

      for (let i = 0; i < this.header.numVars; i++) {
        const varHeader = new VarHeader(
          this.sharedMem,
          this.header.varHeaderOffset + i * 144,
        );
        this.varHeaders.push(varHeader);
        this.varHeadersDict.set(varHeader.name, varHeader);
      }
    }
  }

  private getVarBufferLatest(): VarBufferClass | null {
    if (this.varBufferLatest) {
      return this.varBufferLatest;
    }

    if (!this.header) {
      return null;
    }

    // Return 2nd most recent var buffer (to avoid partially updated buffers)
    const sorted = [...this.header.varBuf].sort(
      (a, b) => b.tickCount - a.tickCount,
    );
    return sorted.length > 1 ? sorted[1] : sorted[0];
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

    if (
      parsed &&
      (!this.parseYamlAsync || this.lastSessionInfoUpdate === sessionInfoUpdate)
    ) {
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
    if (!this.header || !this.sharedMem) {
      return null;
    }

    return extractYamlSection(
      this.sharedMem,
      this.header.sessionInfoOffset,
      this.header.sessionInfoLen,
      key,
    );
  }

  private unpackValue(
    data: number[],
    offset: number,
    typeChar: string,
  ): number | boolean {
    const bytes = new Uint8Array(data.slice(offset, offset + 8));
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
        return data[offset] !== 0;
      case 'c':
        return data[offset] & 0xff;
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
