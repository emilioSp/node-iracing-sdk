import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import koffi from 'koffi';
import {
  BROADCASTMSGNAME,
  BroadcastMsg,
  CameraState,
  ChatCommandMode,
  DATAVALIDEVENTNAME,
  FFBCommandMode,
  MEMMAPFILE,
  MEMMAPFILESIZE,
  PitCommandMode,
  ReloadTexturesMode,
  RpyPosMode,
  RpySrchMode,
  RpyStateMode,
  StatusField,
  TelemCommandMode,
  VAR_TYPE_MAP,
  VideoCaptureMode,
} from './constants.ts';
import {
  Header,
  type VarBuffer as VarBufferClass,
  VarHeader,
} from './structs.ts';
import {
  checkSimStatus,
  extractYamlSection,
  padCarNumber,
  parseIRSDKYaml,
  translateYamlData,
} from './utils.ts';

type SessionInfoCache = {
  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  data: any | null;
  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  dataLast?: any;
  dataBinary?: number[];
  asyncSessionInfoUpdate?: number;
  update?: number;
};

export class IRSDK extends EventEmitter {
  private isInitialized: boolean = false;
  private lastSessionInfoUpdate: number = 0;
  private parseYamlAsync: boolean = false;

  private sharedMem: number[] | null = null;
  private header: Header | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: Windows API handle type varies
  private dataValidEvent: any = null;

  private varHeaders: VarHeader[] | null = null;
  private varHeadersDict: Map<string, VarHeader> = new Map();
  private varHeadersNames: string[] | null = null;
  private varBufferLatest: VarBufferClass | null = null;
  private sessionInfoDict: Map<string, SessionInfoCache> = new Map();

  private testFile: fs.ReadStream | null = null;
  private workaroundConnectedState: number = 0;

  private broadcastMsgId: number | null = null;

  // biome-ignore lint/suspicious/noExplicitAny: Windows FFI binding is dynamically typed
  private windowsApi: any = null;
  private windowsApiReady: Promise<void> | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: Windows memory map handle
  private memMapHandle: any = null;
  // biome-ignore lint/suspicious/noExplicitAny: Windows mapped view pointer
  private memMapView: any = null;

  constructor(parseYamlAsync: boolean = false) {
    super();
    this.parseYamlAsync = parseYamlAsync;

    if (process.platform === 'win32') {
      this.windowsApiReady = this.initializeWindowsApi();
    }
  }

  private async initializeWindowsApi(): Promise<void> {
    try {
      const user32 = koffi.load('user32.dll');
      const kernel32 = koffi.load('kernel32.dll');

      this.windowsApi = {
        RegisterWindowMessageW: user32.func(
          'uint RegisterWindowMessageW(str16 lpString)',
        ),
        SendNotifyMessageW: user32.func(
          'bool SendNotifyMessageW(uintptr_t hWnd, uint Msg, uint wParam, uint lParam)',
        ),
        OpenEventW: kernel32.func(
          'void* OpenEventW(uint dwDesiredAccess, bool bInheritHandle, str16 lpName)',
        ),
        WaitForSingleObject: kernel32.func(
          'uint WaitForSingleObject(void* hHandle, uint dwMilliseconds)',
        ),
        CloseHandle: kernel32.func('bool CloseHandle(void* hObject)'),
        OpenFileMappingW: kernel32.func(
          'void* OpenFileMappingW(uint dwDesiredAccess, bool bInheritHandle, str16 lpName)',
        ),
        MapViewOfFile: kernel32.func(
          'void* MapViewOfFile(void* hFileMappingObject, uint dwDesiredAccess, uint dwFileOffsetHigh, uint dwFileOffsetLow, uintptr_t dwNumberOfBytesToMap)',
        ),
        UnmapViewOfFile: kernel32.func(
          'bool UnmapViewOfFile(void* lpBaseAddress)',
        ),
        _koffi: koffi,
      };
    } catch (e) {
      console.debug(
        'Windows API libraries not available. Broadcast messages will not work, but regular telemetry access should still function on supported platforms.',
        e,
      );
    }
  }

