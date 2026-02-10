# EIMZO Monorepo Architecture

This document describes the architecture, patterns, and guidelines for the EIMZO SDK monorepo.

## Table of Contents

- [Overview](#overview)
- [Layer Architecture](#layer-architecture)
- [Package Structure](#package-structure)
- [Key Patterns](#key-patterns)
- [Strengths](#strengths)
- [Areas for Improvement](#areas-for-improvement)
- [Best Practices Checklist](#best-practices-checklist)
- [Future Implementation Guidelines](#future-implementation-guidelines)

---

## Overview

The EIMZO monorepo is a TypeScript-based SDK for integrating with Uzbekistan's E-IMZO digital signature system. It provides:

- **@eimzo/core**: Framework-agnostic core library (zero dependencies)
- **@eimzo/vue**: Vue 3 plugin and composables
- **@eimzo/nuxt**: Nuxt module (planned)

## Layer Architecture

The SDK follows a **5-layer plugin architecture**:

```
┌─────────────────────────────────────────────┐
│         VueESignature Plugin                │  ← Vue integration layer
│         (plugin.ts)                         │
├─────────────────────────────────────────────┤
│         useESignature Composable            │  ← Reactive state management
│         (composable.ts)                     │
├─────────────────────────────────────────────┤
│         ESignature Class                    │  ← Resilience wrapper
│         (eimzo.ts)                          │     (timeout + retry)
├─────────────────────────────────────────────┤
│         EIMZOClient                         │  ← Business logic
│         (client.ts)                         │     (certificates, signing)
├─────────────────────────────────────────────┤
│         CAPIWS                              │  ← WebSocket protocol
│         (capiws.ts)                         │
├─────────────────────────────────────────────┤
│         E-IMZO Application                  │  ← External localhost server
│         (localhost:64443/64646)             │
└─────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | File | Responsibility |
|-------|------|----------------|
| Vue Plugin | `plugin.ts` | Dependency injection, global properties |
| Composable | `composable.ts` | Reactive state, Vue lifecycle integration |
| ESignature | `eimzo.ts` | Resilience (timeout, retry, backoff) |
| EIMZOClient | `client.ts` | Certificate management, signing operations |
| CAPIWS | `capiws.ts` | WebSocket connection, JSON-RPC protocol |

---

## Package Structure

```
eimzo-monorepo/
├── packages/
│   ├── core/                    # Framework-agnostic core
│   │   └── src/
│   │       ├── index.ts         # Main exports
│   │       ├── types.ts         # Type definitions
│   │       ├── client.ts        # EIMZOClient
│   │       ├── capiws.ts        # WebSocket wrapper
│   │       ├── utils/
│   │       │   ├── resilience.ts    # Timeout/retry logic
│   │       │   └── eimzo-detector.ts
│   │       ├── crypto/          # CRC32, GOST hash
│   │       ├── i18n/            # Internationalization
│   │       └── mobile/          # QR code support
│   │
│   ├── vue/                     # Vue 3 integration
│   │   └── src/
│   │       ├── index.ts         # Package exports
│   │       ├── plugin.ts        # VueESignature plugin
│   │       ├── composable.ts    # useESignature()
│   │       └── eimzo.ts         # ESignature class
│   │
│   └── nuxt/                    # Nuxt module (planned)
│
├── apps/
│   ├── docs/                    # Documentation site
│   └── playground/              # Development playground
│
└── examples/
    ├── vue/                     # Vue example components
    └── react/                   # React examples (planned)
```

---

## Key Patterns

### 1. Discriminated Unions for Certificate Types

```typescript
interface PfxCertificate extends BaseCertificate {
  type: 'pfx'
  disk: string
  path: string
}

interface FtjcCertificate extends BaseCertificate {
  type: 'ftjc'
  cardUID: string
}

type Certificate = PfxCertificate | FtjcCertificate
```

### 2. Resilience with Exponential Backoff

```typescript
const result = await withResilience(operation, {
  timeout: 30000,
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  isRetryable: isTransientError
})
```

### 3. Vue Plugin with Injection Key

```typescript
export const ESIGNATURE_INJECTION_KEY: InjectionKey<ESignature> = Symbol('esignature')

export const VueESignature = {
  install(app: App, options?: ESignaturePluginOptions) {
    const signer = new ESignature()
    app.provide(ESIGNATURE_INJECTION_KEY, signer)
    app.config.globalProperties.$esignature = signer
  }
}
```

### 4. Multiple Access Patterns

```typescript
// Composable (recommended)
const { signData } = useESignature()

// Injection
const signer = inject(ESIGNATURE_INJECTION_KEY)

// Global property (Options API)
this.$esignature.signData()
```

### 5. Modular Sub-package Exports

```typescript
// Main package
import { EIMZOClient } from '@eimzo/core'

// Sub-packages (tree-shakeable)
import { crc32 } from '@eimzo/core/crypto'
import { setLocale } from '@eimzo/core/i18n'
import { EIMZOMobile } from '@eimzo/core/mobile'
```

---

## Strengths

| Aspect | Description |
|--------|-------------|
| Zero Dependencies | Core has no npm dependencies - fully self-contained |
| Type Safety | Discriminated unions, module augmentation, Symbol injection keys |
| Resilience | Built-in timeout + retry with exponential backoff |
| i18n First | All error messages support 3 languages (en, ru, uz) |
| Framework Agnostic | Core works standalone; Vue is optional |
| Modular Exports | Sub-packages can be independently imported |
| Clean Separation | Each layer has single responsibility |

---

## Areas for Improvement

### High Priority

1. **Plugin Lifecycle Hooks**
   ```typescript
   // TODO: Add to ESignaturePluginOptions
   interface ESignaturePluginOptions {
     apiKeys?: ApiKeyPair[]
     onInstall?: () => void
     onConnect?: () => void
     onDisconnect?: () => void
     onError?: (error: Error) => void
   }
   ```

2. **Connection Singleton**
   - Each ESignature instance creates new WebSocket
   - Implement shared connection pool

3. **AbortController Support**
   ```typescript
   // TODO: Add cancellation to all async operations
   const { signal } = new AbortController()
   await signer.signData(data, { signal })
   ```

### Medium Priority

4. **Request Deduplication**
   - Concurrent calls to same operation should be deduplicated
   - Prevents race conditions with hardware tokens

5. **Configurable Ports**
   - Ports 64443/64646 are hardcoded
   - Make configurable for enterprise environments

6. **Shared Composable State**
   - Each `useESignature()` gets separate state
   - Consider Pinia integration or `effectScope`

### Low Priority

7. **Error Telemetry Hooks**
   ```typescript
   const { onError } = useESignature({
     onError: err => analytics.track(err)
   })
   ```

8. **Integration Tests**
   - Add E2E tests for full signing workflow

---

## Best Practices Checklist

Use this checklist when adding new features or packages:

### Build & Package

- [ ] TypeScript strict mode enabled
- [ ] Dual format output (ESM + CJS)
- [ ] Source maps generated
- [ ] Tree-shaking enabled (`sideEffects: false`)
- [ ] Proper `exports` field in package.json
- [ ] Type declarations (.d.ts) generated
- [ ] Peer dependencies correctly declared

### Code Quality

- [ ] Zero runtime dependencies (for core packages)
- [ ] Custom error classes extend Error
- [ ] All user-facing strings use i18n
- [ ] Resilience wrapper for external calls
- [ ] Discriminated unions for type variants

### Vue Integration

- [ ] Symbol-based injection key
- [ ] Module augmentation for global properties
- [ ] Composable returns readonly refs
- [ ] Cleanup in `onUnmounted`

### Documentation

- [ ] JSDoc for public APIs
- [ ] Example usage in README
- [ ] Changelog entry (changesets)

---

## Future Implementation Guidelines

### Adding a New Framework Integration (e.g., React)

1. Create package at `packages/react/`
2. Depend on `@eimzo/core` as workspace dependency
3. Framework library as peer dependency
4. Wrap `ESignature` class with framework primitives
5. Re-export all core types
6. Add examples at `examples/react/`

### Adding New Certificate Types

1. Add interface extending `BaseCertificate` in `types.ts`
2. Add type discriminator field
3. Update `Certificate` union type
4. Add parsing logic in `client.ts`
5. Add i18n messages for new errors

### Adding New Hardware Support

1. Add plugin name constant in `capiws.ts`
2. Add detection method in `EIMZOClient`
3. Add signing method in `EIMZOClient`
4. Wrap in `ESignature` with resilience
5. Expose in composable
6. Update version check if needed

---

## Architecture Score: 8/10

| Category | Score | Notes |
|----------|-------|-------|
| Design | 9/10 | Clean layers, good separation |
| Type Safety | 9/10 | Excellent TypeScript usage |
| Error Handling | 8/10 | Good resilience, some edge cases missing |
| Developer Experience | 7/10 | Needs better docs, more hooks |
| Code Quality | 8/10 | Clean, consistent patterns |
| Extensibility | 7/10 | Some hardcoded values, limited hooks |

---

*Last updated: February 2026*
