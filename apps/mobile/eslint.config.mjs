import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';
import expoConfig from 'eslint-config-expo/flat.js';
import reactCompiler from 'eslint-plugin-react-compiler';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  expoConfig,
  reactCompiler.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    ignores: ['.expo', 'web-build', 'cache', 'dist'],
  },
];