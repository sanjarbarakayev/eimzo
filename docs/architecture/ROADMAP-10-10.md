# EIMZO SDK: Roadmap to 10/10

A comprehensive plan to achieve world-class SDK quality across all dimensions.

---

## Current Scores vs Target

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| Architecture Design | 9/10 | 10/10 | Plugin system, middleware |
| Type Safety | 9/10 | 10/10 | Branded types, inference |
| Error Handling | 8/10 | 10/10 | Error boundaries, recovery |
| Developer Experience | 7/10 | 10/10 | Docs, DevTools, examples |
| Code Quality | 8/10 | 10/10 | Tests, linting, CI/CD |
| Extensibility | 7/10 | 10/10 | Plugins, hooks, middleware |
| Publishing/DX | 7/10 | 10/10 | Peer deps, CLI, scaffolding |

---

## 1. Architecture Design: 9 → 10

### Current State
- Clean 5-layer architecture
- Good separation of concerns

### Missing for 10/10

#### 1.1 Middleware/Plugin System
Allow users to intercept and modify behavior at any layer.

```typescript
// Middleware pattern (like Express, tRPC)
const client = createEIMZOClient({
  middleware: [
    // Logging middleware
    async (ctx, next) => {
      console.log(`[${ctx.operation}] Starting...`)
      const start = Date.now()
      const result = await next()
      console.log(`[${ctx.operation}] Done in ${Date.now() - start}ms`)
      return result
    },
    // Analytics middleware
    async (ctx, next) => {
      try {
        return await next()
      }
      catch (error) {
        analytics.track('eimzo_error', { operation: ctx.operation })
        throw error
      }
    }
  ]
})
```

**Files to create:**
- [ ] `packages/core/src/middleware.ts`
- [ ] `packages/core/src/create-client.ts`

#### 1.2 Adapter Pattern for WebSocket
Abstract WebSocket for testing and alternative transports.

```typescript
// packages/core/src/adapters/websocket-adapter.ts
interface WebSocketAdapter {
  connect: (url: string) => Promise<void>
  send: (data: string) => void
  onMessage: (handler: (data: string) => void) => void
  close: () => void
}

// Real implementation
class BrowserWebSocketAdapter implements WebSocketAdapter { }

// Mock for testing
class MockWebSocketAdapter implements WebSocketAdapter { }

// Node.js implementation (for SSR)
class NodeWebSocketAdapter implements WebSocketAdapter { }
```

#### 1.3 Event Emitter Pattern
Central event bus for decoupled communication.

```typescript
// packages/core/src/events.ts
interface EIMZOEvents {
  'connect': void
  'disconnect': { reason: string }
  'error': { error: Error, context: ErrorContext }
  'certificate:loaded': { certificate: Certificate }
  'sign:start': { data: string }
  'sign:complete': { signature: string }
  'sign:error': { error: Error }
}

const client = createEIMZOClient()

client.on('sign:complete', ({ signature }) => {
  console.log('Signed:', signature)
})

client.once('connect', () => {
  console.log('First connection')
})
```

---

## 2. Type Safety: 9 → 10

### Current State
- Good discriminated unions
- Proper module augmentation

### Missing for 10/10

#### 2.1 Branded Types for IDs
Prevent mixing up different ID types.

```typescript
// packages/core/src/types/branded.ts
declare const brand: unique symbol

type Brand<T, B> = T & { [brand]: B }

export type KeyId = Brand<string, 'KeyId'>
export type CertificateId = Brand<string, 'CertificateId'>
export type SessionId = Brand<string, 'SessionId'>

// Now TypeScript prevents mixing IDs
function loadKey(keyId: KeyId): Promise<void>
function signWithKey(keyId: KeyId, data: string): Promise<string>

// Error: CertificateId is not assignable to KeyId
signWithKey(certificate.id, data) // ❌ Type error
signWithKey(loadedKey.id, data) // ✅ Works
```

#### 2.2 Const Assertions for Error Codes
Type-safe error code handling.

```typescript
// packages/core/src/errors/codes.ts
export const ERROR_CODES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  CERTIFICATE_EXPIRED: 'CERTIFICATE_EXPIRED',
  // ...
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Type-safe error checking
if (error.code === ERROR_CODES.WRONG_PASSWORD) {
  // TypeScript knows this is 'WRONG_PASSWORD'
}
```

#### 2.3 Strict Result Types
Use Result type instead of throwing.

