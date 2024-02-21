import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true
    }),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint .',
        useFlatConfig: true
      }
    })
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/RosLib.js'),
      name: 'ROSLIB',
      // the proper extensions will be added
      fileName: 'RosLib',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['ws', 'src/util/decompressPng.js'],
    },
  },
  test: {
    include: [
      'src/**\/*.{test,spec}.?(c|m)[jt]s?(x)',
      './test/examples/*.js',
    ],
    exclude: ['dist'],
    environmentMatchGlobs: [
      // React example requires DOM emulation
      ['examples/react-example/**', 'jsdom']
    ]
  }
})
