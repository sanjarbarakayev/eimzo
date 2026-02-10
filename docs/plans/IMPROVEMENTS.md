# EIMZO SDK Improvement Plan

This document outlines planned improvements for the EIMZO SDK monorepo, prioritized by impact and effort.

---

## Summary

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| P0 | Peer dependency restructure | Low | High |
| P0 | Plugin lifecycle hooks | Medium | High |
| P1 | Connection singleton | Medium | Medium |
| P1 | AbortController support | Medium | Medium |
| P1 | Vue subpath exports | Low | Medium |
| P2 | Request deduplication | High | Medium |
| P2 | Configurable ports | Low | Low |
| P2 | Shared composable state | Medium | Medium |
| P3 | Error telemetry hooks | Low | Low |
| P3 | Integration tests | High | High |

---

## P0 - Critical (Do First)

### 1. Peer Dependency Restructure

**Problem:** `@eimzo/core` is a regular dependency of `@eimzo/vue`, causing potential bundle duplication.

**Solution:** Move to peer dependency pattern.

**Files to modify:**
- [ ] `packages/vue/package.json`

**Changes:**

```diff
// packages/vue/package.json
{
- "dependencies": {
-   "@eimzo/core": "workspace:*"
- },
  "peerDependencies": {
    "vue": "^3.3.0",
+   "@eimzo/core": "^2.0.0"
  },
+ "peerDependenciesMeta": {
+   "@eimzo/core": {
+     "optional": false
+   }
+ },
  "devDependencies": {
+   "@eimzo/core": "workspace:*",
    "tsup": "^8.0.0",
    ...
  }
}
```

**Testing:**
- [ ] Build packages
- [ ] Test in fresh Vue project with `npm install @eimzo/vue`
- [ ] Verify single copy of core in bundle
- [ ] Test with pnpm, npm, yarn

---

### 2. Plugin Lifecycle Hooks

**Problem:** No way to hook into plugin lifecycle for logging, analytics, or custom behavior.

**Solution:** Add lifecycle hooks to plugin options.

**Files to modify:**
- [ ] `packages/vue/src/plugin.ts`
- [ ] `packages/vue/src/eimzo.ts`
- [ ] `packages/vue/src/composable.ts`
- [ ] `packages/core/src/types.ts`

**New Types:**

```typescript
// packages/core/src/types.ts
export interface ESignatureLifecycleHooks {
  onInstall?: () => void | Promise<void>
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error, context: ErrorContext) => void
  onSign?: (result: SignResult) => void
  onRetry?: (attempt: number, error: Error, delay: number) => void
}

export interface ErrorContext {
  operation: string
  timestamp: Date
  correlationId?: string
}
```

**Plugin Options Update:**

```typescript
// packages/vue/src/plugin.ts
export interface ESignaturePluginOptions {
  apiKeys?: ApiKeyPair[]
  autoInstall?: boolean
  hooks?: ESignatureLifecycleHooks // NEW
}

export const VueESignature = {
  install(app: App, options?: ESignaturePluginOptions): void {
    const signer = new ESignature({
      hooks: options?.hooks // Pass hooks to ESignature
    })
    // ...
  }
}
```

**Usage Example:**

```typescript
app.use(VueESignature, {
  apiKeys: [...],
  hooks: {
    onConnect: () => console.log('Connected to E-IMZO'),
    onError: (error, ctx) => {
      analytics.track('eimzo_error', {
        error: error.message,
        operation: ctx.operation
      })
    },
    onSign: (result) => {
      analytics.track('document_signed')
    }
  }
})
```

**Testing:**
- [ ] Unit test each hook is called at correct time
- [ ] Test async hooks
- [ ] Test error in hook doesn't break main flow

---

## P1 - High Priority

### 3. Connection Singleton

**Problem:** Each `ESignature` instance creates a new WebSocket connection.

**Solution:** Implement shared connection manager.

**Files to modify:**
- [ ] `packages/core/src/connection-manager.ts` (NEW)
- [ ] `packages/core/src/capiws.ts`
- [ ] `packages/core/src/client.ts`
- [ ] `packages/core/src/index.ts`

