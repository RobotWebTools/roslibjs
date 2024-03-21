import { describe, it, expect } from 'vitest';
import '../dist/RosLib.umd.cjs';
import { readFileSync } from 'fs';
import path from 'path';

describe('Using as if imported from a CDN', () => {
  it('Adds itself to the global namespace', () => {
    expect(globalThis.ROSLIB).toBeTruthy();
  })
  it('Does not include EventEmitter in the bundle', () => {
    // Read the bundled output of the file, check for `.on=function`, which is a reliable way to detect `EventEmitter.on` being defined.
    expect(readFileSync(path.resolve(__dirname, '../dist/RosLib.umd.cjs')).includes('.on=function')).toBeFalsy();
  })
});
