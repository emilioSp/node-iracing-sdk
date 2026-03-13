import path from 'node:path';
import { IRSDK } from '../src/irsdk.ts';
import { VARS } from '../src/vars.ts';

const ir = IRSDK.fromDump(
  path.join(import.meta.dirname, '..', 'fixture', 'shared-memory.bin'),
);

console.log('speed', ir.get(VARS.SPEED));
console.log('rpm', ir.get(VARS.RPM));
console.log('throttle', ir.get(VARS.THROTTLE));
console.log('brake', ir.get(VARS.BRAKE));
console.log('gear', ir.get(VARS.GEAR));
console.log('fuel', ir.get(VARS.FUEL_LEVEL));
console.log('fuelPerLap', ir.get(VARS.FUEL_USE_PER_HOUR));
console.log('lapCount', ir.get(VARS.LAP));
console.log('lapDistance', ir.get(VARS.LAP_DIST));

const playerIdx: number = ir.get(VARS.PLAYER_CAR_IDX) ?? -1;
const positions: number[] = ir.get(VARS.CAR_IDX_POSITION) ?? [];
const lastLaps: number[] = ir.get(VARS.CAR_IDX_LAST_LAP_TIME) ?? [];
const estTimes: number[] = ir.get(VARS.CAR_IDX_EST_TIME) ?? [];
const sessionTime: number = ir.get(VARS.SESSION_TIME) ?? 0;

console.log('playerIdx', playerIdx);
console.log('positions', positions);
console.log('lastLaps', lastLaps);
console.log('estTimes', estTimes);
console.log('sessionTime', sessionTime);
