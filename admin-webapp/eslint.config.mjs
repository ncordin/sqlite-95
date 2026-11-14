import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  { ignores: ['public/'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: '19.3' },
    },
    rules: {
      'react/prop-types': 'off',
    },
  },
];
