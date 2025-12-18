/**
 * Example 3: Lap Timer
 *
 * Track lap times and show best lap, average, and improvement
 */

import { IRSDK } from '../src/index';

interface LapRecord {
  lapNumber: number;
  time: number;
  timestamp: Date;
}

async function main() {
  const ir = new IRSDK();

  console.log('Connecting to iRacing...');
  const connected = await ir.startup();

  if (!connected) {
    console.error('Failed to connect to iRacing');
    process.exit(1);
  }

  console.log('Connected! Waiting for laps...\n');

  const laps: LapRecord[] = [];
  let lastLapCount = -1;

  const updateInterval = setInterval(() => {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      clearInterval(updateInterval);
      process.exit(0);
    }

    const lapCount = ir.get('LapCount') || 0;
    const lastLapTime = ir.get('LastLapTime') || 0;
    const sessionBestLapTime = ir.get('SessionBestLapTime') || 0;
    const personalBestLapTime = ir.get('PersonalBestLapTime') || 0;

    // Check if we completed a new lap
    if (lapCount > lastLapCount && lastLapTime > 0) {
      lastLapCount = lapCount;

      const lapRecord: LapRecord = {
        lapNumber: lapCount,
        time: lastLapTime,
        timestamp: new Date(),
      };

      laps.push(lapRecord);

      // Calculate statistics
      const bestLap = Math.min(...laps.map((l) => l.time));
      const lastLap = laps[laps.length - 1].time;
      const avgLap = laps.reduce((sum, l) => sum + l.time, 0) / laps.length;
      const improvement = bestLap - lastLap;

      console.clear();
      console.log('╔════════════════════════════════════════════╗');
      console.log('║          LAP TIMER                         ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║ Total Laps: ${String(laps.length).padEnd(32)} ║`);
      console.log(`║                                            ║`);
      console.log(`║ Last Lap:    ${formatTime(lastLap).padEnd(32)} ║`);
      console.log(`║ Best Lap:    ${formatTime(bestLap).padEnd(32)} ║`);
      console.log(`║ Avg Lap:     ${formatTime(avgLap).padEnd(32)} ║`);
      console.log('╠════════════════════════════════════════════╣');

      if (improvement > 0) {
        console.log(
          `║ Status:      ${`IMPROVED by ${formatTime(improvement)}`.padEnd(32)} ║`
        );
      } else if (improvement < 0) {
        console.log(
          `║ Status:      ${`SLOWER by ${formatTime(-improvement)}`.padEnd(32)} ║`
        );
      } else {
        console.log(`║ Status:      ${`EQUAL TO BEST`.padEnd(32)} ║`);
      }

      console.log('╠════════════════════════════════════════════╣');
      console.log('║ Recent Laps:                               ║');
      const recentLaps = laps.slice(-5).reverse();
      recentLaps.forEach((lap, i) => {
        const lapStr = `Lap ${lap.lapNumber}: ${formatTime(lap.time)}`;
        console.log(`║   ${lapStr.padEnd(40)} ║`);
      });

      console.log('╚════════════════════════════════════════════╝');
    }
  }, 100);

  process.on('SIGINT', () => {
    clearInterval(updateInterval);

    if (laps.length > 0) {
      console.log('\n╔════════════════════════════════════════════╗');
      console.log('║          SESSION SUMMARY                   ║');
      console.log('╠════════════════════════════════════════════╣');
      const bestLap = Math.min(...laps.map((l) => l.time));
      const avgLap = laps.reduce((sum, l) => sum + l.time, 0) / laps.length;
      console.log(`║ Total Laps:  ${String(laps.length).padEnd(32)} ║`);
      console.log(`║ Best Lap:    ${formatTime(bestLap).padEnd(32)} ║`);
      console.log(`║ Average Lap: ${formatTime(avgLap).padEnd(32)} ║`);
      console.log('╚════════════════════════════════════════════╝');
    }

    ir.shutdown();
    process.exit(0);
  });
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const ms = (secs * 1000) % 1000;
  return `${minutes}:${Math.floor(secs).toString().padStart(2, '0')}.${Math.floor(ms).toString().padStart(3, '0')}`;
}

main().catch(console.error);