  async startup(testFile?: string, dumpTo?: string): Promise<boolean> {
    try {
      // Ensure Windows API is fully initialized before proceeding
      if (this.windowsApiReady) {
        await this.windowsApiReady;
      }

      if (!testFile) {
        const isRunning = await checkSimStatus();
        if (!isRunning) {
          console.warn('iRacing does not appear to be running');
        }

        if (this.windowsApi?.OpenEventW) {
          this.dataValidEvent = this.windowsApi.OpenEventW(
            0x00100000,
            false,
            DATAVALIDEVENTNAME,
          );
        }
      }

      if (!(await this.waitValidDataEvent())) {
        this.dataValidEvent = null;
        return false;
      }

      if (!this.sharedMem) {
        if (testFile) {
          this.testFile = fs.createReadStream(testFile);
          const buffer = await this.readFileToBuffer(this.testFile);
          this.sharedMem = [...buffer];
        } else if (process.platform === 'win32') {
          const mem = this.openSharedMemory();
          if (!mem) {
            console.error(
              'Failed to open iRacing shared memory. Make sure iRacing is running.',
            );
            return false;
          }
          this.sharedMem = mem;
        } else {
          console.error('iRacing SDK only works on Windows');
          return false;
        }
      }

      if (this.sharedMem) {
        if (dumpTo) {
          fs.writeFileSync(dumpTo, Buffer.from(this.sharedMem));
        }

        this.header = new Header(this.sharedMem);
        this.isInitialized =
          this.header.version >= 1 && this.header.varBuf.length > 0;
      }

      return this.isInitialized;
    } catch (error) {
      console.error('Failed to startup IRSDK:', error);
      return false;
    }
  }

