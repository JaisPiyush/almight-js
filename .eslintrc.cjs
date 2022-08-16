module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    parserOptions: {
      tsconfigRootDir: __dirname,
      project: [ './packages/*/tsconfig.json',
                  './chain-adapters/*/tsconfig.json'
    ],
    },
  };