module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/contracts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', 'react-refresh', '@typescript-eslint', 'import'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: ['src/pages/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@mui/material',
                message: 'Pages compose organisms only. No raw MUI primitives in src/pages.',
              },
              {
                name: '@mui/material/styles',
                message:
                  'Pages compose organisms only. Styling and theme belong in organisms or src/theme.',
              },
              {
                name: '@mui/icons-material',
                message:
                  'Pages compose organisms only. Icons must be encapsulated inside atoms or organisms.',
              },
            ],
            patterns: [
              {
                group: ['@mui/*'],
                message: 'Pages compose organisms only. No raw MUI imports in src/pages.',
              },
            ],
          },
        ],
      },
    },
  ],
};
