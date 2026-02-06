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
    // === WARNINGS (should fix gradually) ===
    'no-console': 'warn',
    'ts/no-explicit-any': 'warn',
    'unused-imports/no-unused-vars': 'warn',

    // === OFF (require type-checked linting setup) ===
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/no-unsafe-argument': 'off',
    'ts/no-unsafe-return': 'off',
    'ts/no-unsafe-call': 'off',
    'ts/no-unsafe-function-type': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-async-promise-executor': 'off',

    // === OFF (style preferences) ===
    'ts/explicit-function-return-type': 'off',
    'ts/strict-boolean-expressions': 'off',
    'perfectionist/sort-imports': 'off',
    'perfectionist/sort-named-imports': 'off',
    'perfectionist/sort-named-exports': 'off',
    'import/consistent-type-specifier-style': 'off',
    'jsdoc/check-param-names': 'off',
    'test/prefer-lowercase-title': 'off',
    'style/indent-binary-ops': 'off',
    'antfu/no-top-level-await': 'off',

    // === OFF (legitimate technical reasons) ===
    // Binary data handling requires control characters
    'no-control-regex': 'off',
    'regexp/no-obscure-range': 'off',

    // Legacy Utf8 class extends String prototype
    'no-extend-native': 'off',

    // Common pattern: while ((match = regex.exec(str)))
    'no-cond-assign': 'off',

    // Standard Node.js globals
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'node/handle-callback-err': 'off',

    // Empty object type used in Vue component definitions
    'ts/no-empty-object-type': 'off',

    // Function hoisting is valid JavaScript
    'ts/no-use-before-define': 'off',
  },
}, {
  // Test files - more relaxed
  files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
  rules: {
    'ts/no-explicit-any': 'off',
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/no-unsafe-argument': 'off',
    'ts/no-unsafe-return': 'off',
    'ts/no-unsafe-call': 'off',
    'unused-imports/no-unused-vars': 'off',
    'no-async-promise-executor': 'off',
    'prefer-promise-reject-errors': 'off',
  },
})
