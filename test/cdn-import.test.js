import { describe, it, expect } from 'vitest';
import '../dist/RosLib.umd.cjs';

describe('Using as if imported from a CDN', () => {
  it('Adds itself to the global namespace', () => {
    expect(globalThis.ROSLIB).toBeTruthy();
  })
});