```typescript
// packages/core/src/types/result.ts
type Result<T, E = Error>
  = | { success: true, data: T }
    | { success: false, error: E }

// API that never throws
async function signData(data: string): Promise<Result<SignResult, SignError>> {
  try {
    const signature = await doSign(data)
    return { success: true, data: signature }
  }
  catch (e) {
    return { success: false, error: normalizeError(e) }
  }
}

// Usage - forced to handle errors
const result = await signData(data)
if (result.success) {
  console.log(result.data.signature)
}
else {
  console.error(result.error.message)
}
```

#### 2.4 Type-Safe Event Emitter
Fully typed events.

```typescript
// Autocomplete for event names and payload types
client.on('sign:complete', (payload) => {
  // payload is automatically typed as { signature: string }
})
```

#### 2.5 Template Literal Types for Paths
Type-safe configuration paths.

```typescript
type LocalePath = `${SupportedLocale}.${ErrorMessageKey}`

function getMessage(path: LocalePath): string
getMessage('en.WRONG_PASSWORD') // ✅
getMessage('xx.INVALID') // ❌ Type error
```

---

## 3. Error Handling: 8 → 10

### Current State
- Custom error classes
- Retry with backoff
- i18n error messages

### Missing for 10/10

#### 3.1 Error Recovery Strategies
Automatic recovery for common errors.

```typescript
// packages/core/src/recovery.ts
interface RecoveryStrategy {
  canRecover: (error: Error) => boolean
  recover: (error: Error, context: OperationContext) => Promise<void>
}

const strategies: RecoveryStrategy[] = [
  // Reconnect on connection lost
  {
    canRecover: e => e.code === 'CONNECTION_LOST',
    recover: async (e, ctx) => {
      await ctx.client.reconnect()
    }
  },
  // Refresh certificates on expiry
  {
    canRecover: e => e.code === 'CERTIFICATE_EXPIRED',
    recover: async (e, ctx) => {
      await ctx.client.refreshCertificates()
    }
  }
]
```

#### 3.2 Error Boundaries (Vue)
Component-level error handling.

```typescript
// packages/vue/src/components/ESignatureErrorBoundary.vue
<template>
  <slot v-if="!error" />
  <slot v-else name="error" :error="error" :retry="retry">
    <div class="eimzo-error">
      {{ error.message }}
      <button @click="retry">Retry</button>
    </div>
  </slot>
</template>

// Usage
<ESignatureErrorBoundary>
  <CertificateSelector />
  <template #error="{ error, retry }">
    <CustomErrorUI :error="error" @retry="retry" />
  </template>
</ESignatureErrorBoundary>
```

#### 3.3 Error Aggregation
Collect multiple errors in batch operations.

```typescript
// packages/core/src/errors/aggregate.ts
class AggregateSignError extends Error {
  constructor(
    public errors: SignError[],
    public successfulSignatures: string[]
  ) {
    super(`${errors.length} of ${errors.length + successfulSignatures.length} signatures failed`)
  }
}

// Batch signing with partial success
const results = await client.signBatch(documents)
// results.successful: string[]
// results.failed: { document: string; error: Error }[]
```

#### 3.4 Structured Error Context
Rich error context for debugging.

```typescript
// packages/core/src/errors/base.ts
class EIMZOError extends Error {
  readonly code: ErrorCode
  readonly context: ErrorContext
  readonly timestamp: Date
  readonly correlationId: string
  readonly stack: string
  readonly cause?: Error

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      stack: this.stack
    }
  }
}
```

---

## 4. Developer Experience: 7 → 10

### Current State
- Basic README
- Example components

### Missing for 10/10

#### 4.1 Comprehensive Documentation Site

```
apps/docs/
├── pages/
│   ├── getting-started/
│   │   ├── installation.md
│   │   ├── quick-start.md
│   │   └── configuration.md
│   ├── guide/
│   │   ├── core-concepts.md
│   │   ├── certificates.md
│   │   ├── signing.md
│   │   ├── error-handling.md
│   │   └── i18n.md
│   ├── frameworks/
│   │   ├── vue.md
│   │   ├── react.md
│   │   ├── nuxt.md
│   │   └── vanilla.md
│   ├── api/
│   │   ├── core.md
│   │   ├── vue.md
│   │   └── types.md
│   ├── examples/
│   │   ├── basic-signing.md
│   │   ├── certificate-selection.md
│   │   └── error-handling.md
```

**Tools:** VitePress or Astro Starlight

#### 4.2 Vue DevTools Integration

