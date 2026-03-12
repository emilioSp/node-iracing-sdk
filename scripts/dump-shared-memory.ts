import path from 'node:path';
import { IRSDK } from '../src/irsdk.ts';

const ir = new IRSDK();

console.log('Connecting to iRacing...');
await ir.connect();
console.log('Connected! Dumping shared memory...\n');

const outputPath = path.join(import.meta.dirname, 'shared-memory.bin');
ir.dumpSharedMemory(outputPath);

console.log(
  `Shared Memory dumped with success! Check the file at: ${outputPath}`,
);

ir.shutdown();
