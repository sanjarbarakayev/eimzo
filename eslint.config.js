import antfu from '@antfu/eslint-config'

export default antfu({
  // Enable TypeScript and Vue support
  typescript: true,
  vue: true,

  // Stylistic rules (replaces Prettier)
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // Ignore patterns
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/vitest.config.ts',
    '**/tsup.config.ts',
    '**/.claude/**',
    '**/docs/**',
    '**/*.md',
  ],
}, {
  // Custom rules
  rules: {
    // Relaxed rules for existing codebase
    'no-console': 'warn',
    'ts/explicit-function-return-type': 'off',
    'ts/no-explicit-any': 'warn',
    'ts/strict-boolean-expressions': 'off',
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/no-unsafe-argument': 'off',
    'ts/no-unsafe-return': 'off',
    'ts/no-unsafe-call': 'off',
    'ts/no-use-before-define': 'off',
    'ts/no-unsafe-function-type': 'off',
    'ts/no-empty-object-type': 'off',
    'unused-imports/no-unused-vars': 'warn',
    'antfu/no-top-level-await': 'off',

    // Allow control characters in regex (needed for binary data)
    'no-control-regex': 'off',

    // Relax import ordering for existing codebase
    'perfectionist/sort-imports': 'off',
    'perfectionist/sort-named-imports': 'off',
    'perfectionist/sort-named-exports': 'off',
    'import/consistent-type-specifier-style': 'off',

    // Relax JSDoc requirements
    'jsdoc/check-param-names': 'off',

    // Test-specific rules
    'test/prefer-lowercase-title': 'off',

    // Node.js specific
    'node/handle-callback-err': 'off',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',

    // Promise handling
    'prefer-promise-reject-errors': 'off',
    'no-async-promise-executor': 'off',

    // Regex patterns (UTF-8 handling in binary data)
    'regexp/no-obscure-range': 'off',

    // Native prototype extension (used in existing code)
    'no-extend-native': 'off',

    // Assignment in conditions (used in while loops)
    'no-cond-assign': 'off',

    // Binary operator indentation
    'style/indent-binary-ops': 'off',
  },
}, {
  // Test files can be more relaxed
  files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
  rules: {
    'ts/no-explicit-any': 'off',
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/no-unsafe-argument': 'off',
    'unused-imports/no-unused-vars': 'off',
  },
})
