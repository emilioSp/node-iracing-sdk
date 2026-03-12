import path from 'node:path';
import { IRSDK } from '../src/irsdk.ts';
import { VARS } from '../src/vars.ts';

const ir = IRSDK.fromDump(path.join(import.meta.dirname, 'shared-memory.bin'));

console.log('speed', ir.get(VARS.SPEED));
console.log('rpm', ir.get(VARS.RPM));
console.log('throttle', ir.get(VARS.THROTTLE));
console.log('brake', ir.get(VARS.BRAKE));
console.log('gear', ir.get(VARS.GEAR));
console.log('fuel', ir.get(VARS.FUEL_LEVEL));
console.log('fuelPerLap', ir.get(VARS.FUEL_USE_PER_HOUR));
console.log('lapCount', ir.get(VARS.LAP));
console.log('lapDistance', ir.get(VARS.LAP_DIST));
