import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier";

export default defineConfig(
  eslint.configs.recommended,
  {
    // Linting rules for TS files, should be combined with the base config when migration is complete
    files: ["**/*.{js,jsx,ts,tsx,cjs}"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
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
      "prettier/prettier": [2, { endOfLine: "auto" }],
      // Disabled to allow namespaced ROS message types since that's how we think about message types in ROS
      "@typescript-eslint/no-namespace": 0,
      // Plenty of APIs (like mocking APIs in Vitest) require empty functions to be declared.
      "@typescript-eslint/no-empty-function": 0,
      "prefer-template": 2,
      "@typescript-eslint/consistent-type-imports": 2,
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
