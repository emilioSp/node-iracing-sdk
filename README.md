# iRacing SDK for Node.js

Node.js implementation of iRacing SDK. Communicate with iRacing in your Node.js/Electron applications.

The SDK can:

- Get session data (WeekendInfo, SessionInfo, etc...)
- Get live telemetry data (Speed, FuelLevel, etc...)
- Broadcast messages (camera, replay, chat, pit and telemetry commands)

## Install

### Requirements

- Node.js 14+
- Windows (iRacing only runs on Windows)
- npm or yarn

### Setup

```bash
npm install irsdk
```

## Usage

### Basic Example

```typescript
import { IRSDK } from 'irsdk';

const ir = new IRSDK();

// Connect to iRacing
const connected = await ir.startup();

if (connected) {
  // Get telemetry data
  const speed = ir.get('Speed');
  console.log(`Current speed: ${speed}`);

  // Check connection status
  if (ir.isConnected) {
    const fuelLevel = ir.get('FuelLevel');
    console.log(`Fuel level: ${fuelLevel}`);
  }

  // Disconnect
  ir.shutdown();
}
```

### Reading IBT Files

```typescript
import { IBT } from 'irsdk';

const ibt = new IBT();
ibt.open('path/to/telemetry.ibt');

// Get data at specific index
const speed = ibt.get(0, 'Speed');

// Get all data for a variable
const allSpeeds = ibt.getAll('Speed');

ibt.close();
```

### Using Constants

```typescript
import { Flags, SessionState, CameraState } from 'irsdk';

// Check flags
if (flag & Flags.green) {
  console.log('Green flag!');
}

// Check session state
if (sessionState === SessionState.racing) {
  console.log('Currently racing');
}

// Set camera state
ir.camSetState(CameraState.cam_tool_active | CameraState.ui_hidden);
```

Go to [tutorials](tutorials) for more examples and advanced usage.