  shutdown(): void {
    this.isInitialized = false;
    this.lastSessionInfoUpdate = 0;

    try {
      this.windowsApi.UnmapViewOfFile(this.memMapView);
      this.memMapView = null;
      this.windowsApi.CloseHandle(this.memMapHandle);
      this.memMapHandle = null;
    } catch (error) {
      // ignore cleanup errors
      console.debug('Error during shutdown cleanup, but ignoring:', error);
    }

    if (this.sharedMem) {
      this.sharedMem = null;
    }

    this.header = null;
    this.dataValidEvent = null;
    this.varHeaders = null;
    this.varHeadersDict.clear();
    this.varHeadersNames = null;
    this.varBufferLatest = null;
    this.sessionInfoDict.clear();

    if (this.testFile) {
      this.testFile.destroy();
      this.testFile = null;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  get(key: string): any {
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

    return this.getSessionInfo(key);
  }

  get isConnected(): boolean {
    if (!this.header) {
      return false;
    }

    if (this.header.status === StatusField.status_connected) {
      this.workaroundConnectedState = 0;
    }

    if (
      this.workaroundConnectedState === 0 &&
      this.header.status !== StatusField.status_connected
    ) {
      this.workaroundConnectedState = 1;
    }

    if (
      this.workaroundConnectedState === 1 &&
      (this.get('SessionNum') === null || this.testFile)
    ) {
      this.workaroundConnectedState = 2;
    }

    if (
      this.workaroundConnectedState === 2 &&
      this.get('SessionNum') !== null
    ) {
      this.workaroundConnectedState = 3;
    }

    return (
      this.header !== null &&
      (this.testFile !== null || this.dataValidEvent) &&
      (this.header.status === StatusField.status_connected ||
        this.workaroundConnectedState === 3)
    );
  }

  get sessionInfoUpdate(): number {
    return this.header?.sessionInfoUpdate ?? 0;
  }

  get varHeadersNamesList(): string[] {
    if (!this.varHeadersNames && this.header) {
      this.varHeadersNames = this.getVarHeaders().map((h) => h.name);
    }
    return this.varHeadersNames || [];
  }

  freezeVarBufferLatest(): void {
    this.unfreezeVarBufferLatest();
    this.refreshSharedMemory();
    this.waitValidDataEventSync();

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

  camSwitchPos(
    position: number = 0,
    group: number = 1,
    camera: number = 0,
  ): boolean {
    return this.broadcastMsg(
      BroadcastMsg.cam_switch_pos,
      position,
      group,
      camera,
    );
  }

  camSwitchNum(
    carNumber: string | number = '1',
    group: number = 1,
    camera: number = 0,
  ): boolean {
    return this.broadcastMsg(
      BroadcastMsg.cam_switch_num,
      padCarNumber(carNumber),
      group,
      camera,
    );
  }

  camSetState(cameraState: number = CameraState.cam_tool_active): boolean {
    return this.broadcastMsg(BroadcastMsg.cam_set_state, cameraState);
  }

  replaySetPlaySpeed(speed: number = 0, slowMotion: boolean = false): boolean {
    return this.broadcastMsg(
      BroadcastMsg.replay_set_play_speed,
      speed,
      slowMotion ? 1 : 0,
    );
  }

  replaySetPlayPosition(
    posMode: number = RpyPosMode.begin,
    frameNum: number = 0,
  ): boolean {
    return this.broadcastMsg(
      BroadcastMsg.replay_set_play_position,
      posMode,
      frameNum,
    );
  }

  replaySearch(searchMode: number = RpySrchMode.to_start): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_search, searchMode);
  }

  replaySetState(stateMode: number = RpyStateMode.erase_tape): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_set_state, stateMode);
  }

  reloadAllTextures(): boolean {
    return this.broadcastMsg(
      BroadcastMsg.reload_textures,
      ReloadTexturesMode.all,
    );
  }

  reloadTexture(carIdx: number = 0): boolean {
    return this.broadcastMsg(
      BroadcastMsg.reload_textures,
      ReloadTexturesMode.car_idx,
      carIdx,
    );
  }

  chatCommand(chatCommandMode: number = ChatCommandMode.begin_chat): boolean {
    return this.broadcastMsg(BroadcastMsg.chat_command, chatCommandMode);
  }

  chatCommandMacro(macroNum: number = 0): boolean {
    return this.broadcastMsg(
      BroadcastMsg.chat_command,
      ChatCommandMode.macro,
      macroNum,
    );
  }

  pitCommand(
    pitCommandMode: number = PitCommandMode.clear,
    variable: number = 0,
  ): boolean {
    return this.broadcastMsg(
      BroadcastMsg.pit_command,
      pitCommandMode,
      variable,
    );
  }

  telemCommand(telemCommandMode: number = TelemCommandMode.stop): boolean {
    return this.broadcastMsg(BroadcastMsg.telem_command, telemCommandMode);
  }

  ffbCommand(
    ffbCommandMode: number = FFBCommandMode.ffb_command_max_force,
    value: number = 0,
  ): boolean {
    return this.broadcastMsg(
      BroadcastMsg.ffb_command,
      ffbCommandMode,
      Math.floor(value * 65536),
    );
  }

  replaySearchSessionTime(
    sessionNum: number = 0,
    sessionTimeMs: number = 0,
  ): boolean {
    return this.broadcastMsg(
      BroadcastMsg.replay_search_session_time,
      sessionNum,
      sessionTimeMs,
    );
  }

  videoCapture(
    videoCaptureMode: number = VideoCaptureMode.trigger_screen_shot,
  ): boolean {
    return this.broadcastMsg(BroadcastMsg.video_capture, videoCaptureMode);
  }

  // Private methods

  private openSharedMemory(): number[] | null {
    if (!this.windowsApi?.OpenFileMappingW || !this.windowsApi?.MapViewOfFile) {
      console.error(
        'Windows kernel32 APIs (OpenFileMappingW/MapViewOfFile) are not available. ' +
          'Install koffi: npm install koffi',
      );
      return null;
    }

    try {
      // FILE_MAP_READ = 0x0004
      const handle = this.windowsApi.OpenFileMappingW(
        0x0004,
        false,
        MEMMAPFILE,
      );

      if (!handle) {
        console.error(
          `Failed to open iRacing shared memory mapping "${MEMMAPFILE}". ` +
            'Ensure iRacing is running and the sim is active.',
        );
        return null;
      }

      this.memMapHandle = handle;

      // FILE_MAP_READ = 0x0004
      const view = this.windowsApi.MapViewOfFile(
        handle,
        0x0004,
        0,
        0,
        MEMMAPFILESIZE,
      );

      if (!view) {
        console.error('Failed to map view of iRacing shared memory.');
        this.windowsApi.CloseHandle(handle);
        this.memMapHandle = null;
        return null;
      }

      this.memMapView = view;

      // koffi.decode returns a plain JS Array of uint8 values — exactly what we need
      const koffi = this.windowsApi._koffi;
      return koffi.decode(view, koffi.types.uint8, MEMMAPFILESIZE);
    } catch (error) {
      console.error('Error opening Windows shared memory:', error);
      return null;
    }
  }

  /**
   * Re-reads the latest data from the mapped shared memory into this.sharedMem.
   * Call this before reading telemetry to get up-to-date values.
   */
  private refreshSharedMemory(): void {
    if (!this.memMapView || !this.sharedMem || !this.windowsApi?._koffi) {
      return;
    }
    try {
      const koffi = this.windowsApi._koffi;
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

  private getVarHeaders(): VarHeader[] {
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

    return this.varHeaders || [];
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

  // biome-ignore lint/suspicious/noExplicitAny: Session data is dynamically typed
  private getSessionInfo(key: string): any {
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

    const cache = this.sessionInfoDict.get(key);
    if (!cache) {
      return null;
    }

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

  private async waitValidDataEvent(): Promise<boolean> {
    if (this.dataValidEvent && this.windowsApi?.WaitForSingleObject) {
      const result = this.windowsApi.WaitForSingleObject(
        this.dataValidEvent,
        32,
      );
      return result === 0;
    }
    // No event handle available — allow proceeding so shared memory can be read directly
    return true;
  }

  private waitValidDataEventSync(): boolean {
    // For synchronous wait, we just return true for now
    // In a real implementation, this would use Windows APIs
    return true;
  }

  private broadcastMsg(
    broadcastType: number,
    var1: number = 0,
    var2: number = 0,
    var3: number = 0,
  ): boolean {
    if (!this.windowsApi) {
      console.warn('Windows API not available. Broadcast message not sent.');
      return false;
    }

    try {
      const msgId = this.getBroadcastMsgId();
      if (!msgId) {
        return false;
      }

      return this.windowsApi.SendNotifyMessageW(
        0xffff,
        msgId,
        (broadcastType | (var1 << 16)) >>> 0,
        (var2 | (var3 << 16)) >>> 0,
      );
    } catch (error) {
      console.error('Failed to send broadcast message:', error);
      return false;
    }
  }

  private getBroadcastMsgId(): number | null {
    if (this.broadcastMsgId === null && this.windowsApi) {
      try {
        this.broadcastMsgId =
          this.windowsApi.RegisterWindowMessageW(BROADCASTMSGNAME);
      } catch (error) {
        console.error('Failed to register broadcast message:', error);
        return null;
      }
    }
    return this.broadcastMsgId;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Telemetry data is dynamically typed
  private unpackValue(data: number[], offset: number, typeChar: string): any {
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

  private readFileToBuffer(stream: fs.ReadStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer | string) => {
        if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk));
        } else {
          chunks.push(chunk);
        }
      });
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
