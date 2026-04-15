# iRacing SDK for Node.js

Node.js implementation of the iRacing SDK. Communicate with iRacing in your Node.js/Electron applications.

The SDK can:

- Read live telemetry data (Speed, FuelLevel, RPM, etc.)
- Read session data (WeekendInfo, DriverInfo, SessionInfo, etc.)
- Parse `.ibt` telemetry replay files

## Prerequisites

- Node.js 24+
- Windows (iRacing only runs on Windows)
- npm

## Install

```bash
npm install @emiliosp/node-iracing-sdk
```

## Usage

### Live Telemetry

```typescript
import { IRSDK, SESSION_DATA_KEYS, VARS } from '@emiliosp/node-iracing-sdk';

// Connect to iRacing (throws if iRacing is not running)
const ir = await IRSDK.connect();

// Refresh shared memory before reading telemetry
ir.refreshSharedMemory();

// ir.get() always returns an array; use [0] for scalar variables
const speed = ir.get(VARS.SPEED)[0];
console.log(`Speed: ${speed} m/s`);

// Read session data
const weekendInfo = ir.getSessionInfo(SESSION_DATA_KEYS.WEEKEND_INFO);
console.log(`Track: ${weekendInfo.TrackDisplayName}`);

const driverInfo = ir.getSessionInfo(SESSION_DATA_KEYS.DRIVER_INFO);
console.log(`Driver: ${driverInfo.Drivers[0].UserName}`);

// Disconnect
ir.shutdown();
```

### Reading IBT Files

```typescript
import { IBT } from '@emiliosp/node-iracing-sdk';

const ibt = new IBT();
ibt.open('path/to/telemetry.ibt');

// List available variables
console.log(ibt.varHeadersNamesList);

// Get data at a specific record index
const speed = ibt.get(0, 'Speed');

// Get all records for a variable
const allSpeeds = ibt.getAll('Speed');

ibt.close();
```