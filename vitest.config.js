import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      // Default value for vitest; we just want to extend.
      '**\/*.{test,spec}.?(c|m)[jt]s?(x)',
      './test/examples/*.js',
    ],
    environmentMatchGlobs: [
      // React example requires DOM emulation
      ['examples/react-example/**', 'jsdom']
    ]
  }
})
