/**
 * Example 7: IBT Lap Analysis
 *
 * Reads an IBT telemetry file and prints a formatted per-lap performance table
 */

import path from 'node:path';
import { IBT } from '#src/ibt.js';
import { VARS } from '#src/vars.js';

const IBT_FILE = path.join(
  import.meta.dirname,
  '..',
  'telemetry',
  'corvette_gt3.ibt',
);

const ibt = new IBT();

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
};

interface LapAccumulator {
  lapTime: number | null;
  speeds: number[];
  brakes: number[];
  rpms: number[];
}

try {
  ibt.open(IBT_FILE);

  // readVarFromIBT returns Array<any>; for scalar vars each element is [value]
  const allLaps = (ibt.getAll(VARS.LAP) as number[][]).map((v) => v[0]);
  const allSpeeds = (ibt.getAll(VARS.SPEED) as number[][]).map(
    (v) => v[0] * 3.6,
  ); // m/s → km/h
  const allBrakes = (ibt.getAll(VARS.BRAKE) as number[][]).map((v) => v[0]);
  const allRPMs = (ibt.getAll(VARS.RPM) as number[][]).map((v) => v[0]);
  const allLapTimes = (ibt.getAll(VARS.LAP_LAST_LAP_TIME) as number[][]).map(
    (v) => v[0],
  );

  const lapMap = new Map<number, LapAccumulator>();

  for (let i = 0; i < allLaps.length; i++) {
    const lapNum = allLaps[i];

    if (!lapMap.has(lapNum)) {
      lapMap.set(lapNum, { lapTime: null, speeds: [], brakes: [], rpms: [] });
    }

    const acc = lapMap.get(lapNum)!;
    acc.speeds.push(allSpeeds[i]);
    acc.brakes.push(allBrakes[i]);
    acc.rpms.push(allRPMs[i]);

    // At the lap boundary the previous lap's time appears in LapLastLapTime
    if (i > 0 && allLaps[i] > allLaps[i - 1]) {
      const prevAcc = lapMap.get(allLaps[i - 1]);
      if (prevAcc && allLapTimes[i] > 0) {
        prevAcc.lapTime = allLapTimes[i];
      }
    }
  }

  const laps = Array.from(lapMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([lapNumber, acc]) => ({
      lapNumber,
      lapTime: acc.lapTime,
      maxSpeed: Math.max(...acc.speeds),
      avgSpeed: acc.speeds.reduce((s, v) => s + v, 0) / acc.speeds.length,
      maxBrake: Math.max(...acc.brakes),
      avgRPM: acc.rpms.reduce((s, v) => s + v, 0) / acc.rpms.length,
    }));

  const timedLaps = laps.filter((l) => l.lapTime !== null && l.lapTime > 0);
  const bestLap = timedLaps.length
    ? timedLaps.reduce((best, l) => (l.lapTime! < best.lapTime! ? l : best))
    : null;
  const topSpeed = Math.max(...laps.map((l) => l.maxSpeed));
  const fileName = IBT_FILE.split('/').pop() ?? IBT_FILE;

  // Table layout — all rows are 66 chars wide
  const TOP =
    '╔════════════════════════════════════════════════════════════════╗';
  const SEP_HDR =
    '╠═════╦════════════╦═══════════╦═══════════╦═══════════╦═════════╣';
  const SEP_ROW =
    '╠═════╬════════════╬═══════════╬═══════════╬═══════════╬═════════╣';
  const SEP_FTR =
    '╠═════╩════════════╩═══════════╩═══════════╩═══════════╩═════════╣';
  const BOT =
    '╚════════════════════════════════════════════════════════════════╝';
  const W = 64; // inner width (between ╔/╗ or outer ║ pair)

  const center = (s: string) =>
    s.padStart(Math.ceil((W + s.length) / 2)).padEnd(W);

  // Column widths: 3 | 10 | 9 | 9 | 9 | 7
  const row = (
    lapNum: string,
    time: string,
    maxSpd: string,
    avgSpd: string,
    brake: string,
    rpm: string,
  ) =>
    `║ ${lapNum.padStart(3)} ║ ${time.padEnd(10)} ║ ${maxSpd.padStart(9)} ║ ${avgSpd.padStart(9)} ║ ${brake.padStart(9)} ║ ${rpm.padStart(7)} ║`;

  console.log(TOP);
  console.log(`║${center('IBT LAP ANALYSIS')}║`);
  console.log(`║  ${'File: '.concat(fileName).padEnd(W - 2)}║`);
  console.log(SEP_HDR);
  console.log(
    row('Lap', 'Lap Time', 'Max Speed', 'Avg Speed', 'Max Brake', 'Avg RPM'),
  );
  console.log(SEP_ROW);

  for (const lap of laps) {
    const timeStr = lap.lapTime ? formatTime(lap.lapTime) : '—';
    console.log(
      row(
        String(lap.lapNumber),
        timeStr,
        `${lap.maxSpeed.toFixed(0)} km/h`,
        `${lap.avgSpeed.toFixed(0)} km/h`,
        `${(lap.maxBrake * 100).toFixed(1)}%`,
        lap.avgRPM.toFixed(0),
      ),
    );
  }

  console.log(SEP_FTR);
  const bestStr = bestLap
    ? `Best lap: ${formatTime(bestLap.lapTime!)} (Lap ${bestLap.lapNumber})`
    : 'Best lap: N/A';
  const topStr = `Top speed: ${topSpeed.toFixed(0)} km/h`;
  console.log(`║  ${`${bestStr}   │   ${topStr}`.padEnd(W - 2)}║`);
  console.log(BOT);
} catch (error) {
  console.error('Error:', error);
} finally {
  ibt.close();
}
