/**
 * Example 5: Rank-based lap time gaps (live)
 *
 * Displays, updated every second:
 *  - Car ahead  (P-1) → last lap time, live gap to player
 *  - Player          → last lap time
 *  - Car behind (P+1) → last lap time, live gap to player
 *  - Time gained / lost by the player vs each neighbour (last lap delta)
 *
 * Variables used
 * ──────────────
 * PlayerCarIdx          – our car index (scalar)
 * CarIdxPosition[n]     – race position of every car  (0 = not in race)
 * CarIdxLastLapTime[n]  – last completed lap time of every car  (s)
 * CarIdxEstTime[n]      – estimated time for car n to reach the player's
 *                         current track location (s); diff = live gap
 */

import { IRSDK } from '../src/irsdk.ts';
import { SESSION_DATA_KEYS, VARS } from '../src/vars.ts';

const formatTime = (s: number): string => {
  if (s <= 0) return '  --:--.---';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `  ${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const formatGap = (s: number): string => {
  if (!Number.isFinite(s)) return '      N/A';
  const sign = s >= 0 ? '+' : '-';
  const abs = Math.abs(s);
  const sec = Math.floor(abs);
  const ms = Math.round((abs % 1) * 1000);
  return `  ${sign}${sec}.${String(ms).padStart(3, '0')}s`;
};

const formatDeltaLap = (deltaLap: number): string => {
  if (!Number.isFinite(deltaLap)) return '      N/A';

  let sign = '';
  if (deltaLap > 0) sign = '+';
  else if (deltaLap < 0) sign = '-';

  const abs = Math.abs(deltaLap);
  const sec = Math.floor(abs);
  const ms = Math.round((abs % 1) * 1000);
  return `  ${sign}${sec}.${String(ms).padStart(3, '0')}s`;
};

async function main() {
  console.log('Connecting to iRacing...');
  const ir = await IRSDK.connect();
  console.log('Connected! Press Ctrl+C to exit\n');

  // ── iRating lookup: CarIdx → IRating ────────────────────────────────────
  // Built from DriverInfo YAML (session-level, not per-tick telemetry).
  // Refreshed whenever the session info update counter changes.
  let iRatingMap: Map<number, number> = new Map();
  let lastSessionInfoUpdate = -1;

  const refreshIRatingMap = () => {
    const update: number = ir.get(VARS.SESSION_TICK) ?? 0; // use as dirty-check proxy
    const driverInfo = ir.getSessionInfo(SESSION_DATA_KEYS.DRIVER_INFO);
    if (update === lastSessionInfoUpdate && iRatingMap.size > 0) return;
    lastSessionInfoUpdate = update;

    // DEBUG: uncomment the next line to verify the exact YAML field names
    console.log(
      'DriverInfo sample:',
      JSON.stringify(driverInfo.Drivers?.[0], null, 2),
    );

    iRatingMap = new Map<number, number>();
    for (const driver of driverInfo.Drivers) {
      const idx = driver.CarIdx;
      const rating = Number(driver.IRating ?? 0);
      if (idx !== undefined) iRatingMap.set(idx, rating);
    }
  };

  const interval = setInterval(() => {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      clearInterval(interval);
      process.exit(0);
    }

    // Refresh iRating map from session YAML (cheap if unchanged)
    refreshIRatingMap();

    ir.freezeVarBufferLatest();

    // ── Raw data from shared memory ──────────────────────────────────────────
    const playerIdx: number = ir.get(VARS.PLAYER_CAR_IDX) ?? -1;
    const positions: number[] = ir.get(VARS.CAR_IDX_POSITION) ?? [];
    const lastLaps: number[] = ir.get(VARS.CAR_IDX_LAST_LAP_TIME) ?? [];
    const estTimes: number[] = ir.get(VARS.CAR_IDX_EST_TIME) ?? [];
    const sessionTime: number = ir.get(VARS.SESSION_TIME) ?? 0;

    ir.unfreezeVarBufferLatest();

    if (playerIdx < 0 || positions.length === 0) return;

    const playerPos = positions[playerIdx];
    if (playerPos <= 0) {
      console.clear();
      console.log('Waiting for race session to start…');
      return;
    }

    // ── Find rank neighbours ─────────────────────────────────────────────────
    const aheadIdx = positions.findIndex((pos) => pos === playerPos - 1) ?? -1;
    const behindIdx = positions.findIndex((pos) => pos === playerPos + 1) ?? -1;

    // ── iRatings ─────────────────────────────────────────────────────────────
    const playerIR = iRatingMap.get(playerIdx) ?? NaN;
    const aheadIR = aheadIdx >= 0 ? (iRatingMap.get(aheadIdx) ?? NaN) : NaN;
    const behindIR = behindIdx >= 0 ? (iRatingMap.get(behindIdx) ?? NaN) : NaN;

    // ── Lap times ────────────────────────────────────────────────────────────
    const playerLap = lastLaps[playerIdx] > 0 ? lastLaps[playerIdx] : NaN;
    const aheadLap =
      aheadIdx >= 0 && lastLaps[aheadIdx] > 0 ? lastLaps[aheadIdx] : NaN;
    const behindLap =
      behindIdx >= 0 && lastLaps[behindIdx] > 0 ? lastLaps[behindIdx] : NaN;

    // ── Live gaps via EstTime ─────────────────────────────────────────────────
    // EstTime = time each car needs to reach the player's current track pos.
    // A car ahead arrives sooner → smaller EstTime → gap is positive.
    const playerEst = estTimes[playerIdx] ?? 0;
    const gapAhead =
      aheadIdx >= 0 ? playerEst - (estTimes[aheadIdx] ?? 0) : NaN;
    const gapBehind =
      behindIdx >= 0 ? (estTimes[behindIdx] ?? 0) - playerEst : NaN;

    // ── Lap delta: positive = player was faster that lap ─────────────────────
    const deltaAhead =
      Number.isFinite(playerLap) && Number.isFinite(aheadLap)
        ? aheadLap - playerLap
        : NaN;
    const deltaBehind =
      Number.isFinite(playerLap) && Number.isFinite(behindLap)
        ? behindLap - playerLap
        : NaN;

    // ── Render ────────────────────────────────────────────────────────────────
    const m = Math.floor(sessionTime / 60);
    const s = Math.floor(sessionTime % 60);
    const sessionStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    console.clear();
    console.log(
      '╔══════════════════════════════════════════════════════════════╗',
    );
    console.log(
      '║              IRACING RANK GAPS MONITOR                      ║',
    );
    console.log(`║  Session time: ${sessionStr.padEnd(47)}║`);
    console.log(
      '╠══════════════════════════════════════════════════════════════╣',
    );
    console.log(`║  Player position: P${String(playerPos).padEnd(43)}║`);
    console.log(
      '╠══════════════════════════════════════════════════════════════╣',
    );

    // Car ahead row
    if (aheadIdx >= 0) {
      const irStr = Number.isFinite(aheadIR) ? String(aheadIR) : 'N/A';
      console.log(
        `║  Car ahead   (P${String(playerPos - 1).padEnd(2)})                                         ║`,
      );
      console.log(`║    iRating  : ${irStr.padEnd(48)}║`);
      console.log(`║    Last lap : ${formatTime(aheadLap).padEnd(48)}║`);
      console.log(`║    Gap      : ${formatGap(gapAhead).padEnd(48)}║`);
    } else {
      console.log(
        '║  Car ahead   : none (you are leading)                        ║',
      );
    }

    console.log(
      '╠══════════════════════════════════════════════════════════════╣',
    );

    // Player row
    const playerIRStr = Number.isFinite(playerIR) ? String(playerIR) : 'N/A';
    console.log(
      `║  Player      (P${String(playerPos).padEnd(2)})                                         ║`,
    );
    console.log(`║    iRating  : ${playerIRStr.padEnd(48)}║`);
    console.log(`║    Last lap : ${formatTime(playerLap).padEnd(48)}║`);
    if (aheadIdx >= 0)
      console.log(`║    vs ahead : ${formatDeltaLap(deltaAhead).padEnd(48)}║`);
    if (behindIdx >= 0)
      console.log(`║    vs behind: ${formatDeltaLap(deltaBehind).padEnd(48)}║`);

    console.log(
      '╠══════════════════════════════════════════════════════════════╣',
    );

    // Car behind row
    if (behindIdx >= 0) {
      const irStr = Number.isFinite(behindIR) ? String(behindIR) : 'N/A';
      console.log(
        `║  Car behind  (P${String(playerPos + 1).padEnd(2)})                                         ║`,
      );
      console.log(`║    iRating  : ${irStr.padEnd(48)}║`);
      console.log(`║    Last lap : ${formatTime(behindLap).padEnd(48)}║`);
      console.log(`║    Gap      : ${formatGap(gapBehind).padEnd(48)}║`);
    } else {
      console.log(
        '║  Car behind  : none (you are last)                           ║',
      );
    }

    console.log(
      '╚══════════════════════════════════════════════════════════════╝',
    );
  }, 1000);

  process.on('SIGINT', () => {
    clearInterval(interval);
    ir.shutdown();
    console.log('\nShutdown complete');
    process.exit(0);
  });
}

main().catch(console.error);
