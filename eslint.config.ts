// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  {
    // Linting rules for TS files, should be combined with the base config when migration is complete
    files: ["**/*.{js,jsx,ts,tsx,cjs}"],
    extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      eqeqeq: 2,
      "wrap-iife": [2, "any"],
      "no-use-before-define": 0,
      "no-caller": 2,
      "no-undef": 2,
      "no-cond-assign": 0,
      "no-eq-null": 0,
      strict: 0,
      "prettier/prettier": 2,
      "no-proto": 2,
      // Disabled to allow namespaced ROS message types since that's how we think about message types in ROS
      "@typescript-eslint/no-namespace": 0,
      // Plenty of APIs (like mocking APIs in Vitest) require empty functions to be declared.
      "@typescript-eslint/no-empty-function": 0,
      "@typescript-eslint/no-unnecessary-condition": "error",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.es2020,
        ...globals.browser,
        ...globals.node,
        bson: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      jsdoc,
    },
    rules: {
      // Redundant in typescript files
      "jsdoc/no-types": "error",
    },
  },
  {
    ignores: ["dist"],
  },
);
