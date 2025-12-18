/**
 * Example 2: Real-time Telemetry Monitor
 *
 * Display live telemetry data in the terminal, updated every 100ms
 */

import { IRSDK } from '../src/index';

async function main() {
  const ir = new IRSDK();

  console.log('Connecting to iRacing...');
  const connected = await ir.startup();

  if (!connected) {
    console.error('Failed to connect to iRacing');
    process.exit(1);
  }

  console.log('Connected! Press Ctrl+C to exit\n');

  const updateInterval = setInterval(() => {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      clearInterval(updateInterval);
      process.exit(0);
    }

    // Freeze buffer for consistent reads
    ir.freezeVarBufferLatest();

    const speed = ir.get('Speed') || 0;
    const rpm = ir.get('EngineRPM') || 0;
    const throttle = ir.get('Throttle') || 0;
    const brake = ir.get('Brake') || 0;
    const clutch = ir.get('Clutch') || 0;
    const gear = ir.get('Gear') || 0;
    const fuel = ir.get('FuelLevel') || 0;
    const fuelPerLap = ir.get('FuelUsePerHour') || 0;
    const waterTemp = ir.get('WaterTemp') || 0;
    const oilTemp = ir.get('OilTemp') || 0;
    const lapCount = ir.get('LapCount') || 0;
    const lapDistance = ir.get('LapDist') || 0;

    // Clear screen and display
    console.clear();
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║           IRACING TELEMETRY MONITOR              ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║ Speed:        ${String((speed * 3.6).toFixed(1) + ' km/h').padEnd(32)} ║`);
    console.log(`║ RPM:          ${String(rpm.toFixed(0)).padEnd(32)} ║`);
    console.log(`║ Gear:         ${String(gear === 0 ? 'R' : gear === -1 ? 'N' : gear).padEnd(32)} ║`);
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║ Throttle:     ${String((throttle * 100).toFixed(1) + '%').padEnd(32)} ║`);
    console.log(`║ Brake:        ${String((brake * 100).toFixed(1) + '%').padEnd(32)} ║`);
    console.log(`║ Clutch:       ${String((clutch * 100).toFixed(1) + '%').padEnd(32)} ║`);
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║ Fuel:         ${String(fuel.toFixed(2) + ' L').padEnd(32)} ║`);
    console.log(`║ Fuel/Lap:     ${String((fuelPerLap / 3600).toFixed(2) + ' L/h').padEnd(32)} ║`);
    console.log(`║ Water Temp:   ${String(waterTemp.toFixed(1) + ' °C').padEnd(32)} ║`);
    console.log(`║ Oil Temp:     ${String(oilTemp.toFixed(1) + ' °C').padEnd(32)} ║`);
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║ Lap:          ${String(lapCount + ' (' + (lapDistance * 100).toFixed(1) + '%)').padEnd(32)} ║`);
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

