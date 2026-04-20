import path from 'node:path';
import { IRSDK } from '../src/irsdk.js';
import { SESSION_DATA_KEYS, VARS } from '../src/vars.js';

const ir = IRSDK.fromDump(
  path.join(
    import.meta.dirname,
    '..',
    'fixture',
    'shared-memory_checkered_flag.bin',
  ),
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

const SESSION_FLAG_CHECKERED = 0x00000001;
const isCheckeredFlag = (flags: number): boolean =>
  (flags & SESSION_FLAG_CHECKERED) !== 0;

const playerIdx: number = ir.get(VARS.PLAYER_CAR_IDX)[0] ?? -1;
const positions: number[] = ir.get(VARS.CAR_IDX_POSITION) ?? [];
const lastLaps: number[] = ir.get(VARS.CAR_IDX_LAST_LAP_TIME) ?? [];
const lastLaps2: number[] = ir.get(VARS.LAP_LAST_LAP_TIME) ?? [];
const lapsCompleted: number[] = ir.get(VARS.CAR_IDX_LAP_COMPLETED) ?? [];
const classPosition: number[] = ir.get(VARS.CAR_IDX_CLASS_POSITION) ?? [];
const raceLaps: number[] = ir.get(VARS.RACE_LAPS);
const sessionNum: number = ir.get(VARS.SESSION_NUM)[0];
const flagsSession = ir?.get(VARS.SESSION_FLAGS)[0];

console.log('playerIdx', playerIdx);
console.log('sessionNum', sessionNum);
console.log('positions', positions);
console.log('lastLaps', lastLaps);
console.log('lastLaps2', lastLaps2);
console.log('flagsSession', flagsSession);
console.log('isCheckeredFlag', isCheckeredFlag(flagsSession));
console.log('lastLaps count', lastLaps.length);
console.log('lapsCompleted', lapsCompleted);
console.log('lapsCompleted 32', lapsCompleted[32]);
console.log('lapsCompleted 35', lapsCompleted[35]);
console.log('classPosition', classPosition);
console.log('classPosition 32', classPosition[32]);
console.log('classPosition 35', classPosition[35]);
console.log('raceLaps', raceLaps);

const sessionInfo = ir.getSessionInfo(SESSION_DATA_KEYS.SESSION_INFO);
console.log('sessionInfo', JSON.stringify(sessionInfo, null, 2));

const driverInfo = ir.getSessionInfo(SESSION_DATA_KEYS.DRIVER_INFO);
console.log('driverInfo', driverInfo);