**Design:**

```typescript
// packages/core/src/connection-manager.ts
class ConnectionManager {
  private static instance: ConnectionManager
  private connection: CAPIWS | null = null
  private refCount = 0

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  acquire(): CAPIWS {
    if (!this.connection) {
      this.connection = new CAPIWS()
    }
    this.refCount++
    return this.connection
  }

  release(): void {
    this.refCount--
    if (this.refCount === 0) {
      this.connection?.close()
      this.connection = null
    }
  }
}
```

**Testing:**
- [ ] Multiple ESignature instances share connection
- [ ] Connection closes when all instances released
- [ ] Reconnection works after close

---

### 4. AbortController Support

**Problem:** Long-running operations cannot be cancelled.

**Solution:** Add AbortSignal support to all async methods.

**Files to modify:**
- [ ] `packages/core/src/types.ts`
- [ ] `packages/core/src/utils/resilience.ts`
- [ ] `packages/core/src/client.ts`
- [ ] `packages/vue/src/eimzo.ts`
- [ ] `packages/vue/src/composable.ts`

**API Design:**

```typescript
// All async methods accept options with signal
interface OperationOptions {
  signal?: AbortSignal
  timeout?: number
}

// Usage
const controller = new AbortController()

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000)

try {
  const result = await signer.signData(data, {
    signal: controller.signal
  })
}
catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled')
  }
}
```

**Resilience Integration:**

```typescript
// packages/core/src/utils/resilience.ts
export async function withResilience<T>(
  operation: () => Promise<T>,
  options: ResilienceOptions & { signal?: AbortSignal }
): Promise<T> {
  const { signal, ...resilienceOpts } = options

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Listen for abort during operation
  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', abortHandler)

    executeWithResilience(operation, resilienceOpts)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal?.removeEventListener('abort', abortHandler)
      })
  })
}
```

**Testing:**
- [ ] Abort before operation starts
- [ ] Abort during operation
- [ ] Abort during retry wait
- [ ] Cleanup after abort

---

### 5. Vue Subpath Exports

**Problem:** Can't import just composables or just plugin.

**Solution:** Add subpath exports.

**Files to modify:**
- [ ] `packages/vue/package.json`
- [ ] `packages/vue/tsup.config.ts`
- [ ] `packages/vue/src/composables/index.ts` (NEW)
- [ ] `packages/vue/src/plugin/index.ts` (NEW)

**Package.json:**

```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./composables": {
      "import": { "types": "./dist/composables.d.ts", "default": "./dist/composables.js" },
      "require": { "types": "./dist/composables.d.cts", "default": "./dist/composables.cjs" }
    },
    "./plugin": {
      "import": { "types": "./dist/plugin.d.ts", "default": "./dist/plugin.js" },
      "require": { "types": "./dist/plugin.d.cts", "default": "./dist/plugin.cjs" }
    }
  }
}
```

**Usage:**

```typescript
// Full package
import { useESignature, VueESignature } from '@eimzo/vue'

// Just composables (smaller bundle)
import { useESignature } from '@eimzo/vue/composables'

// Just plugin
import { VueESignature } from '@eimzo/vue/plugin'
```

---

## P2 - Medium Priority

### 6. Request Deduplication

**Problem:** Concurrent identical requests aren't deduplicated.

**Solution:** Implement request coalescing.

**Files to modify:**
- [ ] `packages/core/src/utils/request-dedup.ts` (NEW)
- [ ] `packages/core/src/client.ts`

**Design:**

```typescript
// packages/core/src/utils/request-dedup.ts
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()

  async dedupe<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>
    }

    const promise = operation().finally(() => {
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }
}

// Usage in EIMZOClient
async listAllUserKeys(): Promise<Certificate[]> {
  return this.dedup.dedupe('listAllUserKeys', async () => {
    // actual implementation
  })
}
```

---

### 7. Configurable Ports

**Problem:** Ports 64443/64646 are hardcoded.

**Solution:** Make ports configurable.

