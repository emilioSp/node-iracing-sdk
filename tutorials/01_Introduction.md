# Getting Started with iRacing SDK for Node.js

This is the quickest way to see the SDK in action.

## Prerequisites

1. [Node.js 14+](https://nodejs.org) installed
2. iRacing game installed and running
3. npm or yarn

## Installation

```bash
npm install irsdk
```

## Your First Program

Create a file called `test.ts`:

```typescript
import { IRSDK } from 'irsdk';

async function main() {
  const ir = new IRSDK();

  // Connect to iRacing
  const connected = await ir.startup();

  if (!connected) {
    console.log('Failed to connect to iRacing');
    return;
  }

  console.log('Connected to iRacing!');

  // Get some telemetry data
  const speed = ir.get('Speed');
  const fuel = ir.get('FuelLevel');
  const rpm = ir.get('EngineWarnings');

  console.log(`Speed: ${speed} m/s`);
  console.log(`Fuel: ${fuel} L`);
  console.log(`Engine Warnings: ${rpm}`);

  // Disconnect
  ir.shutdown();
}

main().catch(console.error);
```

Compile and run with TypeScript:

```bash
npx tsc --init  # Create tsconfig.json if you don't have one
npx tsc test.ts
node test.js
```

Or run directly with ts-node:

```bash
npx ts-node test.ts
```

## What's Next?

- Check [02 - Using irsdk Module](./02_Using_irsdk_Module.md) for more advanced usage
- Read [03 - Building Applications](./03_Building_Applications.md) for real-world examples
- Look at the `examples/` directory for complete sample applications

## Key Concepts

### Connecting to iRacing

Always use `await ir.startup()` to connect:

```typescript
const connected = await ir.startup();
if (connected) {
  // You're ready to use the SDK
}
```

### Reading Telemetry Data

Get any telemetry variable by name using the `get()` method:

```typescript
const speed = ir.get('Speed');
const throttle = ir.get('Throttle');
const brake = ir.get('Brake');
```

### Session Information

Session information (WeekendInfo, SessionInfo, etc.) is also accessed via `get()`:

```typescript
const weekendInfo = ir.get('WeekendInfo');
const sessionInfo = ir.get('SessionInfo');
```

### Checking Connection Status

```typescript
if (ir.isConnected) {
  console.log('Still connected to iRacing');
}
```

### Broadcast Commands

Send commands to iRacing:

```typescript
// Switch camera
ir.camSwitchPos(0, 1, 0);

// Play at 2x speed
ir.replaySetPlaySpeed(2, false);

// Clear pit checkboxes
ir.pitCommand(PitCommandMode.clear);
```

## Tips

- iRacing data updates frequently. Consider using intervals or event listeners for real-time updates
- Check `ir.isConnected` before reading data to ensure it's valid
- Use TypeScript for better IDE autocomplete and type safety
- See what telemetry variables are available in the official iRacing documentation

Happy racing! 🏁