```typescript
// packages/vue/src/devtools.ts
import { setupDevtoolsPlugin } from '@vue/devtools-api'

export function setupDevtools(app: App, signer: ESignature) {
  setupDevtoolsPlugin({
    id: 'eimzo-devtools',
    label: 'E-IMZO',
    app
  }, (api) => {
    // Custom inspector
    api.addInspector({
      id: 'eimzo',
      label: 'E-IMZO',
      icon: 'security'
    })

    // Show certificates in inspector
    api.on.getInspectorTree((payload) => {
      if (payload.inspectorId === 'eimzo') {
        payload.rootNodes = [
          { id: 'connection', label: `Connection: ${signer.connectionState}` },
          { id: 'certificates', label: `Certificates (${signer.certificates.length})` }
        ]
      }
    })

    // Timeline events
    signer.on('sign:complete', (data) => {
      api.addTimelineEvent({
        layerId: 'eimzo',
        event: {
          title: 'Signature Created',
          data
        }
      })
    })
  })
}
```

#### 4.3 CLI Tool

```bash
# Create new project with E-IMZO
npx create-eimzo-app my-app

# Add E-IMZO to existing project
npx @eimzo/cli init

# Generate certificate mock for testing
npx @eimzo/cli mock:certificate

# Validate E-IMZO installation
npx @eimzo/cli doctor
```

```typescript
// packages/cli/src/commands/init.ts
export async function init() {
  const framework = await select({
    message: 'Select framework',
    choices: ['Vue', 'React', 'Nuxt', 'Next.js', 'Vanilla']
  })

  const features = await checkbox({
    message: 'Select features',
    choices: ['TypeScript', 'i18n', 'DevTools', 'Error Boundary']
  })

  // Generate config and install deps
  await generateConfig(framework, features)
  await installDependencies(framework)
}
```

#### 4.4 Interactive Playground

```typescript
// apps/playground - Interactive demo site
// - Try signing without installing E-IMZO (mock mode)
// - Copy-paste code examples
// - Test different configurations
// - Debug common issues
```

#### 4.5 Code Snippets for IDEs

```json
// .vscode/eimzo.code-snippets
{
  "E-IMZO Vue Setup": {
    "prefix": "eimzo-vue-setup",
    "body": [
      "import { useESignature } from '@eimzo/vue'",
      "",
      "const {",
      "  isInstalled,",
      "  certificates,",
      "  install,",
      "  listKeys,",
      "  loadKey,",
      "  signData",
      "} = useESignature()",
      "",
      "onMounted(async () => {",
      "  await install()",
      "  await listKeys()",
      "})"
    ]
  }
}
```

#### 4.6 TypeDoc API Reference
Auto-generated API docs from JSDoc.

```typescript
/**
 * Signs data using the loaded certificate key.
 *
 * @param keyId - The ID of the loaded key (from loadKey result)
 * @param data - The data to sign (will be Base64 encoded)
 * @param options - Optional signing options
 * @returns The PKCS7 signature result
 *
 * @example
 * ```typescript
 * const { id } = await loadKey(certificate)
 * const result = await signData(id, 'Hello, World!')
 * console.log(result.pkcs7_64) // Base64 signature
 * ```
 *
 * @throws {EIMZOError} If signing fails
 * @see {@link loadKey} for loading a key first
 */
async signData(
  keyId: KeyId,
  data: string,
  options?: SignOptions
): Promise<SignResult>
```

---

## 5. Code Quality: 8 → 10

### Current State
- TypeScript strict mode
- Vitest setup

### Missing for 10/10

#### 5.1 Comprehensive Test Coverage

```
Target: 90%+ coverage

packages/core/
├── src/
│   ├── client.ts           → client.test.ts (unit)
│   ├── capiws.ts           → capiws.test.ts (unit)
│   └── utils/
│       └── resilience.ts   → resilience.test.ts (unit)
├── tests/
│   ├── integration/        → E2E with mock server
│   └── fixtures/           → Test certificates, responses
```

```typescript
// packages/core/tests/integration/signing.test.ts
import { createMockEIMZOServer } from '@eimzo/test-utils'

describe('Signing Integration', () => {
  let server: MockEIMZOServer
  let client: EIMZOClient

  beforeAll(async () => {
    server = await createMockEIMZOServer({ port: 64443 })
    client = new EIMZOClient()
  })

  afterAll(() => server.close())

  it('completes full PFX signing workflow', async () => {
    await client.install()
    const certs = await client.listAllUserKeys()
    const { id } = await client.loadKey(certs[0], 'password')
    const result = await client.createPkcs7(id, 'test data')

    expect(result.pkcs7_64).toMatch(/^[A-Z0-9+/=]+$/i)
  })
})
```

#### 5.2 E2E Testing Package

