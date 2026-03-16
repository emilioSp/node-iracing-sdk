import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IRSDK } from './irsdk.ts';
import { SESSION_DATA_KEYS, VARS } from './vars.ts';

describe('iracing sdk test', () => {
  it('should get vars from shared memory', () => {
    const ir = IRSDK.fromDump(
      path.join(import.meta.dirname, '..', 'fixture', 'shared-memory.bin'),
    );

    expect(ir.get(VARS.SPEED)[0]).toBe(3.205353260040283);
    expect(ir.get(VARS.THROTTLE)[0]).toBe(0.03526509553194046);
    expect(ir.get(VARS.BRAKE)[0]).toBe(0);
    expect(ir.get(VARS.GEAR)[0]).toBe(3);
    expect(ir.get(VARS.FUEL_LEVEL)[0]).toBe(108.46894073486328);
    expect(ir.get(VARS.FUEL_USE_PER_HOUR)[0]).toBe(3.598353147506714);
    expect(ir.get(VARS.LAP)[0]).toBe(13);
    expect(ir.get(VARS.LAP_DIST)[0]).toBe(646.8908081054688);
  });
});

describe('AI race fixture — rank gaps scenario', () => {
  const FIXTURE = path.join(
    import.meta.dirname,
    '..',
    'fixture',
    'shared-memory_ai_race.bin',
  );

  it('should initialise and report as connected', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    expect(ir.isConnected()).toBe(true);
  });

  it('should identify the player car index', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    expect(ir.get(VARS.PLAYER_CAR_IDX)[0]).toBe(0);
  });

  it('should return session time', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    expect(ir.get(VARS.SESSION_TIME)[0]).toBeCloseTo(812.883, 2);
  });

  it('should return a full CarIdxPosition array (64 entries)', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const positions = ir.get(VARS.CAR_IDX_POSITION);
    expect(positions).toHaveLength(64);
    // Player (idx 0) is in P61
    expect(positions[0]).toBe(61);
  });

  it('should find the car directly ahead (P60) at idx 26', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const positions = ir.get(VARS.CAR_IDX_POSITION);
    const playerPos = positions[0]; // P61
    const aheadIdx = positions.findIndex((pos) => pos === playerPos - 1);
    expect(aheadIdx).toBe(26);
    expect(positions[aheadIdx]).toBe(60);
  });

  it('should report no car directly behind the player (last place)', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const positions = ir.get(VARS.CAR_IDX_POSITION);
    const playerPos = positions[0]; // P61
    const behindIdx = positions.findIndex((pos) => pos === playerPos + 1);
    expect(behindIdx).toBe(-1);
  });

  it('should return per-car lap times for the car ahead', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const lastLaps = ir.get(VARS.CAR_IDX_LAST_LAP_TIME);
    const bestLaps = ir.get(VARS.CAR_IDX_BEST_LAP_TIME);
    // Player has not completed a lap yet
    expect(lastLaps[0]).toBe(-1);
    expect(bestLaps[0]).toBe(-1);
    // Car ahead (idx 26) has completed laps
    expect(lastLaps[26]).toBeCloseTo(123.655, 2);
    expect(bestLaps[26]).toBeCloseTo(123.655, 2);
  });

  it('should compute the live EstTime gap to the car ahead', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const estTimes = ir.get(VARS.CAR_IDX_EST_TIME);
    const playerEst = estTimes[0];
    const aheadEst = estTimes[26];
    const gapAhead = playerEst - aheadEst;
    // Player EstTime is ~3.4 s, ahead is ~77.1 s → large negative gap (lapped)
    expect(gapAhead).toBeCloseTo(-73.736, 2);
  });

  it('should compute the live F2Time gap to the car ahead', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const f2Times = ir.get(VARS.CAR_IDX_F2_TIME);
    const playerF2 = f2Times[0];
    const aheadF2 = f2Times[26];
    const gapAheadF2 = playerF2 - aheadF2;
    // Player is ~129.7 s behind leader, ahead car is ~26.1 s → player is ~103.7 s behind the car ahead
    expect(gapAheadF2).toBeCloseTo(103.678, 2);
  });

  it('should return driver info from session YAML', () => {
    const ir = IRSDK.fromDump(FIXTURE);
    const driverInfo = ir.getSessionInfo(SESSION_DATA_KEYS.DRIVER_INFO);
    const drivers: { CarIdx: number; UserName: string; CarScreenName: string; IRating: number; LicString: string }[] =
      driverInfo.Drivers;

    const player = drivers.find((d) => d.CarIdx === 0);
    expect(player?.UserName).toBe('Emilio Spatola');
    expect(player?.CarScreenName).toBe('Ford Mustang GT3');
    expect(player?.IRating).toBe(1);
    expect(player?.LicString).toBe('R 0.01');

    const ahead = drivers.find((d) => d.CarIdx === 26);
    expect(ahead?.UserName).toBe('Tyler Hudson');
    expect(ahead?.CarScreenName).toBe('Acura NSX GT3 EVO 22');
  });
});
