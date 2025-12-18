# Building Applications with iRacing SDK

Learn how to build real-world applications using the iRacing SDK for Node.js.

## Project Setup

### Initialize a new project

```bash
mkdir my-iracing-app
cd my-iracing-app
npm init -y
npm install irsdk
npm install -D typescript ts-node @types/node
npx tsc --init
```

### TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Common Patterns

### 1. Real-time Telemetry Monitor

Create a dashboard that displays live telemetry data:

```typescript
import { IRSDK } from 'irsdk';
import * as readline from 'readline';

class TelemetryMonitor {
  private ir: IRSDK;
  private isRunning: boolean = false;

  constructor() {
    this.ir = new IRSDK();
  }

  async start() {
    const connected = await this.ir.startup();
    if (!connected) {
      console.error('Failed to connect to iRacing');
      return;
    }

    console.clear();
    console.log('Connected to iRacing - Telemetry Monitor');
    console.log('Press Ctrl+C to exit\n');

    this.isRunning = true;

    const updateInterval = setInterval(() => {
      if (!this.ir.isConnected) {
        console.log('Disconnected from iRacing');
        clearInterval(updateInterval);
        process.exit(0);
      }

      this.displayTelemetry();
    }, 100);
  }

  private displayTelemetry() {
    this.ir.freezeVarBufferLatest();

    const speed = this.ir.get('Speed');
    const rpm = this.ir.get('EngineRPM');
    const throttle = this.ir.get('Throttle');
    const brake = this.ir.get('Brake');
    const gear = this.ir.get('Gear');
    const fuel = this.ir.get('FuelLevel');
    const temp = this.ir.get('WaterTemp');

    // Clear and display
    console.clear();
    console.log('╔════════════════════════════════════╗');
    console.log(`║ Speed:  ${speed.toFixed(1).padStart(6)} m/s            ║`);
    console.log(`║ RPM:    ${rpm.toFixed(0).padStart(6)}                ║`);
    console.log(`║ Gear:   ${String(gear).padStart(6)}                ║`);
    console.log(`║ Throttle: ${(throttle * 100).toFixed(0).padStart(5)}%              ║`);
    console.log(`║ Brake:    ${(brake * 100).toFixed(0).padStart(5)}%              ║`);
    console.log(`║ Fuel:   ${fuel.toFixed(2).padStart(6)} L             ║`);
    console.log(`║ Temp:   ${temp.toFixed(1).padStart(6)} °C            ║`);
    console.log('╚════════════════════════════════════╝');

    this.ir.unfreezeVarBufferLatest();
  }
}

const monitor = new TelemetryMonitor();
monitor.start();

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
```

### 2. Lap Time Analyzer

Track lap times and analyze performance:

```typescript
import { IRSDK } from 'irsdk';

interface LapData {
  lapNumber: number;
  lapTime: number;
  bestLapTime: number;
  averageSpeed: number;
  fuelUsed: number;
}

class LapAnalyzer {
  private ir: IRSDK;
  private lapData: LapData[] = [];
  private previousLap: number = 0;
  private lapStartFuel: number = 0;

  constructor() {
    this.ir = new IRSDK();
  }

  async start() {
    const connected = await this.ir.startup();
    if (!connected) {
      console.error('Failed to connect to iRacing');
      return;
    }

    console.log('Lap Analyzer started. Go complete a lap!');

    const updateInterval = setInterval(() => {
      if (!this.ir.isConnected) {
        clearInterval(updateInterval);
        this.printReport();
        process.exit(0);
      }

      this.checkForLapCompletion();
    }, 100);
  }

  private checkForLapCompletion() {
    const lapCount = this.ir.get('LapCount');
    const lapTime = this.ir.get('LastLapTime');
    const fuel = this.ir.get('FuelLevel');
    const speed = this.ir.get('Speed');

    if (lapCount > this.previousLap && lapTime > 0) {
      const lapData: LapData = {
        lapNumber: lapCount,
        lapTime: lapTime,
        bestLapTime: this.ir.get('SessionBestLapTime'),
        averageSpeed: speed,
        fuelUsed: this.lapStartFuel - fuel,
      };

      this.lapData.push(lapData);
      this.previousLap = lapCount;

      console.log(`
Lap ${lapData.lapNumber} complete
Time: ${this.formatTime(lapData.lapTime)}
Best: ${this.formatTime(lapData.bestLapTime)}
Avg Speed: ${lapData.averageSpeed.toFixed(1)} m/s
Fuel Used: ${lapData.fuelUsed.toFixed(2)}L
      `);

      this.lapStartFuel = fuel;
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`;
  }

  private printReport() {
    console.log('\n=== Lap Report ===');
    console.log('Lap | Time      | Gap to Best | Avg Speed');
    console.log('----+-----------+------------+-----------');

    let bestLap = Infinity;
    this.lapData.forEach((lap) => {
      if (lap.lapTime < bestLap) {
        bestLap = lap.lapTime;
      }
    });

    this.lapData.forEach((lap) => {
      const gap = lap.lapTime - bestLap;
      console.log(
        `${String(lap.lapNumber).padStart(3)} | ${this.formatTime(lap.lapTime)} | +${gap.toFixed(3).padStart(8)} | ${lap.averageSpeed.toFixed(1).padStart(8)} m/s`
      );
    });

    console.log('\nBest Lap:', this.formatTime(bestLap));
  }
}