```typescript
// Usage in user's tests
import { createMockEIMZOServer } from '@eimzo/test-utils'

export { createMockCertificate } from './mock-certificate'
// packages/test-utils/src/index.ts
export { createMockEIMZOServer } from './mock-server'
export { createTestClient } from './test-client'

const server = await createMockEIMZOServer({
  certificates: [mockPfxCertificate, mockFtjcCertificate],
  delay: 100, // Simulate network latency
  failureRate: 0.1 // 10% random failures
})
```

#### 5.3 Strict Linting

```javascript
// eslint.config.js
export default [
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'no-console': 'error',
      'no-debugger': 'error'
    }
  }
]
```

#### 5.4 Git Hooks

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged
pnpm typecheck
```

#### 5.5 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: pnpm pack --recursive

  release:
    if: github.ref == 'refs/heads/main'
    needs: [test, build]
    runs-on: ubuntu-latest
    steps:
      - uses: changesets/action@v1
        with:
          publish: pnpm release
```

#### 5.6 Automated Dependency Updates

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      dev-dependencies:
        patterns: ['*']
        dependency-type: development
```

---

## 6. Extensibility: 7 → 10

### Current State
- Limited configuration options
- Hardcoded values

### Missing for 10/10

#### 6.1 Plugin System

```typescript
// packages/core/src/plugins.ts
interface EIMZOPlugin {
  name: string
  version: string
  install: (client: EIMZOClient, options?: any) => void
}

// Example: Logging plugin
const loggingPlugin: EIMZOPlugin = {
  name: 'logging',
  version: '1.0.0',
  install(client) {
    client.use(async (ctx, next) => {
      console.log(`[${ctx.operation}]`, ctx.args)
      return next()
    })
  }
}

// Example: Analytics plugin
const analyticsPlugin: EIMZOPlugin = {
  name: 'analytics',
  version: '1.0.0',
  install(client, options: { trackingId: string }) {
    client.on('sign:complete', () => {
      sendAnalytics(options.trackingId, 'signature_created')
    })
  }
}

// Usage
const client = createEIMZOClient({
  plugins: [
    loggingPlugin,
    [analyticsPlugin, { trackingId: 'UA-XXX' }]
  ]
})
```

#### 6.2 Custom Certificate Parsers

```typescript
// packages/core/src/parsers.ts
interface CertificateParser {
  type: string
  parse: (raw: RawCertificate) => Certificate
  validate: (cert: Certificate) => boolean
}

// Register custom parser
client.registerParser({
  type: 'custom-token',
  parse(raw) {
    return {
      ...parseBaseCertificate(raw),
      customField: raw.metadata.custom
    }
  },
  validate(cert) {
    return cert.customField !== undefined
  }
})
```

#### 6.3 Custom Transport

```typescript
// packages/core/src/transports.ts
interface Transport {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  send: (message: Message) => Promise<Response>
}

// WebSocket transport (default)
class WebSocketTransport implements Transport { }

// HTTP transport (alternative)
class HTTPTransport implements Transport { }

// Mock transport (testing)
class MockTransport implements Transport { }

// Usage
const client = createEIMZOClient({
  transport: new HTTPTransport({ baseUrl: 'http://localhost:8080' })
})
```

#### 6.4 Hooks API

```typescript
// packages/core/src/hooks.ts
const client = createEIMZOClient({
  hooks: {
    // Before any operation
    beforeOperation: async (ctx) => {
      ctx.metadata.startTime = Date.now()
    },

    // After any operation
    afterOperation: async (ctx, result) => {
      const duration = Date.now() - ctx.metadata.startTime
      metrics.record(ctx.operation, duration)
    },

    // Before signing
    beforeSign: async (ctx) => {
      // Add timestamp to data
      ctx.args.data = JSON.stringify({
        data: ctx.args.data,
        timestamp: Date.now()
      })
    },

    // After signing
    afterSign: async (ctx, result) => {
      // Log signature hash
      console.log('Signature hash:', hash(result.pkcs7_64))
    },

    // On error
    onError: async (ctx, error) => {
      await errorReporter.capture(error, ctx)
    }
  }
})
```

#### 6.5 Configuration Presets

```typescript
// packages/core/src/presets.ts
export const presets = {
  // Development preset
  development: {
    timeout: 60000,
    enableRetry: true,
    maxRetries: 5,
    logging: true
  },

  // Production preset
  production: {
    timeout: 30000,
    enableRetry: true,
    maxRetries: 3,
    logging: false
  },

  // Testing preset
  testing: {
    timeout: 5000,
    enableRetry: false,
    transport: new MockTransport()
  }
}

