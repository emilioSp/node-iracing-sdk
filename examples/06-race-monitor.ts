/**
 * Example 6: Race Monitor
 *
 * Displays live telemetry and full race standings, updated every second:
 *  - Speed (km/h)
 *  - Throttle (%)
 *  - Full standings: position, driver name, car
 */

import { IRSDK } from '../src/irsdk.js';
import { SESSION_DATA_KEYS, VARS } from '../src/vars.js';

async function main() {
  console.log('Connecting to iRacing...');
  const ir = await IRSDK.connect();
  console.log('Connected! Press Ctrl+C to exit\n');

  type DriverEntry = { name: string; car: string };
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
        });
      }
    }
  };

  const interval = setInterval(() => {
    if (!ir.isConnected) {
      console.log('\nDisconnected from iRacing');
      clearInterval(interval);
      process.exit(0);
    }

    ir.refreshSharedMemory();
    refreshDriverMap();

    const speed: number = ir.get(VARS.SPEED)[0] ?? 0;
    const throttle: number = ir.get(VARS.THROTTLE)[0] ?? 0;
    const playerIdx: number = ir.get(VARS.PLAYER_CAR_IDX)[0] ?? -1;
    const positions: number[] = ir.get(VARS.CAR_IDX_POSITION) ?? [];
    const estTimes: number[] = ir.get(VARS.CAR_IDX_EST_TIME) ?? [];
    const f2Times: number[] = ir.get(VARS.CAR_IDX_F2_TIME) ?? [];

    // Build standings: array of [position, carIdx] sorted by position
    const standings: { pos: number; carIdx: number }[] = [];
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] > 0) {
        standings.push({ pos: positions[i], carIdx: i });
      }
    }
    standings.sort((a, b) => a.pos - b.pos);

    const W = 76;
    const line = '═'.repeat(W - 2);
    const div = `╠${line}╣`;

    console.clear();
    console.log(`╔${line}╗`);
    console.log(`║${'  IRACING RACE MONITOR'.padEnd(W - 2)}║`);
    console.log(div);
    console.log(
      `║  Speed    : ${`${(speed * 3.6).toFixed(1)} km/h`.padEnd(W - 16)}║`,
    );
    console.log(
      `║  Throttle : ${`${(throttle * 100).toFixed(1)}%`.padEnd(W - 16)}║`,
    );
    console.log(div);
    console.log(
      `║  ${'POS  DRIVER'.padEnd(27)}  ${'CAR'.padEnd(14)}  ${'EST TIME'.padEnd(9)}  ${'GAP'.padEnd(9)}║`,
    );
    console.log(div);

    if (standings.length === 0) {
      console.log(`║  ${'No race session active'.padEnd(W - 4)}║`);
    } else {
      for (const { pos, carIdx } of standings) {
        const driver = driverMap.get(carIdx);
        const name = driver?.name ?? '—';
        const car = driver?.car ?? '—';
        const marker = carIdx === playerIdx ? '▶' : ' ';
        const posStr = `${marker} P${String(pos).padStart(2)}`;
        const nameCol = name.substring(0, 20).padEnd(20);
        const carCol = car.substring(0, 14).padEnd(14);
        const estTime = estTimes[carIdx] ?? -1;
        const f2Time = f2Times[carIdx] ?? 0;
        const estStr =
          estTime > 0
            ? `${estTime.toFixed(3)}s`.padStart(9)
            : '      ---'.padEnd(9);
        const f2Str = `${f2Time >= 0 ? '+' : ''}${f2Time.toFixed(3)}s`.padStart(
          9,
        );
        console.log(
          `║  ${posStr}  ${nameCol}  ${carCol}  ${estStr}  ${f2Str}║`,
        );
      }
    }

    console.log(`╚${line}╝`);
  }, 1000);

  process.on('SIGINT', () => {
    clearInterval(interval);
    ir.shutdown();
    console.log('\nShutdown complete');
    process.exit(0);
  });
}

main().catch(console.error);
