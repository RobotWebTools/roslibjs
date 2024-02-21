import globals from 'globals';

export default [
  {
    languageOptions: {
      'globals': {
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
      'key-spacing': [2, {afterColon: true}]
    },
    files: ['**/*.{js,jsx,cjs}']
  }
];