// Usage
const client = createEIMZOClient({
  preset: 'production',
  // Override specific options
  timeout: 45000
})
```

---

## 7. Publishing/DX: 7 → 10

### Current State
- Basic npm publishing
- Core as dependency (not peer)

### Missing for 10/10

#### 7.1 Peer Dependencies (Done in IMPROVEMENTS.md)

#### 7.2 Package Provenance

```json
// package.json
{
  "publishConfig": {
    "provenance": true,
    "access": "public"
  }
}
```

#### 7.3 Size Tracking

```yaml
# .github/workflows/size.yml
- uses: preactjs/compressed-size-action@v2
  with:
    pattern: './packages/*/dist/**/*.js'
```

#### 7.4 Changelog Generation

```bash
# Automated with changesets
pnpm changeset        # Create changeset
pnpm changeset version # Update versions
pnpm changeset publish # Publish to npm
```

#### 7.5 Release Announcements

```yaml
# .github/workflows/release.yml
- name: Create GitHub Release
  uses: softprops/action-gh-release@v1
  with:
    generate_release_notes: true

- name: Announce on Twitter
  uses: ethomson/send-tweet-action@v1
  with:
    status: '🚀 @eimzo/core v${{ version }} released! ${{ release_notes_url }}'
```

#### 7.6 npm README Badges

```markdown
# @eimzo/core

[![npm version](https://img.shields.io/npm/v/@eimzo/core)](https://npmjs.com/package/@eimzo/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@eimzo/core)](https://bundlephobia.com/package/@eimzo/core)
[![downloads](https://img.shields.io/npm/dm/@eimzo/core)](https://npmjs.com/package/@eimzo/core)
[![license](https://img.shields.io/npm/l/@eimzo/core)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://typescriptlang.org)
```

---

## Summary: Complete 10/10 Checklist

### Architecture Design (10/10)
- [ ] Middleware/plugin system
- [ ] WebSocket adapter abstraction
- [ ] Event emitter pattern
- [ ] Dependency injection

### Type Safety (10/10)
- [ ] Branded types for IDs
- [ ] Const assertions for codes
- [ ] Result type (no throws)
- [ ] Typed event emitter
- [ ] Template literal types

### Error Handling (10/10)
- [ ] Recovery strategies
- [ ] Error boundaries (Vue)
- [ ] Aggregate errors
- [ ] Structured error context
- [ ] Error codes enum

### Developer Experience (10/10)
- [ ] VitePress documentation site
- [ ] Vue DevTools integration
- [ ] CLI tool (init, doctor)
- [ ] Interactive playground
- [ ] IDE code snippets
- [ ] TypeDoc API reference

### Code Quality (10/10)
- [ ] 90%+ test coverage
- [ ] E2E test utilities
- [ ] Strict ESLint config
- [ ] Git hooks (husky)
- [ ] CI/CD pipeline
- [ ] Dependabot

### Extensibility (10/10)
- [ ] Plugin system
- [ ] Custom certificate parsers
- [ ] Custom transports
- [ ] Hooks API
- [ ] Configuration presets

### Publishing/DX (10/10)
- [ ] Peer dependencies
- [ ] Package provenance
- [ ] Size tracking
- [ ] Changesets
- [ ] Release automation
- [ ] npm badges

---

## Implementation Phases

### Phase 1: Foundation (v2.1)
- Peer dependencies
- Basic plugin system
- Error recovery
- 80% test coverage

### Phase 2: DX (v2.2)
- Documentation site
- Vue DevTools
- CLI tool basics
- TypeDoc

### Phase 3: Power Users (v2.3)
- Full middleware system
- Custom transports
- Hooks API
- Presets

### Phase 4: Polish (v3.0)
- Branded types
- Result types
- Full plugin ecosystem
- 95% test coverage

---

## Estimated Effort

| Category | Effort | Priority |
|----------|--------|----------|
| Architecture | 3 weeks | High |
| Type Safety | 1 week | Medium |
| Error Handling | 2 weeks | High |
| Developer Experience | 4 weeks | High |
| Code Quality | 2 weeks | High |
| Extensibility | 3 weeks | Medium |
| Publishing | 1 week | High |

**Total: ~16 weeks for complete 10/10**

---

## Reference SDKs

Study these for best practices:
- **TanStack Query** - Plugin system, DevTools
- **Zod** - Type inference, chaining API
- **tRPC** - Middleware, type safety
- **VueUse** - Composables, documentation
- **Pinia** - Vue integration, DevTools
- **Vite** - Plugin system, presets

---

*Created: February 2026*
