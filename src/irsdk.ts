/**
 * Main IRSDK class for communicating with iRacing
 */

import * as fs from 'fs';
import { EventEmitter } from 'events';
import {
  VERSION,
  MEMMAPFILE,
  MEMMAPFILESIZE,
  DATAVALIDEVENTNAME,
  BROADCASTMSGNAME,
  VAR_TYPE_MAP,
  StatusField,
  BroadcastMsg,
  ChatCommandMode,
  PitCommandMode,
  CameraState,
  RpyPosMode,
  RpySrchMode,
  RpyStateMode,
  ReloadTexturesMode,
  TelemCommandMode,
  FFBCommandMode,
  VideoCaptureMode,
} from './constants.js';
import { Header, VarBuffer, VarHeader, VarBuffer as VarBufferClass } from './structs.js';
import { checkSimStatus, extractYamlSection, parseIRSDKYaml, translateYamlData, padCarNumber } from './utils.js';

interface SessionInfoCache {
  data: any | null;
  dataLast?: any;
  dataBinary?: Buffer;
  asyncSessionInfoUpdate?: number;
  update?: number;
}

export class IRSDK extends EventEmitter {
  private isInitialized: boolean = false;
  private lastSessionInfoUpdate: number = 0;
  private parseYamlAsync: boolean = false;

  private sharedMem: Buffer | null = null;
  private header: Header | null = null;
  private dataValidEvent: any = null;

  private varHeaders: VarHeader[] | null = null;
  private varHeadersDict: Map<string, VarHeader> = new Map();
  private varHeadersNames: string[] | null = null;
  private varBufferLatest: VarBufferClass | null = null;
  private sessionInfoDict: Map<string, SessionInfoCache> = new Map();

  private testFile: fs.ReadStream | null = null;
  private workaroundConnectedState: number = 0;

  private broadcastMsgId: number | null = null;

  private windowsApi: any = null;

  constructor(parseYamlAsync: boolean = false) {
    super();
    this.parseYamlAsync = parseYamlAsync;

    // Try to load Windows APIs (will only work on Windows)
    if (process.platform === 'win32') {
      this.initializeWindowsApi();
    }
  }

