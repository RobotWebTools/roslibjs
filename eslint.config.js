// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  {
    // Linting rules for TS files, should be combined with the base config when migration is complete
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    }
  },
  {
    languageOptions: {
      'globals': {
        ...globals.es2020,
        ...globals.browser,
        ...globals.node,
        'bson': true
      },
      'parserOptions': {
        'ecmaFeatures': {
          'jsx': true
        }
      }
    }
  },
  {
    ignores: ['dist']
  },
  {
    // FIXME: Recommended rules that have been turned off to maintain compatibility with the current codebase
    rules: {
      'no-useless-escape': 0,
      'no-unused-vars': 0,
      'no-prototype-builtins': 0,
    }
  },
  {
    rules: {
      curly: 2,
      eqeqeq: 2,
      'wrap-iife': [2, 'any'],
      'no-use-before-define': 0,
      'no-caller': 2,
      'dot-notation': 0,
      'no-undef': 2,
      'no-cond-assign': 0,
      'no-eq-null': 0,
      strict: 0,
      quotes: [2, 'single'],
      'no-proto': 2,
      'linebreak-style': 2,
      'key-spacing': [2, {afterColon: true}],
      'eol-last': ['error', 'always'],
      // Disabled to allow namespaced ROS message types since that's how we think about message types in ROS
      '@typescript-eslint/no-namespace': 0,
      indent: [2, 2],
      'multiline-comment-style': 2,
      'no-trailing-spaces': 2
    },
    files: ['**/*.{js,jsx,ts,tsx,cjs}'],
  }
);