**Files to modify:**
- [ ] `packages/core/src/types.ts`
- [ ] `packages/core/src/capiws.ts`
- [ ] `packages/core/src/utils/eimzo-detector.ts`

**Design:**

```typescript
// packages/core/src/types.ts
export interface CAPIWSOptions {
  host?: string // default: '127.0.0.1'
  wssPort?: number // default: 64443
  wsPort?: number // default: 64646
  path?: string // default: '/service/cryptapi'
}

// Usage
const client = new EIMZOClient({
  connection: {
    wssPort: 64444, // Custom port
    wsPort: 64647
  }
})
```

---

### 8. Shared Composable State (Pinia Integration)

**Problem:** Each `useESignature()` call creates separate state.

**Solution:** Optional Pinia store for shared state.

**Files to create:**
- [ ] `packages/vue/src/store.ts` (NEW)
- [ ] `packages/vue/src/composable-with-store.ts` (NEW)

**Design:**

```typescript
// packages/vue/src/store.ts
import { defineStore } from 'pinia'

export const useESignatureStore = defineStore('esignature', {
  state: () => ({
    isInstalled: false,
    certificates: [] as Certificate[],
    loadedKeyId: null as string | null,
    connectionState: 'disconnected' as ConnectionState
  }),
  actions: {
    async install() { ... },
    async listKeys() { ... }
  }
})

// Optional usage - user opts in
import { useESignatureStore } from '@eimzo/vue/store'
```

---

## P3 - Low Priority

### 9. Error Telemetry Hooks

**Problem:** Hard to track errors across the app.

**Solution:** Global error handler registration.

**Files to modify:**
- [ ] `packages/core/src/telemetry.ts` (NEW)
- [ ] `packages/core/src/index.ts`

**Design:**

```typescript
// packages/core/src/telemetry.ts
type ErrorHandler = (error: Error, context: ErrorContext) => void

class Telemetry {
  private handlers: ErrorHandler[] = []

  onError(handler: ErrorHandler): () => void {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler)
    }
  }

  reportError(error: Error, context: ErrorContext): void {
    this.handlers.forEach(h => h(error, context))
  }
}

export const telemetry = new Telemetry()
```

---

### 10. Integration Tests

**Problem:** No E2E tests for full signing workflow.

**Solution:** Add integration test suite.

**Files to create:**
- [ ] `packages/core/tests/integration/` (NEW)
- [ ] `packages/vue/tests/integration/` (NEW)
- [ ] Mock E-IMZO server for testing

**Test Cases:**
- [ ] Full PFX signing workflow
- [ ] Full FTJC signing workflow
- [ ] Connection failure and retry
- [ ] Timeout handling
- [ ] Multiple concurrent operations
- [ ] Plugin installation in Vue app
- [ ] Composable lifecycle

---

## Implementation Order

```
Phase 1 (Foundation):
├── 1. Peer dependency restructure
└── 2. Plugin lifecycle hooks

Phase 2 (Reliability):
├── 3. Connection singleton
├── 4. AbortController support
└── 5. Vue subpath exports

Phase 3 (Polish):
├── 6. Request deduplication
├── 7. Configurable ports
└── 8. Shared composable state

Phase 4 (Quality):
├── 9. Error telemetry hooks
└── 10. Integration tests
```

---

## Version Planning

| Version | Improvements | Breaking Changes |
|---------|--------------|------------------|
| 2.1.0 | #1 Peer deps, #2 Lifecycle hooks | Yes (peer dep) |
| 2.2.0 | #3 Singleton, #4 AbortController, #5 Subpaths | No |
| 2.3.0 | #6 Dedup, #7 Ports, #8 Pinia | No |
| 3.0.0 | #9 Telemetry, #10 Tests, API cleanup | Possible |

---

## Notes

- All changes should include:
  - [ ] TypeScript types
  - [ ] Unit tests
  - [ ] Documentation updates
  - [ ] Changelog entry (changeset)

- Breaking changes require:
  - [ ] Migration guide
  - [ ] Major version bump
  - [ ] Deprecation warnings in prior version

---

*Created: February 2026*