const analyzer = new LapAnalyzer();
analyzer.start();

process.on('SIGINT', () => {
  console.log('\nFinishing analysis...');
});
```

### 3. Telemetry Data Logger

Log telemetry to a CSV file for analysis:

```typescript
import { IRSDK } from 'irsdk';
import * as fs from 'fs';

class TelemetryLogger {
  private ir: IRSDK;
  private logFile: fs.WriteStream;

  constructor(filename: string) {
    this.ir = new IRSDK();
    this.logFile = fs.createWriteStream(filename, { flags: 'a' });
  }

  async start() {
    const connected = await this.ir.startup();
    if (!connected) {
      console.error('Failed to connect to iRacing');
      return;
    }

    // Write header
    const variables = ['Time', 'Speed', 'RPM', 'Throttle', 'Brake', 'Gear', 'Fuel'];
    this.logFile.write(variables.join(',') + '\n');

    console.log('Logging telemetry data...');

    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      if (!this.ir.isConnected) {
        clearInterval(updateInterval);
        this.logFile.end();
        console.log('Logging complete');
        process.exit(0);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const speed = this.ir.get('Speed');
      const rpm = this.ir.get('EngineRPM');
      const throttle = this.ir.get('Throttle');
      const brake = this.ir.get('Brake');
      const gear = this.ir.get('Gear');
      const fuel = this.ir.get('FuelLevel');

      const line = [elapsed.toFixed(3), speed, rpm, throttle, brake, gear, fuel.toFixed(2)].join(',');
      this.logFile.write(line + '\n');
    }, 100);
  }
}

const logger = new TelemetryLogger('telemetry.csv');
logger.start();

process.on('SIGINT', () => {
  console.log('\nShutting down...');
});
```

### 4. Multi-Driver Race Monitor

Monitor multiple drivers in a race:

```typescript
import { IRSDK } from 'irsdk';

class RaceMonitor {
  private ir: IRSDK;
  private driverCache: Map<number, any> = new Map();

  constructor() {
    this.ir = new IRSDK();
  }

  async start() {
    const connected = await this.ir.startup();
    if (!connected) {
      console.error('Failed to connect to iRacing');
      return;
    }

    console.log('Race Monitor started');

    const updateInterval = setInterval(() => {
      if (!this.ir.isConnected) {
        clearInterval(updateInterval);
        process.exit(0);
      }

      this.updateRaceStatus();
    }, 500);
  }

  private updateRaceStatus() {
    const driverInfo = this.ir.get('DriverInfo');
    if (!driverInfo || !driverInfo.Drivers) return;

    console.clear();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║ Driver Position Report                                     ║');
    console.log('╠════════════════════════════════════════════════════════════╣');

    // Sort drivers by position
    const sortedDrivers = [...driverInfo.Drivers]
      .filter((d: any) => d.CarIdx >= 0)
      .sort((a: any, b: any) => (a.Position ?? 0) - (b.Position ?? 0));

    sortedDrivers.slice(0, 10).forEach((driver: any, index: number) => {
      const name = (driver.UserName || 'Unknown').padEnd(20);
      const car = (driver.CarNumber || '?').padEnd(4);
      const lap = (driver.LapCount ?? 0).toString().padStart(3);
      console.log(`║ ${String(index + 1).padEnd(2)} | ${name} | Car ${car} | Lap ${lap} ║`);
    });

    console.log('╚════════════════════════════════════════════════════════════╝');
  }
}

const monitor = new RaceMonitor();
monitor.start();

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
```

## Building for Production

### Create a build script

Update `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  }
}
```

### Package as executable

Use `pkg` to create a standalone executable:

```bash
npm install -D pkg
npx pkg --targets win-x64 dist/index.js --output iracing-app
```

## Tips and Best Practices

1. **Always check `isConnected`** before reading data
2. **Use `freezeVarBufferLatest()`** when reading multiple variables for consistency
3. **Handle graceful shutdown** with `SIGINT` signal
4. **Log important events** for debugging
5. **Cache expensive computations** like driver lookups
6. **Use TypeScript** for type safety and better IDE support
7. **Test with iRacing running** to catch connection issues early
8. **Monitor memory usage** for long-running applications

## Deployment

- Ensure Node.js is installed on the target Windows machine
- Bundle with your application or provide installation instructions
- Consider using tools like `electron` for desktop applications
- Use `pkg` to create portable executables

Next, explore more advanced topics in the [API Reference](../README.md) or check out example applications in the `examples/` directory.

