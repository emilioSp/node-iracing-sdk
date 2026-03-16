/**
 * Example 5: Rank Gaps Monitor
 *
 * Displays live data for the player and their immediate neighbours:
 *  - Driver ahead (P-1): position, last lap, best lap
 *  - Player:             position, last lap, best lap, live gap ahead
 *  - Driver behind (P+1): position, last lap, best lap
 *
 * Standings are computed in real time from laps completed + lap distance %,
 * and gaps use CarIdxEstTime (same reference as iRacing's relative widget).
 */

import { IRSDK } from '../src/irsdk.js';
import { SESSION_DATA_KEYS, VARS } from '../src/vars.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatLap = (s: number): string => {
  if (s <= 0 || !Number.isFinite(s)) return '      --:--.---';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const formatGap = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '---';
  return `+${s.toFixed(3)}s`;
};

// delta = playerLap - otherLap: positive = player lost time, negative = gained
const formatDelta = (delta: number): string => {
  if (!Number.isFinite(delta)) return '---';
  if (delta > 0) return `+${delta.toFixed(3)}s (lost)`;
  if (delta < 0) return `${delta.toFixed(3)}s (gained)`;
  return `0.000s`;
};

async function main() {
  console.log('Connecting to iRacing...');
  //const ir = await IRSDK.connect();
  const ir = await IRSDK.fromDump('../fixture/shared-memory_ai_race.bin');
  console.log('Connected! Press Ctrl+C to exit\n');

  type DriverEntry = {
    name: string;
    car: string;
    iRating: string;
    license: string;
  };
  let driverMap: Map<number, DriverEntry> = new Map();
  let lastSessionInfoUpdate = -1;

  const refreshDriverMap = () => {
    const sessionInfoUpdate = ir.sessionInfoUpdate;
    if (sessionInfoUpdate === lastSessionInfoUpdate && driverMap.size > 0)
      return;
    lastSessionInfoUpdate = sessionInfoUpdate;

    const driverInfo = ir.getSessionInfo(SESSION_DATA_KEYS.DRIVER_INFO);
    driverMap = new Map<number, DriverEntry>();
    for (const driver of driverInfo.Drivers) {
      if (driver.CarIdx !== undefined) {
        driverMap.set(Number(driver.CarIdx), {
          name: String(driver.UserName ?? ''),
          car: String(driver.CarScreenNameShort ?? driver.CarScreenName ?? ''),
          iRating: String(driver.IRating ?? 'N/A'),
          license: String(driver.LicString ?? 'N/A'),
        });
      }
    }
  };

  process.on('SIGINT', () => {
    ir.shutdown();
    console.log('\nShutdown complete');
    process.exit(0);
  });

  while (true) {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      process.exit(0);
    }

    ir.refreshSharedMemory();
    refreshDriverMap();

    const playerIdx: number = ir.get(VARS.PLAYER_CAR_IDX)[0] ?? -1;
    const lapsCompleted: number[] = ir.get(VARS.CAR_IDX_LAP_COMPLETED) ?? [];
    const lapDistPct: number[] = ir.get(VARS.CAR_IDX_LAP_DIST_PCT) ?? [];
    const estTimes: number[] = ir.get(VARS.CAR_IDX_EST_TIME) ?? [];
    const lastLaps: number[] = ir.get(VARS.CAR_IDX_LAST_LAP_TIME) ?? [];
    const bestLaps: number[] = ir.get(VARS.CAR_IDX_BEST_LAP_TIME) ?? [];

    // Build real-time standings sorted by total distance (laps + lap %)
    const standings: { pos: number; carIdx: number }[] = [];
    for (let i = 0; i < lapDistPct.length; i++) {
      if (lapDistPct[i] >= 0 && driverMap.has(i)) {
        const driver = driverMap.get(i)!;
        if (driver.name.toLowerCase() === 'pace car') continue;
        standings.push({ pos: 0, carIdx: i });
      }
    }
    standings.sort((a, b) => {
      const distA =
        (lapsCompleted[a.carIdx] ?? 0) + (lapDistPct[a.carIdx] ?? 0);
      const distB =
        (lapsCompleted[b.carIdx] ?? 0) + (lapDistPct[b.carIdx] ?? 0);
      return distB - distA;
    });
    standings.forEach((s, i) => {
      s.pos = i + 1;
    });

    const W = 64;
    const line = '═'.repeat(W - 2);
    const div = `╠${line}╣`;

    console.clear();

    if (playerIdx < 0 || standings.length === 0) {
      console.log(`╔${line}╗`);
      console.log(`║${'  IRACING RANK GAPS MONITOR'.padEnd(W - 2)}║`);
      console.log(`╠${line}╣`);
      console.log(`║  ${'Waiting for session...'.padEnd(W - 4)}║`);
      console.log(`╚${line}╝`);
      continue;
    }

    const playerStanding = standings.find((s) => s.carIdx === playerIdx);
    if (!playerStanding) continue;
    const playerPos = playerStanding.pos;

    const aheadStanding = standings.find((s) => s.pos === playerPos - 1);
    const behindStanding = standings.find((s) => s.pos === playerPos + 1);
    const aheadIdx = aheadStanding?.carIdx ?? -1;
    const behindIdx = behindStanding?.carIdx ?? -1;

    // Live gaps via EstTime
    const playerEst = estTimes[playerIdx] ?? 0;
    const gapAhead =
      aheadIdx >= 0 ? Math.abs(playerEst - (estTimes[aheadIdx] ?? 0)) : NaN;
    const gapBehind =
      behindIdx >= 0 ? Math.abs((estTimes[behindIdx] ?? 0) - playerEst) : NaN;

    // Last lap deltas: positive = player was slower, negative = player was faster
    const playerLast = lastLaps[playerIdx] > 0 ? lastLaps[playerIdx] : NaN;
    const aheadLast =
      aheadIdx >= 0 && lastLaps[aheadIdx] > 0 ? lastLaps[aheadIdx] : NaN;
    const behindLast =
      behindIdx >= 0 && lastLaps[behindIdx] > 0 ? lastLaps[behindIdx] : NaN;
    const deltaAhead = playerLast - aheadLast;
    const deltaBehind = playerLast - behindLast;

    const printDriver = (
      label: string,
      pos: number,
      carIdx: number,
      gaps?: {
        ahead?: number;
        behind?: number;
        deltaAhead?: number;
        deltaBehind?: number;
      },
    ) => {
      const driver = driverMap.get(carIdx);
      const name = (driver?.name ?? '—').substring(0, 30).padEnd(30);
      const car = (driver?.car ?? '—').substring(0, 20).padEnd(20);
      const iRating = (driver?.iRating ?? 'N/A').padEnd(10);
      const license = (driver?.license ?? 'N/A').padEnd(10);
      const lastLap = formatLap(lastLaps[carIdx] ?? -1);
      const bestLap = formatLap(bestLaps[carIdx] ?? -1);

      // Helper: prints a labeled field with correct padding
      const field = (lbl: string, val: string) => {
        const prefix = `║    ${lbl}: `;
        console.log(`${prefix}${val.padEnd(W - prefix.length - 1)}║`);
      };

      const row = `P${String(pos).padStart(2)}  ${name}  ${car}`;
      console.log(div);
      console.log(`║  ${label.padEnd(W - 4)}║`);
      console.log(`║    ${row.padEnd(W - 6)}║`);
      field('iRating', iRating);
      field('License', license);
      field('Last   ', lastLap);
      field('Best   ', bestLap);
      if (gaps?.ahead !== undefined) field('Gap ahead ', formatGap(gaps.ahead));
      if (gaps?.behind !== undefined)
        field('Gap behind', formatGap(gaps.behind));
      if (gaps?.deltaAhead !== undefined)
        field('vs ahead  ', formatDelta(gaps.deltaAhead));
      if (gaps?.deltaBehind !== undefined)
        field('vs behind ', formatDelta(gaps.deltaBehind));
    };

    console.log(`╔${line}╗`);
    console.log(`║${'  IRACING RANK GAPS MONITOR'.padEnd(W - 2)}║`);

    if (aheadIdx >= 0) {
      printDriver('AHEAD', playerPos - 1, aheadIdx);
    } else {
      console.log(div);
      console.log(`║  ${'AHEAD — you are leading'.padEnd(W - 4)}║`);
    }

    printDriver('PLAYER', playerPos, playerIdx, {
      ahead: Number.isFinite(gapAhead) ? gapAhead : undefined,
      behind: Number.isFinite(gapBehind) ? gapBehind : undefined,
      deltaAhead: Number.isFinite(deltaAhead) ? deltaAhead : undefined,
      deltaBehind: Number.isFinite(deltaBehind) ? deltaBehind : undefined,
    });

    if (behindIdx >= 0) {
      printDriver('BEHIND', playerPos + 1, behindIdx);
    } else {
      console.log(div);
      console.log(`║  ${'BEHIND — you are last'.padEnd(W - 4)}║`);
    }
    console.log(`╚${line}╝`);

    await sleep(33);
  }
}

main().catch(console.error);
