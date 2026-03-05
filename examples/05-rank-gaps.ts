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

import { IRSDK } from '../src/index.ts';

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

const formatDelta = (s: number): string => {
  if (!Number.isFinite(s)) return '      N/A';

  let sign = '';
  if (s > 0) sign = '+';
  else if (s < 0) sign = '-';

  const abs = Math.abs(s);
  const sec = Math.floor(abs);
  const ms = Math.round((abs % 1) * 1000);
  return `  ${sign}${sec}.${String(ms).padStart(3, '0')}s`;
};

async function main() {
  const ir = new IRSDK();

  console.log('Connecting to iRacing...');
  const connected = await ir.startup();

  if (!connected) {
    console.error('Failed to connect to iRacing');
    process.exit(1);
  }

  console.log('Connected! Press Ctrl+C to exit\n');

  const interval = setInterval(() => {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      clearInterval(interval);
      process.exit(0);
    }

    ir.freezeVarBufferLatest();

    // ── Raw data from shared memory ──────────────────────────────────────────
    const playerIdx: number = ir.get('PlayerCarIdx') ?? -1;
    const positions: number[] = ir.get('CarIdxPosition') ?? [];
    const lastLaps: number[] = ir.get('CarIdxLastLapTime') ?? [];
    const estTimes: number[] = ir.get('CarIdxEstTime') ?? [];
    const sessionTime: number = ir.get('SessionTime') ?? 0;

    ir.unfreezeVarBufferLatest();

    if (playerIdx < 0 || positions.length === 0) return;

    const playerPos = positions[playerIdx];
    if (playerPos <= 0) {
      console.clear();
      console.log('Waiting for race session to start…');
      return;
    }

    // ── Find rank neighbours ─────────────────────────────────────────────────
    let aheadIdx = -1;
    let behindIdx = -1;
    for (let c = 0; c < positions.length; c++) {
      if (positions[c] === playerPos - 1) aheadIdx = c;
      if (positions[c] === playerPos + 1) behindIdx = c;
    }

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
      console.log(
        `║  Car ahead   (P${String(playerPos - 1).padEnd(2)})                                         ║`,
      );
      console.log(`║    Last lap :${formatTime(aheadLap).padEnd(49)}║`);
      console.log(`║    Gap      :${formatGap(gapAhead).padEnd(49)}║`);
    } else {
      console.log(
        '║  Car ahead   : none (you are leading)                        ║',
      );
    }

    console.log(
      '╠══════════════════════════════════════════════════════════════╣',
    );

    // Player row
    console.log(
      `║  Player      (P${String(playerPos).padEnd(2)})                                         ║`,
    );
    console.log(`║    Last lap :${formatTime(playerLap).padEnd(49)}║`);
    if (aheadIdx >= 0)
      console.log(`║    vs ahead :${formatDelta(deltaAhead).padEnd(49)}║`);
    if (behindIdx >= 0)
      console.log(`║    vs behind:${formatDelta(deltaBehind).padEnd(49)}║`);

    console.log(
      '╠══════════════════════════════════════════════════════════════╣',
    );

    // Car behind row
    if (behindIdx >= 0) {
      console.log(
        `║  Car behind  (P${String(playerPos + 1).padEnd(2)})                                         ║`,
      );
      console.log(`║    Last lap :${formatTime(behindLap).padEnd(49)}║`);
      console.log(`║    Gap      :${formatGap(gapBehind).padEnd(49)}║`);
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
