/**
 * Example 1: Basic Telemetry Reader
 *
 * This is the simplest example - connect to iRacing and read some telemetry data
 */

import { IRSDK } from '../src/irsdk.ts';
import { SESSION_DATA_KEYS, VARS } from '../src/vars.ts';

async function main() {
  console.log('Connecting to iRacing...');
  const ir = await IRSDK.connect();
  console.log('✓ Connected to iRacing');
  console.log(
    `Available telemetry variables: ${ir.getVarHeadersNamesList().length}\n`,
  );

  console.log('Telemetry variable', ir.getVarHeadersNamesList().join());

  // Read some telemetry data
  console.log('=== Current Telemetry ===');
  console.log(`Speed: ${ir.get(VARS.SPEED)?.toFixed(2) || 'N/A'} m/s`);
  console.log(`RPM: ${ir.get(VARS.RPM)?.toFixed(0) || 'N/A'}`);
  console.log(`Gear: ${ir.get(VARS.GEAR) || 'N/A'}`);
  console.log(`Throttle: ${((ir.get(VARS.THROTTLE) || 0) * 100).toFixed(1)}%`);
  console.log(`Brake: ${((ir.get(VARS.BRAKE) || 0) * 100).toFixed(1)}%`);
  console.log(`Fuel: ${ir.get(VARS.FUEL_LEVEL)?.toFixed(2) || 'N/A'} L`);

  // Read session data
  console.log('\n=== Session Data ===');
  const weekendInfo = ir.getSessionInfo(SESSION_DATA_KEYS.WEEKEND_INFO);
  console.log(`Track: ${weekendInfo.TrackDisplayName || 'N/A'}`);
  console.log(
    `Telemetry disk file name: ${weekendInfo.TelemetryOptions.TelemetryDiskFile || 'N/A'}`,
  );

  const driverInfo = ir.getSessionInfo(SESSION_DATA_KEYS.DRIVER_INFO);
  const driver = driverInfo?.Drivers?.[0];
  console.log(`Driver: ${driver?.UserName || 'N/A'}`);
  console.log(`iRating: ${driver?.IRating || 'N/A'}`);

  // Clean up
  ir.shutdown();
  console.log('\n✓ Disconnected');
}

main().catch(console.error);
