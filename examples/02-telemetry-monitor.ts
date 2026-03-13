/**
 * Example 2: Real-time Telemetry Monitor
 *
 * Display live telemetry data in the terminal, updated every 100ms
 */

import { IRSDK } from '../src/irsdk.ts';
import { VARS } from '../src/vars.ts';

async function main() {
  console.log('Connecting to iRacing...');
  const ir = await IRSDK.connect();
  console.log('Connected! Press Ctrl+C to exit\n');

  const updateInterval = setInterval(() => {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      clearInterval(updateInterval);
      process.exit(0);
    }

    // Freeze buffer for consistent reads
    ir.freezeVarBufferLatest();

    const speed = ir.get(VARS.SPEED) || 0;
    const rpm = ir.get(VARS.RPM) || 0;
    const throttle = ir.get(VARS.THROTTLE) || 0;
    const brake = ir.get(VARS.BRAKE) || 0;
    const gear = ir.get(VARS.GEAR) || 0;
    const fuel = ir.get(VARS.FUEL_LEVEL) || 0;
    const fuelPerLap = ir.get(VARS.FUEL_USE_PER_HOUR) || 0;
    const lapCount = ir.get(VARS.LAP) || 0;
    const lapDistance = ir.get(VARS.LAP_DIST) || 0;

    // Clear screen and display
    console.clear();
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║           IRACING TELEMETRY MONITOR              ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(
      `║ Speed:        ${String(`${(speed * 3.6).toFixed(1)} km/h`).padEnd(32)} ║`,
    );
    console.log(`║ RPM:          ${String(rpm.toFixed(0)).padEnd(32)} ║`);
    console.log(
      `║ Gear:         ${String(gear === 0 ? 'R' : gear === -1 ? 'N' : gear).padEnd(32)} ║`,
    );
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(
      `║ Throttle:     ${String(`${(throttle * 100).toFixed(1)}%`).padEnd(32)} ║`,
    );
    console.log(
      `║ Brake:        ${String(`${(brake * 100).toFixed(1)}%`).padEnd(32)} ║`,
    );
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(
      `║ Fuel:         ${String(`${fuel.toFixed(2)} L`).padEnd(32)} ║`,
    );
    console.log(
      `║ Fuel/Lap:     ${String(`${(fuelPerLap / 3600).toFixed(2)} L/h`).padEnd(32)} ║`,
    );
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(
      `║ Lap:          ${String(`${lapCount} (${(lapDistance * 100).toFixed(1)}%)`).padEnd(32)} ║`,
    );
    console.log('╚═══════════════════════════════════════════════════╝');

    ir.unfreezeVarBufferLatest();
  }, 100);

  process.on('SIGINT', () => {
    clearInterval(updateInterval);
    ir.shutdown();
    console.log('\nShutdown complete');
    process.exit(0);
  });
}

main().catch(console.error);