  /**
   * Initialize Windows API bindings asynchronously
   */
  private async initializeWindowsApi(): Promise<void> {
    try {
      // Dynamically import FFI for Windows APIs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // @ts-ignore - ffi-napi is an optional dependency
      const ffiModule = await (import('ffi-napi') as Promise<any>);
      const ffi = ffiModule.default || ffiModule;

      // Dynamically import ref for type definitions (may be needed by ffi-napi)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // @ts-ignore - ref-napi is an optional dependency
        await (import('ref-napi') as Promise<any>);
      } catch (e) {
        // ref-napi is optional, ffi-napi might bundle it
      }

      // Load user32.dll for RegisterWindowMessageW and SendNotifyMessageW
      this.windowsApi = ffi.Library('user32.dll', {
        RegisterWindowMessageW: ['uint', ['string']],
        SendNotifyMessageW: ['bool', ['uint', 'uint', 'uint', 'uint']],
      });

      // Also try to load kernel32.dll for event handling
      try {
        const kernel32 = ffi.Library('kernel32.dll', {
          OpenEventW: ['pointer', ['uint', 'bool', 'string']],
          WaitForSingleObject: ['uint', ['pointer', 'uint']],
          CloseHandle: ['bool', ['pointer']],
        });
        Object.assign(this.windowsApi, kernel32);
      } catch (e) {
        // Kernel32 functions may not be critical
      }
    } catch (error) {
      // FFI not available - broadcast messages won't work but regular telemetry will
      console.debug('Windows API libraries not available. Broadcast messages will not work.');
    }
  }

  /**
   * Initialize and connect to iRacing
   */
  async startup(testFile?: string, dumpTo?: string): Promise<boolean> {
    try {
      // Check if sim is running
      if (!testFile) {
        const isRunning = await checkSimStatus();
        if (!isRunning) {
          console.warn('iRacing does not appear to be running');
        }

        // Try to open data valid event (Windows only)
        if (this.windowsApi) {
          this.dataValidEvent = this.windowsApi.OpenEventW(0x00100000, false, DATAVALIDEVENTNAME);
        }
      }

      // Wait for valid data
      if (!(await this.waitValidDataEvent())) {
        this.dataValidEvent = null;
        return false;
      }

      // Open shared memory
      if (!this.sharedMem) {
        if (testFile) {
          this.testFile = fs.createReadStream(testFile);
          const buffer = await this.readFileToBuffer(this.testFile);
          this.sharedMem = buffer;
        } else if (process.platform === 'win32') {
          // For production, would need to use Windows APIs to open named shared memory
          // For now, this is a placeholder
          console.warn('Shared memory access on Windows requires additional setup');
          return false;
        } else {
          console.error('iRacing SDK only works on Windows');
          return false;
        }
      }

      if (this.sharedMem) {
        // Dump to file if requested
        if (dumpTo) {
          fs.writeFileSync(dumpTo, this.sharedMem);
        }

        // Initialize header
        this.header = new Header(this.sharedMem);
        this.isInitialized = this.header.version >= 1 && this.header.varBuf.length > 0;
      }

      return this.isInitialized;
    } catch (error) {
      console.error('Failed to startup IRSDK:', error);
      return false;
    }
  }

  /**
   * Disconnect from iRacing
   */
  shutdown(): void {
    this.isInitialized = false;
    this.lastSessionInfoUpdate = 0;

    if (this.sharedMem) {
      // No need to explicitly close Buffer
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

  /**
   * Get telemetry value by key
   */
  get(key: string): any {
    if (!this.isInitialized || !this.header) {
      return undefined;
    }

    // Check if it's a telemetry variable
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
        const result: any[] = [];
        for (let i = 0; i < varHeader.count; i++) {
          result.push(this.unpackValue(memory, offset + i * this.getTypeSize(typeChar), typeChar));
        }
        return result;
      }
    }

    // Otherwise try to get from session info
    return this.getSessionInfo(key);
  }

  /**
   * Check if connected to iRacing
   */
  get isConnected(): boolean {
    if (!this.header) {
      return false;
    }

    if (this.header.status === StatusField.status_connected) {
      this.workaroundConnectedState = 0;
    }

    if (this.workaroundConnectedState === 0 && this.header.status !== StatusField.status_connected) {
      this.workaroundConnectedState = 1;
    }

    if (this.workaroundConnectedState === 1 && (this.get('SessionNum') === null || this.testFile)) {
      this.workaroundConnectedState = 2;
    }

    if (this.workaroundConnectedState === 2 && this.get('SessionNum') !== null) {
      this.workaroundConnectedState = 3;
    }

    return (
      this.header !== null &&
      (this.testFile !== null || this.dataValidEvent) &&
      (this.header.status === StatusField.status_connected || this.workaroundConnectedState === 3)
    );
  }

  /**
   * Get session info update counter
   */
  get sessionInfoUpdate(): number {
    return this.header?.sessionInfoUpdate ?? 0;
  }

  /**
   * Get list of available telemetry variable names
   */
  get varHeadersNamesList(): string[] {
    if (!this.varHeadersNames && this.header) {
      this.varHeadersNames = this.getVarHeaders().map((h) => h.name);
    }
    return this.varHeadersNames || [];
  }

  /**
   * Freeze the latest var buffer for consistent reads
   */
  freezeVarBufferLatest(): void {
    this.unfreezeVarBufferLatest();
    this.waitValidDataEventSync();

    if (this.header) {
      const sorted = [...this.header.varBuf].sort((a, b) => b.tickCount - a.tickCount);
      this.varBufferLatest = sorted[0];
      this.varBufferLatest.freeze();
    }
  }

  /**
   * Unfreeze the var buffer
   */
  unfreezeVarBufferLatest(): void {
    if (this.varBufferLatest) {
      this.varBufferLatest.unfreeze();
      this.varBufferLatest = null;
    }
  }

  // Broadcast message methods

  camSwitchPos(position: number = 0, group: number = 1, camera: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.cam_switch_pos, position, group, camera);
  }

  camSwitchNum(carNumber: string | number = '1', group: number = 1, camera: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.cam_switch_num, padCarNumber(carNumber), group, camera);
  }

  camSetState(cameraState: number = CameraState.cam_tool_active): boolean {
    return this.broadcastMsg(BroadcastMsg.cam_set_state, cameraState);
  }

  replaySetPlaySpeed(speed: number = 0, slowMotion: boolean = false): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_set_play_speed, speed, slowMotion ? 1 : 0);
  }

  replaySetPlayPosition(posMode: number = RpyPosMode.begin, frameNum: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_set_play_position, posMode, frameNum);
  }

  replaySearch(searchMode: number = RpySrchMode.to_start): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_search, searchMode);
  }

  replaySetState(stateMode: number = RpyStateMode.erase_tape): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_set_state, stateMode);
  }

  reloadAllTextures(): boolean {
    return this.broadcastMsg(BroadcastMsg.reload_textures, ReloadTexturesMode.all);
  }

  reloadTexture(carIdx: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.reload_textures, ReloadTexturesMode.car_idx, carIdx);
  }

  chatCommand(chatCommandMode: number = ChatCommandMode.begin_chat): boolean {
    return this.broadcastMsg(BroadcastMsg.chat_command, chatCommandMode);
  }

  chatCommandMacro(macroNum: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.chat_command, ChatCommandMode.macro, macroNum);
  }

  pitCommand(pitCommandMode: number = PitCommandMode.clear, variable: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.pit_command, pitCommandMode, variable);
  }

  telemCommand(telemCommandMode: number = TelemCommandMode.stop): boolean {
    return this.broadcastMsg(BroadcastMsg.telem_command, telemCommandMode);
  }

  ffbCommand(ffbCommandMode: number = FFBCommandMode.ffb_command_max_force, value: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.ffb_command, ffbCommandMode, Math.floor(value * 65536));
  }

  replaySearchSessionTime(sessionNum: number = 0, sessionTimeMs: number = 0): boolean {
    return this.broadcastMsg(BroadcastMsg.replay_search_session_time, sessionNum, sessionTimeMs);
  }

  videoCapture(videoCaptureMode: number = VideoCaptureMode.trigger_screen_shot): boolean {
    return this.broadcastMsg(BroadcastMsg.video_capture, videoCaptureMode);
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

  private getVarBufferLatest(): VarBufferClass | null {
    if (this.varBufferLatest) {
      return this.varBufferLatest;
    }

    if (!this.header) {
      return null;
    }

    // Return 2nd most recent var buffer (to avoid partially updated buffers)
    const sorted = [...this.header.varBuf].sort((a, b) => b.tickCount - a.tickCount);
    return sorted.length > 1 ? sorted[1] : sorted[0];
  }

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

    const cache = this.sessionInfoDict.get(key)!;

    if (cache.data) {
      return cache.data;
    }

    if (this.parseYamlAsync) {
      if (!cache.asyncSessionInfoUpdate || cache.asyncSessionInfoUpdate < this.lastSessionInfoUpdate) {
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
    if (cache.dataBinary && dataBinary.equals(cache.dataBinary) && cache.dataLast) {
      cache.data = cache.dataLast;
      return;
    }

    cache.dataBinary = dataBinary;

    // Parse YAML
    const yamlStr = translateYamlData(dataBinary);
    const parsed = parseIRSDKYaml(yamlStr);

    if (parsed && (!this.parseYamlAsync || this.lastSessionInfoUpdate === sessionInfoUpdate)) {
      const result = parsed[key];
      if (result) {
        cache.data = result;
        cache.update = sessionInfoUpdate;
      } else if (cache.dataLast) {
        cache.data = cache.dataLast;
      }
    }
  }

  private getSessionInfoBinary(key: string): Buffer | null {
    if (!this.header || !this.sharedMem) {
      return null;
    }

    return extractYamlSection(this.sharedMem, this.header.sessionInfoOffset, this.header.sessionInfoLen, key);
  }

  private async waitValidDataEvent(): Promise<boolean> {
    if (this.dataValidEvent && this.windowsApi) {
      const result = this.windowsApi.WaitForSingleObject(this.dataValidEvent, 32);
      return result === 0;
    }
    return true;
  }

  private waitValidDataEventSync(): boolean {
    // For synchronous wait, we just return true for now
    // In a real implementation, this would use Windows APIs
    return true;
  }

  private broadcastMsg(broadcastType: number, var1: number = 0, var2: number = 0, var3: number = 0): boolean {
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
        (var2 | (var3 << 16)) >>> 0
      );
    } catch (error) {
      console.error('Failed to send broadcast message:', error);
      return false;
    }
  }

  private getBroadcastMsgId(): number | null {
    if (this.broadcastMsgId === null && this.windowsApi) {
      try {
        this.broadcastMsgId = this.windowsApi.RegisterWindowMessageW(BROADCASTMSGNAME);
      } catch (error) {
        console.error('Failed to register broadcast message:', error);
        return null;
      }
    }
    return this.broadcastMsgId;
  }

  private unpackValue(buffer: Buffer, offset: number, typeChar: string): any {
    switch (typeChar) {
      case 'i':
        return buffer.readInt32LE(offset);
      case 'I':
        return buffer.readUInt32LE(offset);
      case 'f':
        return buffer.readFloatLE(offset);
      case 'd':
        return buffer.readDoubleLE(offset);
      case '?':
        return buffer.readUInt8(offset) !== 0;
      case 'c':
        return buffer.readUInt8(offset);
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

export default IRSDK;