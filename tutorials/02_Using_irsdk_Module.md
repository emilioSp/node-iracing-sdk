# Using the iRacing SDK Module

This guide covers common usage patterns and features of the SDK.

## Table of Contents

1. [Reading Telemetry Data](#reading-telemetry-data)
2. [Session Information](#session-information)
3. [Working with Variables](#working-with-variables)
4. [Broadcast Messages](#broadcast-messages)
5. [Reading Replay Files](#reading-replay-files)
6. [Error Handling](#error-handling)

## Reading Telemetry Data

### Basic Usage

```typescript
import { IRSDK } from 'irsdk';

const ir = new IRSDK();
await ir.startup();

// Read single value
const speed = ir.get('Speed');

// Read array value (e.g., Gear)
const throttle = ir.get('Throttle');

// List all available variables
console.log(ir.varHeadersNamesList);
```

### Real-time Updates

```typescript
const ir = new IRSDK();
await ir.startup();

// Poll for updates
setInterval(() => {
  if (ir.isConnected) {
    const speed = ir.get('Speed');
    const rpm = ir.get('EngineRPM');
    console.log(`Speed: ${speed}, RPM: ${rpm}`);
  }
}, 100); // Update every 100ms
```

## Session Information

Session information is accessed the same way as telemetry, but contains structured data.

### WeekendInfo

```typescript
const weekendInfo = ir.get('WeekendInfo');
console.log('Track Name:', weekendInfo?.TrackDisplayName);
console.log('Series:', weekendInfo?.SeriesName);
console.log('Season:', weekendInfo?.SeasonYear);
```

### SessionInfo

```typescript
const sessionInfo = ir.get('SessionInfo');
sessionInfo?.Sessions?.forEach((session: any) => {
  console.log(`Session: ${session.SessionName}`);
  console.log(`State: ${session.SessionState}`);
});
```

### DriverInfo

```typescript
const driverInfo = ir.get('DriverInfo');
console.log('Your Car Number:', driverInfo?.DriverCarNumber);
console.log('Your Rating:', driverInfo?.DriverRating);

driverInfo?.Drivers?.forEach((driver: any) => {
  console.log(`Driver ${driver.CarNumber}: ${driver.UserName}`);
});
```

## Working with Variables

### Freezing Data

For consistent reads across multiple variables, freeze the buffer:

```typescript
ir.freezeVarBufferLatest();

// All reads now return consistent data
const speed = ir.get('Speed');
const throttle = ir.get('Throttle');
const brake = ir.get('Brake');

// ... process data ...

ir.unfreezeVarBufferLatest();
```

### Available Variables

Some commonly used telemetry variables:

- **Speed** - Current speed (m/s)
- **Throttle** - Throttle input (0-1)
- **Brake** - Brake input (0-1)
- **Steering** - Steering angle
- **Gear** - Current gear
- **EngineRPM** - Engine RPM
- **FuelLevel** - Fuel remaining (L)
- **LapDist** - Distance into lap (m)
- **LapDistPct** - Percentage into lap (0-1)
- **SessionTime** - Current session time (seconds)
- **SessionNum** - Current session number
- **SessionState** - Current session state (see SessionState enum)
- **SessionFlags** - Race flags (see Flags enum)

See the official iRacing SDK documentation for the complete list.

## Broadcast Messages

Send commands to control iRacing programmatically.

### Camera Control

```typescript
import { CameraState } from 'irsdk';

// Switch to car position 0, group 1, camera 0
ir.camSwitchPos(0, 1, 0);

// Switch to driver by number
ir.camSwitchNum('1', 1, 0);

// Set camera state
ir.camSetState(CameraState.cam_tool_active | CameraState.ui_hidden);
```

### Replay Control

```typescript
import { RpySrchMode, RpyPosMode } from 'irsdk';

// Play at 2x speed, normal motion
ir.replaySetPlaySpeed(2, false);

// Slow motion at 0.5x speed
ir.replaySetPlaySpeed(0.5, true);

// Go to start of replay
ir.replaySetPlayPosition(RpyPosMode.begin, 0);

// Search to next lap
ir.replaySearch(RpySrchMode.next_lap);
```

### Pit Commands

```typescript
import { PitCommandMode } from 'irsdk';

// Request pit stop with fuel
ir.pitCommand(PitCommandMode.fuel, 0);

// Change left front tire
ir.pitCommand(PitCommandMode.lf, 0);

// Request fast repair
ir.pitCommand(PitCommandMode.fr);
```

### Chat Commands

```typescript
import { ChatCommandMode } from 'irsdk';

// Open chat window
ir.chatCommand(ChatCommandMode.begin_chat);

// Send macro 5
ir.chatCommandMacro(5);
```

### Telemetry Recording

```typescript
import { TelemCommandMode } from 'irsdk';

// Start recording telemetry
ir.telemCommand(TelemCommandMode.start);

// Stop recording
ir.telemCommand(TelemCommandMode.stop);
```

### Video Capture

```typescript
import { VideoCaptureMode } from 'irsdk';

// Take a screenshot
ir.videoCapture(VideoCaptureMode.trigger_screen_shot);

// Start video recording
ir.videoCapture(VideoCaptureMode.start_video_capture);

// Stop video recording
ir.videoCapture(VideoCaptureMode.end_video_capture);
```

## Reading Replay Files

iRacing saves telemetry data to .ibt files. You can read these files to analyze past sessions.

```typescript
import { IBT } from 'irsdk';

const ibt = new IBT();
ibt.open('path/to/telemetry.ibt');

// Get data at specific index (frame)
const speed = ibt.get(0, 'Speed');

// Get all speed data for the entire session
const allSpeeds = ibt.getAll('Speed');

// Print max speed
const maxSpeed = Math.max(...allSpeeds);
console.log('Max speed:', maxSpeed);

ibt.close();
```

## Error Handling

### Connection Failures

```typescript
const ir = new IRSDK();

const connected = await ir.startup();
if (!connected) {
  console.error('Could not connect to iRacing');
  console.error('Make sure iRacing is running');
  process.exit(1);
}
```

### Handling Null Values

Session info may not be available immediately:

```typescript
const sessionInfo = ir.get('SessionInfo');
if (sessionInfo) {
  console.log('Session info available');
} else {
  console.log('Waiting for session info...');
}
```

### Graceful Shutdown

```typescript
process.on('SIGINT', () => {
  console.log('Shutting down...');
  ir.shutdown();
  process.exit(0);
});
```

## Complete Example

```typescript
import { IRSDK, SessionState } from 'irsdk';

async function main() {
  const ir = new IRSDK();

  if (!await ir.startup()) {
    console.error('Failed to connect to iRacing');
    return;
  }

  console.log('Connected to iRacing');
  console.log('Available variables:', ir.varHeadersNamesList.length);

  // Monitor session
  let lastLap = 0;
  setInterval(() => {
    if (!ir.isConnected) return;

    const speed = ir.get('Speed');
    const gear = ir.get('Gear');
    const rpm = ir.get('EngineRPM');
    const lap = ir.get('LapCount');

    if (lap !== lastLap) {
      console.log(`\nLap ${lap}`);
      lastLap = lap;
    }

    console.log(`Gear: ${gear} | RPM: ${rpm.toFixed(0)} | Speed: ${speed.toFixed(1)} m/s`);
  }, 500);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    ir.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);
```

Next: Check out [03 - Building Applications](./03_Building_Applications.md) for advanced patterns and real-world examples.

