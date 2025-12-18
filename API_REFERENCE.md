# API Reference

Complete API documentation for the iRacing SDK for Node.js.

## Table of Contents

- [IRSDK Class](#irsdk-class)
- [IBT Class](#ibt-class)
- [Constants and Enums](#constants-and-enums)
- [Telemetry Variables](#telemetry-variables)
- [Session Information](#session-information)

## IRSDK Class

Main class for connecting to iRacing and reading telemetry/session data.

### Constructor

```typescript
constructor(parseYamlAsync?: boolean)
```

- **parseYamlAsync** (optional, default: false) - Parse YAML session data asynchronously

### Properties

#### `isConnected: boolean`

Returns true if successfully connected to iRacing.

```typescript
if (ir.isConnected) {
  const speed = ir.get('Speed');
}
```

#### `sessionInfoUpdate: number`

Get the current session info update counter. Increases when session data changes.

```typescript
const updateCounter = ir.sessionInfoUpdate;
```

#### `varHeadersNamesList: string[]`

Get array of all available telemetry variable names.

```typescript
const variables = ir.varHeadersNamesList;
console.log(`Available variables: ${variables.length}`);
```

### Methods

#### `startup(testFile?: string, dumpTo?: string): Promise<boolean>`

Connect to iRacing. Returns true if successful.

**Parameters:**
- `testFile` (optional) - Path to a .ibt file for testing (instead of connecting to live iRacing)
- `dumpTo` (optional) - Dump the shared memory to a file for debugging

**Returns:** Promise that resolves to boolean

```typescript
const connected = await ir.startup();
if (!connected) {
  console.error('Failed to connect to iRacing');
}
```

#### `shutdown(): void`

Disconnect from iRacing.

```typescript
ir.shutdown();
```

#### `get(key: string): any`

Get telemetry or session data value by key.

**Parameters:**
- `key` - Name of the telemetry variable or session info section

**Returns:** The requested value, or undefined if not found

```typescript
const speed = ir.get('Speed');
const weekendInfo = ir.get('WeekendInfo');
```

#### `freezeVarBufferLatest(): void`

Freeze the telemetry buffer to ensure all subsequent reads return consistent data. Call `unfreezeVarBufferLatest()` when done.

```typescript
ir.freezeVarBufferLatest();
const speed = ir.get('Speed');
const rpm = ir.get('EngineRPM');
ir.unfreezeVarBufferLatest();
// speed and rpm are from the same data frame
```

#### `unfreezeVarBufferLatest(): void`

Unfreeze the telemetry buffer.

```typescript
ir.unfreezeVarBufferLatest();
```

#### `getSessionInfoUpdateByKey(key: string): number | null`

Get the update counter for a specific session info key.

```typescript
const updateNum = ir.getSessionInfoUpdateByKey('SessionInfo');
```

### Broadcast Message Methods

These methods send commands to iRacing (Windows only).

#### `camSwitchPos(position?: number, group?: number, camera?: number): boolean`

Switch camera by car position.

```typescript
ir.camSwitchPos(0, 1, 0); // Switch to car 0, group 1, camera 0
```

#### `camSwitchNum(carNumber?: string | number, group?: number, camera?: number): boolean`

Switch camera by car number.

```typescript
ir.camSwitchNum('1', 1, 0); // Switch to car #1
```

#### `camSetState(cameraState?: number): boolean`

Set camera state flags.

```typescript
import { CameraState } from 'irsdk';
ir.camSetState(CameraState.cam_tool_active | CameraState.ui_hidden);
```

#### `replaySetPlaySpeed(speed?: number, slowMotion?: boolean): boolean`

Set replay playback speed.

```typescript
ir.replaySetPlaySpeed(2, false);      // 2x speed
ir.replaySetPlaySpeed(0.5, true);     // 0.5x slow motion
```

#### `replaySetPlayPosition(posMode?: number, frameNum?: number): boolean`

Set replay position.

```typescript
import { RpyPosMode } from 'irsdk';
ir.replaySetPlayPosition(RpyPosMode.begin, 0);    // Go to start
ir.replaySetPlayPosition(RpyPosMode.current, 100); // Go to frame 100
```

#### `replaySearch(searchMode?: number): boolean`

Search through replay.

```typescript
import { RpySrchMode } from 'irsdk';
ir.replaySearch(RpySrchMode.next_lap);      // Next lap
ir.replaySearch(RpySrchMode.prev_incident); // Previous incident
```

#### `replaySetState(stateMode?: number): boolean`

Set replay state.

```typescript
import { RpyStateMode } from 'irsdk';
ir.replaySetState(RpyStateMode.erase_tape); // Clear replay
```

#### `reloadAllTextures(): boolean`

Reload all textures.

```typescript
ir.reloadAllTextures();
```

#### `reloadTexture(carIdx?: number): boolean`

Reload textures for specific car.

```typescript
ir.reloadTexture(5); // Reload car 5 textures
```

#### `chatCommand(chatCommandMode?: number): boolean`

Send chat command.

```typescript
import { ChatCommandMode } from 'irsdk';
ir.chatCommand(ChatCommandMode.begin_chat);
ir.chatCommand(ChatCommandMode.reply);
```

#### `chatCommandMacro(macroNum?: number): boolean`

Send chat macro.

```typescript
ir.chatCommandMacro(5); // Send macro #5
```

#### `pitCommand(pitCommandMode?: number, variable?: number): boolean`

Send pit command.

```typescript
import { PitCommandMode } from 'irsdk';
ir.pitCommand(PitCommandMode.fuel, 0);  // Request fuel
ir.pitCommand(PitCommandMode.lf, 0);    // Change left front tire
ir.pitCommand(PitCommandMode.fr);       // Request fast repair
```

#### `telemCommand(telemCommandMode?: number): boolean`

Control telemetry recording.

```typescript
import { TelemCommandMode } from 'irsdk';
ir.telemCommand(TelemCommandMode.start);   // Start recording
ir.telemCommand(TelemCommandMode.stop);    // Stop recording
```

#### `ffbCommand(ffbCommandMode?: number, value?: number): boolean`

Set force feedback parameters.

```typescript
import { FFBCommandMode } from 'irsdk';
ir.ffbCommand(FFBCommandMode.ffb_command_max_force, 150);
```

#### `replaySearchSessionTime(sessionNum?: number, sessionTimeMs?: number): boolean`

Search replay by session time.

```typescript
ir.replaySearchSessionTime(0, 30000); // Go to 30 seconds into session 0
```

#### `videoCapture(videoCaptureMode?: number): boolean`

Control video capture.

```typescript
import { VideoCaptureMode } from 'irsdk';
ir.videoCapture(VideoCaptureMode.trigger_screen_shot);
ir.videoCapture(VideoCaptureMode.start_video_capture);
ir.videoCapture(VideoCaptureMode.end_video_capture);
```

---

## IBT Class

Reader for iRacing replay files (.ibt format).

### Constructor

```typescript
constructor()
```

### Properties

#### `fileName: string | null`

Get the currently open IBT file path.

```typescript
const path = ibt.fileName;
```

#### `varHeaderBufferTick: number | null`

Get the tick count from the header.

```typescript
const tick = ibt.varHeaderBufferTick;
```

#### `varHeadersNamesList: string[] | null`

Get list of available variables in the file.

```typescript
const variables = ibt.varHeadersNamesList;
```

### Methods

#### `open(ibtFilePath: string): void`

Open an IBT file.

```typescript
const ibt = new IBT();
ibt.open('telemetry.ibt');
```

#### `close(): void`

Close the IBT file.

```typescript
ibt.close();
```

#### `get(index: number, key: string): any`

Get telemetry value at specific frame index.

```typescript
const speedAtFrame100 = ibt.get(100, 'Speed');
```

#### `getAll(key: string): any[] | null`

Get all values for a variable across all frames.

```typescript
const allSpeeds = ibt.getAll('Speed');
const maxSpeed = Math.max(...allSpeeds);
```

---

## Constants and Enums

### StatusField

```typescript
StatusField.status_connected
```

### EngineWarnings

```typescript
EngineWarnings.water_temp_warning
EngineWarnings.fuel_pressure_warning
EngineWarnings.oil_pressure_warning
EngineWarnings.engine_stalled
EngineWarnings.pit_speed_limiter
EngineWarnings.rev_limiter_active
EngineWarnings.oil_temp_warning
```

### Flags

Racing flags:

```typescript
Flags.checkered
Flags.white
Flags.green
Flags.yellow
Flags.red
Flags.blue
Flags.debris
Flags.crossed
Flags.yellow_waving
Flags.one_lap_to_green
Flags.green_held
Flags.ten_to_go
Flags.five_to_go
Flags.random_waving
Flags.caution
Flags.caution_waving
Flags.black
Flags.disqualify
Flags.servicible
Flags.furled
Flags.repair
Flags.start_hidden
Flags.start_ready
Flags.start_set
Flags.start_go
```

### SessionState

```typescript
SessionState.invalid
SessionState.get_in_car
SessionState.warmup
SessionState.parade_laps
SessionState.racing
SessionState.checkered
SessionState.cool_down
```

### CameraState

```typescript
CameraState.is_session_screen
CameraState.is_scenic_active
CameraState.cam_tool_active
CameraState.ui_hidden
CameraState.use_auto_shot_selection
CameraState.use_temporary_edits
CameraState.use_key_acceleration
CameraState.use_key10x_acceleration
CameraState.use_mouse_aim_mode
```

### TrkLoc (Track Location)

```typescript
TrkLoc.not_in_world
TrkLoc.off_track
TrkLoc.in_pit_stall
TrkLoc.aproaching_pits
TrkLoc.on_track
```

### TrkSurf (Track Surface)

```typescript
TrkSurf.not_in_world
TrkSurf.undefined
TrkSurf.asphalt_1 through asphalt_4
TrkSurf.concrete_1 through concrete_2
TrkSurf.racing_dirt_1 through racing_dirt_2
TrkSurf.paint_1 through paint_2
TrkSurf.rumble_1 through rumble_4
TrkSurf.grass_1 through grass_4
TrkSurf.dirt_1 through dirt_4
TrkSurf.sand
TrkSurf.gravel_1 through gravel_2
TrkSurf.grasscrete
TrkSurf.astroturf
```

And many more - see `src/constants.ts` for the complete list.

---

## Telemetry Variables

Common telemetry variables available via `ir.get()`:

### Speed and Motion

- **Speed** - Current speed (m/s)
- **EngineRPM** - Engine RPM
- **Throttle** - Throttle input (0-1)
- **Brake** - Brake input (0-1)
- **Clutch** - Clutch input (0-1)
- **Steering** - Steering input (-1 to 1)
- **Gear** - Current gear (0=park, -1=reverse, 1-9=forward)

### Temperature and Pressures

- **WaterTemp** - Engine water temperature (°C)
- **OilTemp** - Engine oil temperature (°C)
- **FuelTemp** - Fuel temperature (°C)
- **OilPressure** - Oil pressure (bar)
- **WaterPressure** - Water pressure (bar)

### Fuel

- **FuelLevel** - Fuel remaining (L)
- **FuelUsePerHour** - Current fuel consumption rate
- **FuelPerLap** - Estimated fuel per lap

### Lap Data

- **LapCount** - Total laps completed
- **LapDist** - Distance into current lap (m)
- **LapDistPct** - Percentage into current lap (0-1)
- **LapBestTime** - Best lap time of session
- **LapBestLapNum** - Lap number of best lap
- **LastLapTime** - Time of last completed lap

### Session

- **SessionNum** - Current session number
- **SessionState** - Current session state
- **SessionFlags** - Current race flags
- **SessionTime** - Current session time (seconds)
- **SessionTimeRemain** - Time remaining in session

### Driver Info

- **DriverCarIdx** - Index of driver's car
- **DriverCarNumber** - Driver's car number
- **DriverCarClass** - Driver's car class

### Track

- **TrackTemp** - Track temperature (°C)
- **TrackWetness** - Track surface wetness
- **Skies** - Sky conditions
- **AirDensity** - Air density
- **AirPressure** - Air pressure
- **WindVel** - Wind velocity (m/s)
- **RelativeHumidity** - Relative humidity (%)

For a complete list of telemetry variables, check the iRacing SDK documentation or use `ir.varHeadersNamesList` to see what's available.

---

## Session Information

Structured data accessed via `ir.get()`:

### WeekendInfo

```typescript
const weekendInfo = ir.get('WeekendInfo');
// Properties: TrackID, TrackDisplayName, SeriesID, SeriesName, SeasonYear, etc.
```

### SessionInfo

```typescript
const sessionInfo = ir.get('SessionInfo');
// Array of sessions with: SessionName, SessionNum, SessionType, SessionTime, etc.
```

### DriverInfo

```typescript
const driverInfo = ir.get('DriverInfo');
// Contains driver list and your car info
// Properties: DriverCarNumber, DriverRating, Drivers (array), etc.
```

### Telemetry

For telemetry replay files (.ibt), use the IBT class:

```typescript
const ibt = new IBT();
ibt.open('telemetry.ibt');
const speed = ibt.get(0, 'Speed');
```

---
