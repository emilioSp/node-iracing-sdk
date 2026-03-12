import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IRSDK } from './irsdk.ts';
import { VARS } from './vars.ts';

describe('iracing sdk test', () => {
  it('should get vars from shared memory', () => {
    const ir = IRSDK.fromDump(
      path.join(import.meta.dirname, '..', 'fixture', 'shared-memory.bin'),
    );

    expect(ir.get(VARS.SPEED)).toBe(3.205353260040283);
    expect(ir.get(VARS.THROTTLE)).toBe(0.03526509553194046);
    expect(ir.get(VARS.BRAKE)).toBe(0);
    expect(ir.get(VARS.GEAR)).toBe(3);
    expect(ir.get(VARS.FUEL_LEVEL)).toBe(108.46894073486328);
    expect(ir.get(VARS.FUEL_USE_PER_HOUR)).toBe(3.598353147506714);
    expect(ir.get(VARS.LAP)).toBe(13);
    expect(ir.get(VARS.LAP_DIST)).toBe(646.8908081054688);
  });
});
