# iRacing SDK for Node.js

Node.js implementation of iRacing SDK. Communicate with iRacing in your Node.js/Electron applications.

The SDK can:

- Get session data (WeekendInfo, SessionInfo, etc...)
- Get live telemetry data (Speed, FuelLevel, etc...)
- Broadcast messages (camera, replay, chat, pit and telemetry commands)

## Install

### Requirements

- Node.js 24+
- Windows (iRacing only runs on Windows)
- npm or yarn

### Setup

```bash
npm install irsdk
```

## Usage

### Basic Example

```typescript
import { IRSDK, VARS } from 'irsdk';

// Connect to iRacing (throws if iRacing is not running)
const ir = await IRSDK.connect();

// Refresh shared memory before reading telemetry
ir.refreshSharedMemory();

// ir.get() always returns an array; use [0] for scalar variables
const speed = ir.get(VARS.SPEED)[0];
console.log(`Current speed: ${speed}`);

// Check connection status
if (ir.isConnected()) {
  const fuelLevel = ir.get(VARS.FUEL_LEVEL)[0];
  console.log(`Fuel level: ${fuelLevel}`);
}

// Disconnect
ir.shutdown();
```

### Reading IBT Files

```typescript
import { IBT, VARS } from 'irsdk';

const ibt = new IBT();
ibt.open('path/to/telemetry.ibt');

// Get data at specific index
const speed = ibt.get(0, VARS.SPEED);

// Get all data for a variable
const allSpeeds = ibt.getAll(VARS.SPEED);

ibt.close();
```
