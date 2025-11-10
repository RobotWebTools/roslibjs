import { resolve } from "path";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: "tsconfig.build.json",
      insertTypesEntry: true,
    }),
    checker({
      typescript: {
        tsconfigPath: "./tsconfig.build.json",
      },
      eslint: {
        lintCommand: "eslint .",
        useFlatConfig: true,
      },
    }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/RosLib.ts"),
      name: "ROSLIB",
      // the proper extensions will be added
      fileName: "RosLib",
    },
    rollupOptions: {
      /*
       * make sure to externalize deps that shouldn't be bundled
       * into your library
       */
      external: ["eventemitter3", "ws", "src/util/decompressPng.js"],
      output: {
        globals: { eventemitter3: "EventEmitter3" },
      },
    },
    // Keep synchronized with minimum engine specified in CI & package.json
    target: "node18",
  },
  test: {
    include: ["{src,test}/**/*.{test,spec,example}.?(c|m)[jt]s?(x)"],
    exclude: ["dist"],
    globalSetup: "./test/setup/vitest-setup.ts",
    setupFiles: "./test/setup/per-suite-setup.ts",
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
          name: "jsdom",
        },
      },
    ],
  },
});
