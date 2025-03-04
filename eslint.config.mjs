// @ts-check

export default [
  // Add ignore patterns for test directory if desired
  {
    ignores: ['./test/**'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'func-names': 'off',
      'no-process-exit': 'off',
      'object-shorthand': 'off',
      'class-methods-use-this': 'off',
      'space-before-function-paren': 'off',
    },
  },
];
