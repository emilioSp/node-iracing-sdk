import type { DriverInfo, SessionInfo, WeekendInfo } from './types.ts';

export const VARS = {
  /** Density of air at start/finish line, kg/m^3 */
  AIR_DENSITY: 'AirDensity',
  /** Pressure of air at start/finish line, Pa */
  AIR_PRESSURE: 'AirPressure',
  /** Temperature of air at start/finish line, C */
  AIR_TEMP: 'AirTemp',
  /** 0=brake released to 1=max pedal force, % */
  BRAKE: 'Brake',
  /** True if abs is currently reducing brake force pressure */
  BRAKE_AB_SACTIVE: 'BrakeABSactive',
  /** Raw brake input 0=brake released to 1=max pedal force, % */
  BRAKE_RAW: 'BrakeRaw',
  /** Active camera number */
  CAM_CAMERA_NUMBER: 'CamCameraNumber',
  /** State of camera system, irsdk_CameraState */
  CAM_CAMERA_STATE: 'CamCameraState',
  /** Active camera's focus car index */
  CAM_CAR_IDX: 'CamCarIdx',
  /** Active camera group number */
  CAM_GROUP_NUMBER: 'CamGroupNumber',
  /** Distance to first car in front of player in meters, m */
  CAR_DIST_AHEAD: 'CarDistAhead',
  /** Distance to first car behind player in meters, m */
  CAR_DIST_BEHIND: 'CarDistBehind',
  /** Cars best lap number */
  CAR_IDX_BEST_LAP_NUM: 'CarIdxBestLapNum',
  /** Cars best lap time, s */
  CAR_IDX_BEST_LAP_TIME: 'CarIdxBestLapTime',
  /** Cars class id by car index */
  CAR_IDX_CLASS: 'CarIdxClass',
  /** Cars class position in race by car index */
  CAR_IDX_CLASS_POSITION: 'CarIdxClassPosition',
  /** Estimated time to reach current location on track, s */
  CAR_IDX_EST_TIME: 'CarIdxEstTime',
  /** Race time behind leader or fastest lap time otherwise, s */
  CAR_IDX_F2_TIME: 'CarIdxF2Time',
  /** How many fast repairs each car has used */
  CAR_IDX_FAST_REPAIRS_USED: 'CarIdxFastRepairsUsed',
  /** -1=reverse  0=neutral  1..n=current gear by car index */
  CAR_IDX_GEAR: 'CarIdxGear',
  /** Laps started by car index */
  CAR_IDX_LAP: 'CarIdxLap',
  /** Laps completed by car index */
  CAR_IDX_LAP_COMPLETED: 'CarIdxLapCompleted',
  /** Percentage distance around lap by car index, % */
  CAR_IDX_LAP_DIST_PCT: 'CarIdxLapDistPct',
  /** Cars last lap time, s */
  CAR_IDX_LAST_LAP_TIME: 'CarIdxLastLapTime',
  /** On pit road between the cones by car index */
  CAR_IDX_ON_PIT_ROAD: 'CarIdxOnPitRoad',
  /** Push2Pass count of usage (or remaining in Race) */
  CAR_IDX_P2_P_COUNT: 'CarIdxP2P_Count',
  /** Push2Pass active or not */
  CAR_IDX_P2_P_STATUS: 'CarIdxP2P_Status',
  /** Pacing status flags for each car, irsdk_PaceFlags */
  CAR_IDX_PACE_FLAGS: 'CarIdxPaceFlags',
  /** What line cars are pacing in  or -1 if not pacing */
  CAR_IDX_PACE_LINE: 'CarIdxPaceLine',
  /** What row cars are pacing in  or -1 if not pacing */
  CAR_IDX_PACE_ROW: 'CarIdxPaceRow',
  /** Cars position in race by car index */
  CAR_IDX_POSITION: 'CarIdxPosition',
  /** Cars Qual tire compound */
  CAR_IDX_QUAL_TIRE_COMPOUND: 'CarIdxQualTireCompound',
  /** Cars Qual tire compound is locked-in */
  CAR_IDX_QUAL_TIRE_COMPOUND_LOCKED: 'CarIdxQualTireCompoundLocked',
  /** Engine rpm by car index, revs/min */
  CAR_IDX_RPM: 'CarIdxRPM',
  /** Session flags for each player, irsdk_Flags */
  CAR_IDX_SESSION_FLAGS: 'CarIdxSessionFlags',
  /** Steering wheel angle by car index, rad */
  CAR_IDX_STEER: 'CarIdxSteer',
  /** Cars current tire compound */
  CAR_IDX_TIRE_COMPOUND: 'CarIdxTireCompound',
  /** Track surface type by car index, irsdk_TrkLoc */
  CAR_IDX_TRACK_SURFACE: 'CarIdxTrackSurface',
  /** Track surface material type by car index, irsdk_TrkSurf */
  CAR_IDX_TRACK_SURFACE_MATERIAL: 'CarIdxTrackSurfaceMaterial',
  /** Notify if car is to the left or right of driver, irsdk_CarLeftRight */
  CAR_LEFT_RIGHT: 'CarLeftRight',
  /** Communications average latency, s */
  CHAN_AVG_LATENCY: 'ChanAvgLatency',
  /** Communications server clock skew, s */
  CHAN_CLOCK_SKEW: 'ChanClockSkew',
  /** Communications latency, s */
  CHAN_LATENCY: 'ChanLatency',
  /** Partner communications quality, % */
  CHAN_PARTNER_QUALITY: 'ChanPartnerQuality',
  /** Communications quality, % */
  CHAN_QUALITY: 'ChanQuality',
  /** 0=disengaged to 1=fully engaged, % */
  CLUTCH: 'Clutch',
  /** Raw clutch input 0=disengaged to 1=fully engaged, % */
  CLUTCH_RAW: 'ClutchRaw',
  /** Percent of available tim bg thread took with a 1 sec avg, % */
  CPU_USAGE_BG: 'CpuUsageBG',
  /** Percent of available tim fg thread took with a 1 sec avg, % */
  CPU_USAGE_FG: 'CpuUsageFG',
  /** Number of team drivers who have run a stint */
  DC_DRIVERS_SO_FAR: 'DCDriversSoFar',
  /** Status of driver change lap requirements */
  DC_LAP_STATUS: 'DCLapStatus',
  /** Track if pit speed limiter system is enabled */
  DC_PIT_SPEED_LIMITER_TOGGLE: 'dcPitSpeedLimiterToggle',
  /** In car trigger car starter */
  DC_STARTER: 'dcStarter',
  /** In car turn wipers on or off */
  DC_TOGGLE_WINDSHIELD_WIPERS: 'dcToggleWindshieldWipers',
  /** In car momentarily turn on wipers */
  DC_TRIGGER_WINDSHIELD_WIPERS: 'dcTriggerWindshieldWipers',
  /** Default units for the user interface 0 = english 1 = metric */
  DISPLAY_UNITS: 'DisplayUnits',
  /** Pitstop fast repair set */
  DP_FAST_REPAIR: 'dpFastRepair',
  /** Pitstop fuel add amount, kg */
  DP_FUEL_ADD_KG: 'dpFuelAddKg',
  /** Pitstop auto fill fuel next stop flag */
  DP_FUEL_AUTO_FILL_ACTIVE: 'dpFuelAutoFillActive',
  /** Pitstop auto fill fuel system enabled */
  DP_FUEL_AUTO_FILL_ENABLED: 'dpFuelAutoFillEnabled',
  /** Pitstop fuel fill flag */
  DP_FUEL_FILL: 'dpFuelFill',
  /** Pitstop lf tire change request */
  DP_LF_TIRE_CHANGE: 'dpLFTireChange',
  /** Pitstop lf tire cold pressure adjustment, Pa */
  DP_LF_TIRE_COLD_PRESS: 'dpLFTireColdPress',
  /** Pitstop lr tire change request */
  DP_LR_TIRE_CHANGE: 'dpLRTireChange',
  /** Pitstop lr tire cold pressure adjustment, Pa */
  DP_LR_TIRE_COLD_PRESS: 'dpLRTireColdPress',
  /** Pitstop rf tire change request */
  DP_RF_TIRE_CHANGE: 'dpRFTireChange',
  /** Pitstop rf cold tire pressure adjustment, Pa */
  DP_RF_TIRE_COLD_PRESS: 'dpRFTireColdPress',
  /** Pitstop rr tire change request */
  DP_RR_TIRE_CHANGE: 'dpRRTireChange',
  /** Pitstop rr cold tire pressure adjustment, Pa */
  DP_RR_TIRE_COLD_PRESS: 'dpRRTireColdPress',
  /** Pitstop windshield tearoff */
  DP_WINDSHIELD_TEAROFF: 'dpWindshieldTearoff',
  /** Driver activated flag */
  DRIVER_MARKER: 'DriverMarker',
  /** Engine0 Engine rpm, revs/min */
  ENGINE0_RPM: 'Engine0_RPM',
  /** Bitfield for warning lights, irsdk_EngineWarnings */
  ENGINE_WARNINGS: 'EngineWarnings',
  /** Indicate action the reset key will take 0 enter 1 exit 2 reset */
  ENTER_EXIT_RESET: 'EnterExitReset',
  /** How many fast repairs left  255 is unlimited */
  FAST_REPAIR_AVAILABLE: 'FastRepairAvailable',
  /** How many fast repairs used so far */
  FAST_REPAIR_USED: 'FastRepairUsed',
  /** Fog level at start/finish line, % */
  FOG_LEVEL: 'FogLevel',
  /** Average frames per second, fps */
  FRAME_RATE: 'FrameRate',
  /** How many front tire sets are remaining  255 is unlimited */
  FRONT_TIRE_SETS_AVAILABLE: 'FrontTireSetsAvailable',
  /** How many front tire sets used so far */
  FRONT_TIRE_SETS_USED: 'FrontTireSetsUsed',
  /** Liters of fuel remaining, l */
  FUEL_LEVEL: 'FuelLevel',
  /** Percent fuel remaining, % */
  FUEL_LEVEL_PCT: 'FuelLevelPct',
  /** Engine fuel pressure, bar */
  FUEL_PRESS: 'FuelPress',
  /** Engine fuel used instantaneous, kg/h */
  FUEL_USE_PER_HOUR: 'FuelUsePerHour',
  /** -1=reverse  0=neutral  1..n=current gear */
  GEAR: 'Gear',
  /** Percent of available tim gpu took with a 1 sec avg, % */
  GPU_USAGE: 'GpuUsage',
  /** Raw handbrake input 0=handbrake released to 1=max force, % */
  HANDBRAKE_RAW: 'HandbrakeRaw',
  /** 0=disk based telemetry file not being written  1=being written */
  IS_DISK_LOGGING_ACTIVE: 'IsDiskLoggingActive',
  /** 0=disk based telemetry turned off  1=turned on */
  IS_DISK_LOGGING_ENABLED: 'IsDiskLoggingEnabled',
  /** 1=Garage screen is visible */
  IS_GARAGE_VISIBLE: 'IsGarageVisible',
  /** 1=Car in garage physics running */
  IS_IN_GARAGE: 'IsInGarage',
  /** 1=Car on track physics running with player in car */
  IS_ON_TRACK: 'IsOnTrack',
  /** 1=Car on track physics running */
  IS_ON_TRACK_CAR: 'IsOnTrackCar',
  /** 0=replay not playing  1=replay playing */
  IS_REPLAY_PLAYING: 'IsReplayPlaying',
  /** Laps started count */
  LAP: 'Lap',
  /** Players best lap number */
  LAP_BEST_LAP: 'LapBestLap',
  /** Players best lap time, s */
  LAP_BEST_LAP_TIME: 'LapBestLapTime',
  /** Player last lap in best N average lap time */
  LAP_BEST_N_LAP_LAP: 'LapBestNLapLap',
  /** Player best N average lap time, s */
  LAP_BEST_N_LAP_TIME: 'LapBestNLapTime',
  /** Laps completed count */
  LAP_COMPLETED: 'LapCompleted',
  /** Estimate of players current lap time as shown in F3 box, s */
  LAP_CURRENT_LAP_TIME: 'LapCurrentLapTime',
  /** Delta time for best lap, s */
  LAP_DELTA_TO_BEST_LAP: 'LapDeltaToBestLap',
  /** Rate of change of delta time for best lap, s/s */
  LAP_DELTA_TO_BEST_LAP_DD: 'LapDeltaToBestLap_DD',
  /** Delta time for best lap is valid */
  LAP_DELTA_TO_BEST_LAP_OK: 'LapDeltaToBestLap_OK',
  /** Delta time for optimal lap, s */
  LAP_DELTA_TO_OPTIMAL_LAP: 'LapDeltaToOptimalLap',
  /** Rate of change of delta time for optimal lap, s/s */
  LAP_DELTA_TO_OPTIMAL_LAP_DD: 'LapDeltaToOptimalLap_DD',
  /** Delta time for optimal lap is valid */
  LAP_DELTA_TO_OPTIMAL_LAP_OK: 'LapDeltaToOptimalLap_OK',
  /** Delta time for session best lap, s */
  LAP_DELTA_TO_SESSION_BEST_LAP: 'LapDeltaToSessionBestLap',
  /** Rate of change of delta time for session best lap, s/s */
  LAP_DELTA_TO_SESSION_BEST_LAP_DD: 'LapDeltaToSessionBestLap_DD',
  /** Delta time for session best lap is valid */
  LAP_DELTA_TO_SESSION_BEST_LAP_OK: 'LapDeltaToSessionBestLap_OK',
  /** Delta time for session last lap, s */
  LAP_DELTA_TO_SESSION_LASTL_LAP: 'LapDeltaToSessionLastlLap',
  /** Rate of change of delta time for session last lap, s/s */
  LAP_DELTA_TO_SESSION_LASTL_LAP_DD: 'LapDeltaToSessionLastlLap_DD',
  /** Delta time for session last lap is valid */
  LAP_DELTA_TO_SESSION_LASTL_LAP_OK: 'LapDeltaToSessionLastlLap_OK',
  /** Delta time for session optimal lap, s */
  LAP_DELTA_TO_SESSION_OPTIMAL_LAP: 'LapDeltaToSessionOptimalLap',
  /** Rate of change of delta time for session optimal lap, s/s */
  LAP_DELTA_TO_SESSION_OPTIMAL_LAP_DD: 'LapDeltaToSessionOptimalLap_DD',
  /** Delta time for session optimal lap is valid */
  LAP_DELTA_TO_SESSION_OPTIMAL_LAP_OK: 'LapDeltaToSessionOptimalLap_OK',
  /** Meters traveled from S/F this lap, m */
  LAP_DIST: 'LapDist',
  /** Percentage distance around lap, % */
  LAP_DIST_PCT: 'LapDistPct',
  /** Player num consecutive clean laps completed for N average */
  LAP_LAS_N_LAP_SEQ: 'LapLasNLapSeq',
  /** Players last lap time, s */
  LAP_LAST_LAP_TIME: 'LapLastLapTime',
  /** Player last N average lap time, s */
  LAP_LAST_N_LAP_TIME: 'LapLastNLapTime',
  /** Lateral acceleration (including gravity), m/s^2 */
  LAT_ACCEL: 'LatAccel',
  /** Lateral acceleration (including gravity) at 360 Hz, m/s^2 */
  LAT_ACCEL_ST: 'LatAccel_ST',
  /** How many left tire sets are remaining  255 is unlimited */
  LEFT_TIRE_SETS_AVAILABLE: 'LeftTireSetsAvailable',
  /** How many left tire sets used so far */
  LEFT_TIRE_SETS_USED: 'LeftTireSetsUsed',
  /** LF brake line pressure, bar */
  L_FBRAKE_LINE_PRESS: 'LFbrakeLinePress',
  /** LF tire cold pressure as set in the garage, kPa */
  L_FCOLD_PRESSURE: 'LFcoldPressure',
  /** LF distance tire traveled since being placed on car, m */
  L_FODOMETER: 'LFodometer',
  /** LF shock deflection, m */
  L_FSHOCK_DEFL: 'LFshockDefl',
  /** LF shock deflection at 360 Hz, m */
  L_FSHOCK_DEFL_ST: 'LFshockDefl_ST',
  /** LF shock velocity, m/s */
  L_FSHOCK_VEL: 'LFshockVel',
  /** LF shock velocity at 360 Hz, m/s */
  L_FSHOCK_VEL_ST: 'LFshockVel_ST',
  /** LF tire left carcass temperature, C */
  L_FTEMP_CL: 'LFtempCL',
  /** LF tire middle carcass temperature, C */
  L_FTEMP_CM: 'LFtempCM',
  /** LF tire right carcass temperature, C */
  L_FTEMP_CR: 'LFtempCR',
  /** How many left front tires are remaining  255 is unlimited */
  LF_TIRES_AVAILABLE: 'LFTiresAvailable',
  /** How many left front tires used so far */
  LF_TIRES_USED: 'LFTiresUsed',
  /** LF tire left percent tread remaining, % */
  L_FWEAR_L: 'LFwearL',
  /** LF tire middle percent tread remaining, % */
  L_FWEAR_M: 'LFwearM',
  /** LF tire right percent tread remaining, % */
  L_FWEAR_R: 'LFwearR',
  /** True if the car_num texture will be loaded */
  LOAD_NUM_TEXTURES: 'LoadNumTextures',
  /** Longitudinal acceleration (including gravity), m/s^2 */
  LONG_ACCEL: 'LongAccel',
  /** Longitudinal acceleration (including gravity) at 360 Hz, m/s^2 */
  LONG_ACCEL_ST: 'LongAccel_ST',
  /** LR brake line pressure, bar */
  L_RBRAKE_LINE_PRESS: 'LRbrakeLinePress',
  /** LR tire cold pressure as set in the garage, kPa */
  L_RCOLD_PRESSURE: 'LRcoldPressure',
  /** LR distance tire traveled since being placed on car, m */
  L_RODOMETER: 'LRodometer',
  /** LR shock deflection, m */
  L_RSHOCK_DEFL: 'LRshockDefl',
  /** LR shock deflection at 360 Hz, m */
  L_RSHOCK_DEFL_ST: 'LRshockDefl_ST',
  /** LR shock velocity, m/s */
  L_RSHOCK_VEL: 'LRshockVel',
  /** LR shock velocity at 360 Hz, m/s */
  L_RSHOCK_VEL_ST: 'LRshockVel_ST',
  /** LR tire left carcass temperature, C */
  L_RTEMP_CL: 'LRtempCL',
  /** LR tire middle carcass temperature, C */
  L_RTEMP_CM: 'LRtempCM',
  /** LR tire right carcass temperature, C */
  L_RTEMP_CR: 'LRtempCR',
  /** How many left rear tires are remaining  255 is unlimited */
  LR_TIRES_AVAILABLE: 'LRTiresAvailable',
  /** How many left rear tires used so far */
  LR_TIRES_USED: 'LRTiresUsed',
  /** LR tire left percent tread remaining, % */
  L_RWEAR_L: 'LRwearL',
  /** LR tire middle percent tread remaining, % */
  L_RWEAR_M: 'LRwearM',
  /** LR tire right percent tread remaining, % */
  L_RWEAR_R: 'LRwearR',
  /** Engine manifold pressure, bar */
  MANIFOLD_PRESS: 'ManifoldPress',
  /** Hybrid manual boost state */
  MANUAL_BOOST: 'ManualBoost',
  /** Hybrid manual no boost state */
  MANUAL_NO_BOOST: 'ManualNoBoost',
  /** Memory page faults per second */
  MEM_PAGE_FAULT_SEC: 'MemPageFaultSec',
  /** Memory soft page faults per second */
  MEM_SOFT_PAGE_FAULT_SEC: 'MemSoftPageFaultSec',
  /** Engine oil level, l */
  OIL_LEVEL: 'OilLevel',
  /** Engine oil pressure, bar */
  OIL_PRESS: 'OilPress',
  /** Engine oil temperature, C */
  OIL_TEMP: 'OilTemp',
  /** True if it is ok to reload car textures at this time */
  OK_TO_RELOAD_TEXTURES: 'OkToReloadTextures',
  /** Is the player car on pit road between the cones */
  ON_PIT_ROAD: 'OnPitRoad',
  /** Push2Pass count of usage (or remaining in Race) on your car */
  P2_P_COUNT: 'P2P_Count',
  /** Push2Pass active or not on your car */
  P2_P_STATUS: 'P2P_Status',
  /** Are we pacing or not, irsdk_PaceMode */
  PACE_MODE: 'PaceMode',
  /** Pitch orientation, rad */
  PITCH: 'Pitch',
  /** Pitch rate, rad/s */
  PITCH_RATE: 'PitchRate',
  /** Pitch rate at 360 Hz, rad/s */
  PITCH_RATE_ST: 'PitchRate_ST',
  /** Time left for optional repairs if repairs are active, s */
  PIT_OPT_REPAIR_LEFT: 'PitOptRepairLeft',
  /** Time left for mandatory pit repairs if repairs are active, s */
  PIT_REPAIR_LEFT: 'PitRepairLeft',
  /** True if pit stop is allowed for the current player */
  PITS_OPEN: 'PitsOpen',
  /** Is the player getting pit stop service */
  PITSTOP_ACTIVE: 'PitstopActive',
  /** Bitfield of pit service checkboxes, irsdk_PitSvFlags */
  PIT_SV_FLAGS: 'PitSvFlags',
  /** Pit service fuel add amount, l or kWh */
  PIT_SV_FUEL: 'PitSvFuel',
  /** Pit service left front tire pressure, kPa */
  PIT_SV_LFP: 'PitSvLFP',
  /** Pit service left rear tire pressure, kPa */
  PIT_SV_LRP: 'PitSvLRP',
  /** Pit service right front tire pressure, kPa */
  PIT_SV_RFP: 'PitSvRFP',
  /** Pit service right rear tire pressure, kPa */
  PIT_SV_RRP: 'PitSvRRP',
  /** Pit service pending tire compound */
  PIT_SV_TIRE_COMPOUND: 'PitSvTireCompound',
  /** Player car class id */
  PLAYER_CAR_CLASS: 'PlayerCarClass',
  /** Players class position in race */
  PLAYER_CAR_CLASS_POSITION: 'PlayerCarClassPosition',
  /** Teams current drivers incident count for this session */
  PLAYER_CAR_DRIVER_INCIDENT_COUNT: 'PlayerCarDriverIncidentCount',
  /** Players dry tire set limit */
  PLAYER_CAR_DRY_TIRE_SET_LIMIT: 'PlayerCarDryTireSetLimit',
  /** Players carIdx */
  PLAYER_CAR_IDX: 'PlayerCarIdx',
  /** Players car is properly in their pitstall */
  PLAYER_CAR_IN_PIT_STALL: 'PlayerCarInPitStall',
  /** Players own incident count for this session */
  PLAYER_CAR_MY_INCIDENT_COUNT: 'PlayerCarMyIncidentCount',
  /** Players car pit service status bits, irsdk_PitSvStatus */
  PLAYER_CAR_PIT_SV_STATUS: 'PlayerCarPitSvStatus',
  /** Players position in race */
  PLAYER_CAR_POSITION: 'PlayerCarPosition',
  /** Players power adjust, % */
  PLAYER_CAR_POWER_ADJUST: 'PlayerCarPowerAdjust',
  /** Shift light blink rpm, revs/min */
  PLAYER_CAR_SL_BLINK_RPM: 'PlayerCarSLBlinkRPM',
  /** Shift light first light rpm, revs/min */
  PLAYER_CAR_SL_FIRST_RPM: 'PlayerCarSLFirstRPM',
  /** Shift light last light rpm, revs/min */
  PLAYER_CAR_SL_LAST_RPM: 'PlayerCarSLLastRPM',
  /** Shift light shift rpm, revs/min */
  PLAYER_CAR_SL_SHIFT_RPM: 'PlayerCarSLShiftRPM',
  /** Players team incident count for this session */
  PLAYER_CAR_TEAM_INCIDENT_COUNT: 'PlayerCarTeamIncidentCount',
  /** Players car is being towed if time is greater than zero, s */
  PLAYER_CAR_TOW_TIME: 'PlayerCarTowTime',
  /** Players weight penalty, kg */
  PLAYER_CAR_WEIGHT_PENALTY: 'PlayerCarWeightPenalty',
  /** Players car number of fast repairs used */
  PLAYER_FAST_REPAIRS_USED: 'PlayerFastRepairsUsed',
  /** Log incidents that the player received, irsdk_IncidentFlags */
  PLAYER_INCIDENTS: 'PlayerIncidents',
  /** Players car current tire compound */
  PLAYER_TIRE_COMPOUND: 'PlayerTireCompound',
  /** Players car track surface type, irsdk_TrkLoc */
  PLAYER_TRACK_SURFACE: 'PlayerTrackSurface',
  /** Players car track surface material type, irsdk_TrkSurf */
  PLAYER_TRACK_SURFACE_MATERIAL: 'PlayerTrackSurfaceMaterial',
  /** Precipitation at start/finish line, % */
  PRECIPITATION: 'Precipitation',
  /** Push to pass button state */
  PUSH_TO_PASS: 'PushToPass',
  /** Push to talk button state */
  PUSH_TO_TALK: 'PushToTalk',
  /** Laps completed in race */
  RACE_LAPS: 'RaceLaps',
  /** The car index of the current person speaking on the radio */
  RADIO_TRANSMIT_CAR_IDX: 'RadioTransmitCarIdx',
  /** The frequency index of the current person speaking on the radio */
  RADIO_TRANSMIT_FREQUENCY_IDX: 'RadioTransmitFrequencyIdx',
  /** The radio index of the current person speaking on the radio */
  RADIO_TRANSMIT_RADIO_IDX: 'RadioTransmitRadioIdx',
  /** How many rear tire sets are remaining  255 is unlimited */
  REAR_TIRE_SETS_AVAILABLE: 'RearTireSetsAvailable',
  /** How many rear tire sets used so far */
  REAR_TIRE_SETS_USED: 'RearTireSetsUsed',
  /** Relative Humidity at start/finish line, % */
  RELATIVE_HUMIDITY: 'RelativeHumidity',
  /** Integer replay frame number (60 per second) */
  REPLAY_FRAME_NUM: 'ReplayFrameNum',
  /** Integer replay frame number from end of tape */
  REPLAY_FRAME_NUM_END: 'ReplayFrameNumEnd',
  /** 0=not slow motion  1=replay is in slow motion */
  REPLAY_PLAY_SLOW_MOTION: 'ReplayPlaySlowMotion',
  /** Replay playback speed */
  REPLAY_PLAY_SPEED: 'ReplayPlaySpeed',
  /** Replay session number */
  REPLAY_SESSION_NUM: 'ReplaySessionNum',
  /** Seconds since replay session start, s */
  REPLAY_SESSION_TIME: 'ReplaySessionTime',
  /** RF brake line pressure, bar */
  R_FBRAKE_LINE_PRESS: 'RFbrakeLinePress',
  /** RF tire cold pressure as set in the garage, kPa */
  R_FCOLD_PRESSURE: 'RFcoldPressure',
  /** RF distance tire traveled since being placed on car, m */
  R_FODOMETER: 'RFodometer',
  /** RF shock deflection, m */
  R_FSHOCK_DEFL: 'RFshockDefl',
  /** RF shock deflection at 360 Hz, m */
  R_FSHOCK_DEFL_ST: 'RFshockDefl_ST',
  /** RF shock velocity, m/s */
  R_FSHOCK_VEL: 'RFshockVel',
  /** RF shock velocity at 360 Hz, m/s */
  R_FSHOCK_VEL_ST: 'RFshockVel_ST',
  /** RF tire left carcass temperature, C */
  R_FTEMP_CL: 'RFtempCL',
  /** RF tire middle carcass temperature, C */
  R_FTEMP_CM: 'RFtempCM',
  /** RF tire right carcass temperature, C */
  R_FTEMP_CR: 'RFtempCR',
  /** How many right front tires are remaining  255 is unlimited */
  RF_TIRES_AVAILABLE: 'RFTiresAvailable',
  /** How many right front tires used so far */
  RF_TIRES_USED: 'RFTiresUsed',
  /** RF tire left percent tread remaining, % */
  R_FWEAR_L: 'RFwearL',
  /** RF tire middle percent tread remaining, % */
  R_FWEAR_M: 'RFwearM',
  /** RF tire right percent tread remaining, % */
  R_FWEAR_R: 'RFwearR',
  /** How many right tire sets are remaining  255 is unlimited */
  RIGHT_TIRE_SETS_AVAILABLE: 'RightTireSetsAvailable',
  /** How many right tire sets used so far */
  RIGHT_TIRE_SETS_USED: 'RightTireSetsUsed',
  /** Roll orientation, rad */
  ROLL: 'Roll',
  /** Roll rate, rad/s */
  ROLL_RATE: 'RollRate',
  /** Roll rate at 360 Hz, rad/s */
  ROLL_RATE_ST: 'RollRate_ST',
  /** Engine rpm, revs/min */
  RPM: 'RPM',
  /** RR brake line pressure, bar */
  R_RBRAKE_LINE_PRESS: 'RRbrakeLinePress',
  /** RR tire cold pressure as set in the garage, kPa */
  R_RCOLD_PRESSURE: 'RRcoldPressure',
  /** RR distance tire traveled since being placed on car, m */
  R_RODOMETER: 'RRodometer',
  /** RR shock deflection, m */
  R_RSHOCK_DEFL: 'RRshockDefl',
  /** RR shock deflection at 360 Hz, m */
  R_RSHOCK_DEFL_ST: 'RRshockDefl_ST',
  /** RR shock velocity, m/s */
  R_RSHOCK_VEL: 'RRshockVel',
  /** RR shock velocity at 360 Hz, m/s */
  R_RSHOCK_VEL_ST: 'RRshockVel_ST',
  /** RR tire left carcass temperature, C */
  R_RTEMP_CL: 'RRtempCL',
  /** RR tire middle carcass temperature, C */
  R_RTEMP_CM: 'RRtempCM',
  /** RR tire right carcass temperature, C */
  R_RTEMP_CR: 'RRtempCR',
  /** How many right rear tires are remaining  255 is unlimited */
  RR_TIRES_AVAILABLE: 'RRTiresAvailable',
  /** How many right rear tires used so far */
  RR_TIRES_USED: 'RRTiresUsed',
  /** RR tire left percent tread remaining, % */
  R_RWEAR_L: 'RRwearL',
  /** RR tire middle percent tread remaining, % */
  R_RWEAR_M: 'RRwearM',
  /** RR tire right percent tread remaining, % */
  R_RWEAR_R: 'RRwearR',
  /** Session flags, irsdk_Flags */
  SESSION_FLAGS: 'SessionFlags',
  /** Joker laps remaining to be taken */
  SESSION_JOKER_LAPS_REMAIN: 'SessionJokerLapsRemain',
  /** Old laps left till session ends use SessionLapsRemainEx */
  SESSION_LAPS_REMAIN: 'SessionLapsRemain',
  /** New improved laps left till session ends */
  SESSION_LAPS_REMAIN_EX: 'SessionLapsRemainEx',
  /** Total number of laps in session */
  SESSION_LAPS_TOTAL: 'SessionLapsTotal',
  /** Session number */
  SESSION_NUM: 'SessionNum',
  /** Player is currently completing a joker lap */
  SESSION_ON_JOKER_LAP: 'SessionOnJokerLap',
  /** Session state, irsdk_SessionState */
  SESSION_STATE: 'SessionState',
  /** Current update number */
  SESSION_TICK: 'SessionTick',
  /** Seconds since session start, s */
  SESSION_TIME: 'SessionTime',
  /** Time of day in seconds, s */
  SESSION_TIME_OF_DAY: 'SessionTimeOfDay',
  /** Seconds left till session ends, s */
  SESSION_TIME_REMAIN: 'SessionTimeRemain',
  /** Total number of seconds in session, s */
  SESSION_TIME_TOTAL: 'SessionTimeTotal',
  /** Session ID */
  SESSION_UNIQUE_ID: 'SessionUniqueID',
  /** Log inputs from the players shifter control */
  SHIFTER: 'Shifter',
  /** RPM of shifter grinding noise, RPM */
  SHIFT_GRIND_RPM: 'ShiftGrindRPM',
  /** @deprecated use DriverCarSLBlinkRPM instead, % */
  SHIFT_INDICATOR_PCT: 'ShiftIndicatorPct',
  /** Friction torque applied to gears when shifting or grinding, % */
  SHIFT_POWER_PCT: 'ShiftPowerPct',
  /** Skies (0=clear/1=p cloudy/2=m cloudy/3=overcast) */
  SKIES: 'Skies',
  /** Sun angle above horizon in radians, rad */
  SOLAR_ALTITUDE: 'SolarAltitude',
  /** Sun angle clockwise from north in radians, rad */
  SOLAR_AZIMUTH: 'SolarAzimuth',
  /** GPS vehicle speed, m/s */
  SPEED: 'Speed',
  /** Force feedback is enabled */
  STEERING_FFB_ENABLED: 'SteeringFFBEnabled',
  /** Steering wheel angle, rad */
  STEERING_WHEEL_ANGLE: 'SteeringWheelAngle',
  /** Steering wheel max angle, rad */
  STEERING_WHEEL_ANGLE_MAX: 'SteeringWheelAngleMax',
  /** Force feedback limiter strength limits impacts and oscillation, % */
  STEERING_WHEEL_LIMITER: 'SteeringWheelLimiter',
  /** Value of strength or max force slider in Nm for FFB, N*m */
  STEERING_WHEEL_MAX_FORCE_NM: 'SteeringWheelMaxForceNm',
  /** Force feedback % max damping, % */
  STEERING_WHEEL_PCT_DAMPER: 'SteeringWheelPctDamper',
  /** Force feedback % max intensity, % */
  STEERING_WHEEL_PCT_INTENSITY: 'SteeringWheelPctIntensity',
  /** Force feedback % max smoothing, % */
  STEERING_WHEEL_PCT_SMOOTHING: 'SteeringWheelPctSmoothing',
  /** Force feedback % max torque on steering shaft unsigned, % */
  STEERING_WHEEL_PCT_TORQUE: 'SteeringWheelPctTorque',
  /** Force feedback % max torque on steering shaft signed, % */
  STEERING_WHEEL_PCT_TORQUE_SIGN: 'SteeringWheelPctTorqueSign',
  /** Force feedback % max torque on steering shaft signed stops, % */
  STEERING_WHEEL_PCT_TORQUE_SIGN_STOPS: 'SteeringWheelPctTorqueSignStops',
  /** Peak torque mapping to direct input units for FFB, N*m */
  STEERING_WHEEL_PEAK_FORCE_NM: 'SteeringWheelPeakForceNm',
  /** Output torque on steering shaft, N*m */
  STEERING_WHEEL_TORQUE: 'SteeringWheelTorque',
  /** Output torque on steering shaft at 360 Hz, N*m */
  STEERING_WHEEL_TORQUE_ST: 'SteeringWheelTorque_ST',
  /** True if steering wheel force is using linear mode */
  STEERING_WHEEL_USE_LINEAR: 'SteeringWheelUseLinear',
  /** 0=off throttle to 1=full throttle, % */
  THROTTLE: 'Throttle',
  /** Raw throttle input 0=off throttle to 1=full throttle, % */
  THROTTLE_RAW: 'ThrottleRaw',
  /** Players LF Tire Sound rumblestrip pitch, Hz */
  TIRE_LF_RUMBLE_PITCH: 'TireLF_RumblePitch',
  /** Players LR Tire Sound rumblestrip pitch, Hz */
  TIRE_LR_RUMBLE_PITCH: 'TireLR_RumblePitch',
  /** Players RF Tire Sound rumblestrip pitch, Hz */
  TIRE_RF_RUMBLE_PITCH: 'TireRF_RumblePitch',
  /** Players RR Tire Sound rumblestrip pitch, Hz */
  TIRE_RR_RUMBLE_PITCH: 'TireRR_RumblePitch',
  /** How many tire sets are remaining  255 is unlimited */
  TIRE_SETS_AVAILABLE: 'TireSetsAvailable',
  /** How many tire sets used so far */
  TIRE_SETS_USED: 'TireSetsUsed',
  /** @deprecated set to TrackTempCrew, C */
  TRACK_TEMP: 'TrackTemp',
  /** Temperature of track measured by crew around track, C */
  TRACK_TEMP_CREW: 'TrackTempCrew',
  /** How wet is the average track surface, irsdk_TrackWetness */
  TRACK_WETNESS: 'TrackWetness',
  /** X velocity, m/s */
  VELOCITY_X: 'VelocityX',
  /** X velocity at 360 Hz, m/s */
  VELOCITY_X_ST: 'VelocityX_ST',
  /** Y velocity, m/s */
  VELOCITY_Y: 'VelocityY',
  /** Y velocity at 360 Hz, m/s */
  VELOCITY_Y_ST: 'VelocityY_ST',
  /** Z velocity, m/s */
  VELOCITY_Z: 'VelocityZ',
  /** Z velocity at 360 Hz, m/s */
  VELOCITY_Z_ST: 'VelocityZ_ST',
  /** Vertical acceleration (including gravity), m/s^2 */
  VERT_ACCEL: 'VertAccel',
  /** Vertical acceleration (including gravity) at 360 Hz, m/s^2 */
  VERT_ACCEL_ST: 'VertAccel_ST',
  /** True if video currently being captured */
  VID_CAP_ACTIVE: 'VidCapActive',
  /** True if video capture system is enabled */
  VID_CAP_ENABLED: 'VidCapEnabled',
  /** Engine voltage, V */
  VOLTAGE: 'Voltage',
  /** Engine coolant level, l */
  WATER_LEVEL: 'WaterLevel',
  /** Engine coolant temp, C */
  WATER_TEMP: 'WaterTemp',
  /** The steward says rain tires can be used */
  WEATHER_DECLARED_WET: 'WeatherDeclaredWet',
  /** Wind direction at start/finish line, rad */
  WIND_DIR: 'WindDir',
  /** Wind velocity at start/finish line, m/s */
  WIND_VEL: 'WindVel',
  /** Yaw orientation, rad */
  YAW: 'Yaw',
  /** Yaw orientation relative to north, rad */
  YAW_NORTH: 'YawNorth',
  /** Yaw rate, rad/s */
  YAW_RATE: 'YawRate',
  /** Yaw rate at 360 Hz, rad/s */
  YAW_RATE_ST: 'YawRate_ST',
} as const;

export type VarKey = (typeof VARS)[keyof typeof VARS];

export const SESSION_DATA_KEYS = {
  WEEKEND_INFO: 'WeekendInfo',
  SESSION_INFO: 'SessionInfo',
  CAMERA_INFO: 'CameraInfo',
  RADIO_INFO: 'RadioInfo',
  DRIVER_INFO: 'DriverInfo',
  SPLIT_TIME_INFO: 'SplitTimeInfo',
  CAR_SETUP_INFO: 'CarSetupInfo',
} as const;

export const VAR_TYPE_MAP = ['c', '?', 'i', 'I', 'f', 'd'];

export type SessionDataKey =
  (typeof SESSION_DATA_KEYS)[keyof typeof SESSION_DATA_KEYS];

export type SessionDataValue = {
  DriverInfo: DriverInfo;
  SessionInfo: SessionInfo;
  WeekendInfo: WeekendInfo;
};
