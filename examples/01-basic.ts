/**
 * Example 1: Basic Telemetry Reader
 *
 * This is the simplest example - connect to iRacing and read some telemetry data
 */

import { IRSDK } from '../src/index';

async function main() {
  const ir = new IRSDK();

  console.log('Connecting to iRacing...');
  const connected = await ir.startup();

  if (!connected) {
    console.error('Failed to connect to iRacing. Make sure iRacing is running!');
    process.exit(1);
  }

  console.log('✓ Connected to iRacing');
  console.log(`Available telemetry variables: ${ir.varHeadersNamesList.length}\n`);

  // Read some telemetry data
  console.log('=== Current Telemetry ===');
  console.log(`Speed: ${ir.get('Speed')?.toFixed(2) || 'N/A'} m/s`);
  console.log(`RPM: ${ir.get('EngineRPM')?.toFixed(0) || 'N/A'}`);
  console.log(`Gear: ${ir.get('Gear') || 'N/A'}`);
  console.log(`Throttle: ${((ir.get('Throttle') || 0) * 100).toFixed(1)}%`);
  console.log(`Brake: ${((ir.get('Brake') || 0) * 100).toFixed(1)}%`);
  console.log(`Fuel: ${ir.get('FuelLevel')?.toFixed(2) || 'N/A'} L`);

  // Read session data
  console.log('\n=== Session Data ===');
  const weekendInfo = ir.get('WeekendInfo');
  console.log(`Track: ${weekendInfo?.TrackDisplayName || 'N/A'}`);
  console.log(`Series: ${weekendInfo?.SeriesName || 'N/A'}`);

  // Clean up
  ir.shutdown();
  console.log('\n✓ Disconnected');
}

main().catch(console.error);

