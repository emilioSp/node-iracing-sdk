/**
 * Example: Reading IBT telemetry file
 *
 * This example demonstrates how to:
 * - Open an IBT (iRacing telemetry replay) file
 * - List available telemetry variables
 * - Read the latest telemetry snapshot
 * - Read historical telemetry data across all records
 * - Process specific telemetry values
 */

import IBT from '../src/ibt';

// Path to your IBT file (replace with your actual IBT file path)
const ibtFilePath = './telemetry.ibt';

// Initialize the IBT reader
const ibt = new IBT();

try {
  // Open the IBT file
  console.log(`Opening IBT file: ${ibtFilePath}`);
  ibt.open(ibtFilePath);

  // Get list of available telemetry variables
  const varNames = ibt.varHeadersNamesList;
  console.log('\n--- Available Variables ---');
  console.log(`Total variables: ${varNames?.length}`);
  console.log('First 20 variables:', varNames?.slice(0, 20).join(', '));

  // Get the latest telemetry snapshot
  console.log('\n--- Latest Telemetry Data (Last Record) ---');
  const speed = ibt.operator_getitem('Speed');
  const lap = ibt.operator_getitem('Lap');
  const rpm = ibt.operator_getitem('RPM');
  const throttle = ibt.operator_getitem('Throttle');
  const brake = ibt.operator_getitem('Brake');
  const gear = ibt.operator_getitem('Gear');
  const sessionTime = ibt.operator_getitem('SessionTime');

  console.log(`Speed: ${speed} km/h`);
  console.log(`Lap: ${lap}`);
  console.log(`RPM: ${rpm}`);
  console.log(`Throttle: ${(throttle * 100).toFixed(2)}%`);
  console.log(`Brake: ${(brake * 100).toFixed(2)}%`);
  console.log(`Gear: ${gear}`);
  console.log(`Session Time: ${sessionTime?.toFixed(2)} seconds`);

  // Get all telemetry values for a specific variable across all records
  console.log('\n--- Speed Data Across All Records ---');
  const allSpeeds = ibt.getAll('Speed');
  if (allSpeeds && allSpeeds.length > 0) {
    console.log(`Total records: ${allSpeeds.length}`);
    console.log(`Min speed: ${Math.min(...allSpeeds).toFixed(2)}`);
    console.log(`Max speed: ${Math.max(...allSpeeds).toFixed(2)}`);
    console.log(`Avg speed: ${(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length).toFixed(2)}`);
  }

  // Get specific record at index
  console.log('\n--- Telemetry at Index 100 ---');
  const speedAt100 = ibt.get(100, 'Speed');
  const lapAt100 = ibt.get(100, 'Lap');
  const rpmAt100 = ibt.get(100, 'RPM');
  console.log(`Speed: ${speedAt100} km/h`);
  console.log(`Lap: ${lapAt100}`);
  console.log(`RPM: ${rpmAt100}`);

  // Print throttle data for a sample of records
  console.log('\n--- Sample Throttle Input ---');
  const allThrottles = ibt.getAll('Throttle');
  if (allThrottles && allThrottles.length > 0) {
    console.log('First 5 throttle values:');
    for (let i = 0; i < Math.min(5, allThrottles.length); i++) {
      console.log(`  Record ${i}: ${(allThrottles[i] * 100).toFixed(2)}%`);
    }
    console.log('Last 5 throttle values:');
    for (let i = Math.max(0, allThrottles.length - 5); i < allThrottles.length; i++) {
      console.log(`  Record ${i}: ${(allThrottles[i] * 100).toFixed(2)}%`);
    }
  }

  // Print brake data for a sample of records
  console.log('\n--- Sample Brake Input ---');
  const allBrakes = ibt.getAll('Brake');
  if (allBrakes && allBrakes.length > 0) {
    console.log('First 5 brake values:');
    for (let i = 0; i < Math.min(5, allBrakes.length); i++) {
      console.log(`  Record ${i}: ${(allBrakes[i] * 100).toFixed(2)}%`);
    }
  }

  console.log('\n--- Summary ---');
  console.log('IBT file successfully read and processed!');
} catch (error) {
  console.error('Error reading IBT file:', error);
} finally {
  // Clean up
  ibt.close();
  console.log('IBT file closed.');
}

