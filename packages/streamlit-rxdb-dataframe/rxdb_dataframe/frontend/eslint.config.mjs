import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...baseConfig,
  // TODO: decide if needed
  // ...nx.configs['flat/react'],
  // ...nx.configs['flat/react-jsx'],
  {
    ignores: ['**/index.html', './build'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      //
    },
  },
];
