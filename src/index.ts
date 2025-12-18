/**
 * iRacing SDK for Node.js
 * Main entry point
 */

// Export main classes
export { IRSDK, default } from './irsdk.js';
export { IBT } from './ibt.js';

// Export constants and enums
export {
  VERSION,
  SIM_STATUS_URL,
  DATAVALIDEVENTNAME,
  MEMMAPFILE,
  MEMMAPFILESIZE,
  BROADCASTMSGNAME,
  VAR_TYPE_MAP,
  StatusField,
  EngineWarnings,
  Flags,
  TrkLoc,
  TrkSurf,
  SessionState,
  CameraState,
  BroadcastMsg,
  ChatCommandMode,
  PitCommandMode,
  TelemCommandMode,
  RpyStateMode,
  ReloadTexturesMode,
  RpySrchMode,
  RpyPosMode,
  csMode,
  PitSvFlags,
  PitSvStatus,
  PaceMode,
  PaceFlags,
  CarLeftRight,
  FFBCommandMode,
  VideoCaptureMode,
  TrackWetness,
} from './constants.js';

// Export struct classes for advanced usage
export { IRSDKStruct, Header, VarBuffer, VarHeader, DiskSubHeader } from './structs.js';

// Export utilities
export { extractYamlSection, parseIRSDKYaml, translateYamlData, checkSimStatus, padCarNumber } from './utils.js';

