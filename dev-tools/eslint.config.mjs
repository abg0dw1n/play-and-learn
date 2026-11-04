import globals from 'globals';
export default [
  { files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.browser, ...globals.node, Deno: 'readonly' } },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-dupe-else-if': 'error', 'no-self-assign': 'error', 'no-constant-condition': 'warn', 'no-cond-assign': 'error', 'no-redeclare': 'error', 'no-fallthrough': 'warn', 'use-isnan': 'error', 'valid-typeof': 'error', 'no-unsafe-negation': 'error', 'no-sparse-arrays': 'warn', 'no-import-assign': 'error', 'no-loss-of-precision': 'error', 'no-useless-catch': 'warn', 'no-shadow-restricted-names': 'error', 'no-async-promise-executor': 'error', 'no-compare-neg-zero': 'error', 'no-duplicate-case': 'error', 'no-empty-pattern': 'error', 'no-func-assign': 'error', 'no-unused-labels': 'error', 'getter-return': 'error', 'no-setter-return': 'error', 'for-direction': 'error' } },
];
