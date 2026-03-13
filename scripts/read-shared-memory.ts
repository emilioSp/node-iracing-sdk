import path from 'node:path';
import { IRSDK } from '../src/irsdk.ts';
import { VARS } from '../src/vars.ts';

const ir = IRSDK.fromDump(
  path.join(import.meta.dirname, '..', 'fixture', 'shared-memory.bin'),
);

console.log('speed', ir.get(VARS.SPEED)[0]);
console.log('rpm', ir.get(VARS.RPM)[0]);
console.log('throttle', ir.get(VARS.THROTTLE)[0]);
console.log('brake', ir.get(VARS.BRAKE)[0]);
console.log('gear', ir.get(VARS.GEAR)[0]);
console.log('fuel', ir.get(VARS.FUEL_LEVEL)[0]);
console.log('fuelPerLap', ir.get(VARS.FUEL_USE_PER_HOUR)[0]);
console.log('lapCount', ir.get(VARS.LAP)[0]);
console.log('lapDistance', ir.get(VARS.LAP_DIST)[0]);

const playerIdx: number = ir.get(VARS.PLAYER_CAR_IDX)[0] ?? -1;
const positions: number[] = ir.get(VARS.CAR_IDX_POSITION) ?? [];
const lastLaps: number[] = ir.get(VARS.CAR_IDX_LAST_LAP_TIME) ?? [];
const estTimes: number[] = ir.get(VARS.CAR_IDX_EST_TIME) ?? [];
const sessionTime: number = ir.get(VARS.SESSION_TIME)[0] ?? 0;

console.log('playerIdx', playerIdx);
console.log('positions', positions);
console.log('lastLaps', lastLaps);
console.log('estTimes', estTimes);
console.log('sessionTime', sessionTime);
