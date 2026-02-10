# EIMZO SDK Project Guidelines

Project-specific skill for the EIMZO monorepo - a TypeScript SDK for Uzbekistan's E-IMZO electronic signature system.

**Repository:** [@eimzo/monorepo](https://github.com/sanjar/eimzo-monorepo)

---

## When to Use

Reference this skill when working on the EIMZO SDK. This skill contains:
- 5-layer architecture overview
- Monorepo structure
- Code patterns for WebSocket communication and certificate handling
- Testing requirements
- Publishing workflow

---

## Architecture Overview

**Tech Stack:**
- **Language**: TypeScript 5.3+
- **Build**: tsup (esbuild wrapper)
- **Package Manager**: pnpm with workspaces
- **Testing**: Vitest
- **Publishing**: Changesets for versioning
- **Frameworks**: Vue 3 (with React/Svelte coming later)

**5-Layer Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Framework Integration (@eimzo/vue)                │
│  Vue plugin, composables, reactive state                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: High-Level Client (@eimzo/core)                   │
│  EIMZOClient - User-facing API, certificate management      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: WebSocket Protocol (@eimzo/core)                  │
│  CAPIWS - WebSocket connection, message serialization       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Utilities (@eimzo/core)                           │
│  Retry logic, E-IMZO detection, error handling, i18n        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Types (@eimzo/core)                               │
│  TypeScript interfaces, discriminated unions, type guards   │
└─────────────────────────────────────────────────────────────┘

External Connection:
    CAPIWS → WebSocket (wss://127.0.0.1:64443 or ws://127.0.0.1:64646)
           → E-IMZO Desktop Application (running locally)
```

---

## File Structure

```
eimzo-monorepo/
├── packages/
│   ├── core/                    # @eimzo/core package
│   │   ├── src/
│   │   │   ├── index.ts         # Layer 2: EIMZOClient (main export)
│   │   │   ├── capiws.ts        # Layer 3: WebSocket protocol
│   │   │   ├── types.ts         # Layer 5: TypeScript types
│   │   │   ├── constants.ts     # Constants (ports, timeouts)
│   │   │   ├── utils/           # Layer 4: Utilities
│   │   │   │   ├── resilience.ts      # Retry logic with backoff
│   │   │   │   ├── eimzo-detector.ts  # E-IMZO installation detection
│   │   │   │   ├── i18n.ts            # Error message translations
│   │   │   │   └── logger.ts          # Logging utilities
│   │   │   └── errors/          # Custom error classes
│   │   │       ├── base.ts
│   │   │       └── codes.ts
│   │   ├── tests/               # Vitest unit tests
│   │   ├── package.json
│   │   └── tsup.config.ts       # Build configuration
│   │
│   └── vue/                     # @eimzo/vue package
│       ├── src/
│       │   ├── index.ts         # Main export
│       │   ├── plugin.ts        # Layer 1: Vue plugin (app.use)
│       │   ├── eimzo.ts         # ESignature class (reactive wrapper)
│       │   ├── composable.ts    # useESignature composable
│       │   ├── types.ts         # Vue-specific types
│       │   └── utils/
│       ├── tests/               # Vue component tests
│       ├── package.json
│       └── tsup.config.ts
│
├── examples/                    # Example implementations
│   └── vue-example/            # Vue 3 example app
│
├── docs/                        # Documentation
├── .changeset/                  # Changeset configs
└── .claude/                     # Claude Code configs
    ├── rules/                   # Coding rules
    └── skills/                  # Project skills
```

**Key Files:**
- `packages/core/src/index.ts` - Main entry point, exports EIMZOClient
- `packages/core/src/capiws.ts` - WebSocket communication layer
- `packages/core/src/types.ts` - All TypeScript types (Certificate, SignResult, etc.)
- `packages/vue/src/plugin.ts` - Vue plugin installation
- `packages/vue/src/composable.ts` - Vue Composition API integration

---

## Code Patterns

### 1. Immutability Pattern (CRITICAL)

NEVER mutate objects or arrays. Always create new instances.

```typescript
// WRONG: Mutation
function updateCertificate(cert: Certificate, newName: string): Certificate {
  cert.CN = newName // MUTATION - FORBIDDEN!
  return cert
}

// CORRECT: Immutability
function updateCertificate(cert: Certificate, newName: string): Certificate {
  return {
    ...cert,
    CN: newName
  }
}

// WRONG: Array mutation
certificates.push(newCert)

// CORRECT: Array immutability
const newCertificates = [...certificates, newCert]
```

### 2. WebSocket Communication Pattern

```typescript
// packages/core/src/capiws.ts
export class CAPIWS {
  private ws: WebSocket | null = null
  private messageId = 0

  async call<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    return new Promise((resolve, reject) => {
      const id = ++this.messageId
      const message = { id, method, params }

      // Set up one-time response handler
      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data)
        if (response.id === id) {
          this.ws?.removeEventListener('message', handler)
          if (response.error) {
            reject(new Error(response.error.message))
          }
          else {
            resolve(response.result)
          }
        }
      }

      this.ws.addEventListener('message', handler)
      this.ws.send(JSON.stringify(message))

      // Timeout after 30 seconds
      setTimeout(() => {
        this.ws?.removeEventListener('message', handler)
        reject(new Error('Request timeout'))
      }, 30000)
    })
  }
}
```

### 3. Retry with Exponential Backoff

```typescript
// packages/core/src/utils/resilience.ts
export interface ResilienceOptions {
  enableRetry?: boolean
  maxRetries?: number
  timeout?: number
  onRetry?: (attempt: number, error: Error, delay: number) => void
}

export async function withResilience<T>(
  operation: () => Promise<T>,
  options: ResilienceOptions = {}
): Promise<T> {
  const {
    enableRetry = true,
    maxRetries = 3,
    timeout = 30000,
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout wrapper
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ])
      return result
    }
    catch (error) {
      lastError = error as Error

      if (!enableRetry || attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 2 ** attempt * 1000
      onRetry?.(attempt + 1, lastError, delay)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
```

### 4. Discriminated Union Pattern

```typescript
// packages/core/src/types.ts
export type Certificate
  = | PfxCertificate
    | FtjcCertificate

export interface PfxCertificate {
  type: 'pfx'
  alias: string
  name: string
  path: string
  CN: string
  validFrom: Date
  validTo: Date
  serialNumber: string
}

export interface FtjcCertificate {
  type: 'ftjc'
  disk: string
  path: string
  name: string
  serialNumber: string
  CN: string
  validFrom: Date
  validTo: Date
}

// Type guard
export function isPfxCertificate(cert: Certificate): cert is PfxCertificate {
  return cert.type === 'pfx'
}

// Usage with type narrowing
if (isPfxCertificate(certificate)) {
  console.log(certificate.alias) // OK: PfxCertificate has alias
}
else {
  console.log(certificate.disk) // OK: FtjcCertificate has disk
}
```

### 5. Vue Composable Pattern

```typescript
import type { Certificate, SignResult } from '@eimzo/core'
// packages/vue/src/composable.ts
import { readonly, ref } from 'vue'

export function useESignature(client?: EIMZOClient) {
  // Reactive state (read-only externally)
  const isInstalled = ref(false)
  const certificates = ref<Certificate[]>([])
  const loadedKeyId = ref<string | null>(null)

  // Internal client instance
  const eimzoClient = client || new EIMZOClient()

  // Methods that update state immutably
  async function install(): Promise<void> {
    const result = await eimzoClient.install()
    isInstalled.value = result // Simple assignment, not mutation
  }

  async function listKeys(): Promise<void> {
    const keys = await eimzoClient.listAllUserKeys()
    certificates.value = keys // Replace entire array
  }

  return {
    // Expose read-only state
    isInstalled: readonly(isInstalled),
    certificates: readonly(certificates),
    loadedKeyId: readonly(loadedKeyId),

    // Expose methods
    install,
    listKeys,
    loadKey,
    signData
  }
}
```

### 6. Error Handling with i18n

```typescript
// packages/core/src/utils/i18n.ts
export type SupportedLocale = 'en' | 'ru' | 'uz'

export const errorMessages: Record<SupportedLocale, Record<string, string>> = {
  en: {
    EIMZO_NOT_INSTALLED: 'E-IMZO is not installed',
    WRONG_PASSWORD: 'Incorrect password',
    CERTIFICATE_EXPIRED: 'Certificate has expired'
  },
  ru: {
    EIMZO_NOT_INSTALLED: 'E-IMZO не установлен',
    WRONG_PASSWORD: 'Неверный пароль',
    CERTIFICATE_EXPIRED: 'Срок действия сертификата истек'
  },
  uz: {
    EIMZO_NOT_INSTALLED: 'E-IMZO o\'rnatilmagan',
    WRONG_PASSWORD: 'Noto\'g\'ri parol',
    CERTIFICATE_EXPIRED: 'Sertifikat muddati tugagan'
  }
}

// Usage in error classes
export class EIMZOError extends Error {
  constructor(
    public code: string,
    locale: SupportedLocale = 'en'
  ) {
    const message = errorMessages[locale][code] || code
    super(message)
    this.name = 'EIMZOError'
  }
}
```

---

## Testing Requirements

### Minimum Coverage: 80%

All packages must maintain at least 80% test coverage.

### Core Package Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @eimzo/core test

# Run with coverage
pnpm --filter @eimzo/core test:coverage

# Watch mode during development
pnpm --filter @eimzo/core test:watch
```

**Unit Test Structure:**

```typescript
// packages/core/tests/resilience.test.ts
import { describe, expect, it, vi } from 'vitest'
import { withResilience } from '../src/utils/resilience'

describe('withResilience', () => {
  it('returns result on first success', async () => {
    const operation = vi.fn().mockResolvedValue('success')

    const result = await withResilience(operation)

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries on failure with exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success')

    const onRetry = vi.fn()

    const result = await withResilience(operation, {
      enableRetry: true,
      maxRetries: 3,
      onRetry
    })

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 1000)
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 2000)
  })

  it('throws after max retries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Always fails'))

    await expect(
      withResilience(operation, { maxRetries: 2 })
    ).rejects.toThrow('Always fails')

    expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })
})
```

**Integration Test Structure:**

```typescript
// packages/core/tests/integration/signing.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EIMZOClient } from '../../src'
import { createMockEIMZOServer } from '../mocks/server'

describe('Full signing workflow', () => {
  let server: any
  let client: EIMZOClient

  beforeAll(async () => {
    // Start mock WebSocket server
    server = await createMockEIMZOServer({ port: 64443 })
    client = new EIMZOClient()
  })

  afterAll(() => {
    server.close()
  })

  it('completes PFX signing workflow', async () => {
    // Install
    await client.install()

    // List certificates
    const certs = await client.listAllUserKeys()
    expect(certs).toHaveLength(2)

    // Load key
    const { id } = await client.loadKey(certs[0], 'password123')
    expect(id).toBeDefined()

    // Sign data
    const result = await client.createPkcs7(id, 'test data')
    expect(result.pkcs7_64).toMatch(/^[A-Z0-9+/=]+$/i)
  })
})
```

### Vue Package Tests

```bash
# Run Vue composable tests
pnpm --filter @eimzo/vue test

# Test with Vue Test Utils
pnpm --filter @eimzo/vue test:unit
```

**Vue Test Structure:**

```typescript
// packages/vue/tests/composable.test.ts
import { describe, expect, it, vi } from 'vitest'
import { useESignature } from '../src/composable'

describe('useESignature', () => {
  it('exposes reactive state', () => {
    const { isInstalled, certificates } = useESignature()

    expect(isInstalled.value).toBe(false)
    expect(certificates.value).toEqual([])
  })

  it('updates state after installation', async () => {
    const mockClient = {
      install: vi.fn().mockResolvedValue(true)
    }

    const { isInstalled, install } = useESignature(mockClient as any)

    await install()

    expect(isInstalled.value).toBe(true)
    expect(mockClient.install).toHaveBeenCalledOnce()
  })
})
```

### TDD Workflow (MANDATORY)

1. Write test first (RED)
2. Run test - should FAIL
3. Write minimal implementation (GREEN)
4. Run test - should PASS
5. Refactor (IMPROVE)
6. Verify 80%+ coverage

Use `/tdd` skill for test-driven development workflow.

---

## Publishing Workflow

### Pre-Publishing Checklist

- [ ] All tests passing: `pnpm test`
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`
- [ ] No console.log statements in production code
- [ ] Changelog entries created (changesets)
- [ ] Version numbers updated
- [ ] 80%+ test coverage verified

### Changeset Workflow

```bash
# 1. Create a changeset for your changes
pnpm changeset

# Select packages to version:
# - @eimzo/core (patch/minor/major)
# - @eimzo/vue (patch/minor/major)

# Write changelog entry describing changes

# 2. Version packages (updates package.json and CHANGELOG.md)
pnpm changeset version

# 3. Build all packages
pnpm build

# 4. Publish to npm (requires npm authentication)
pnpm changeset publish

# 5. Push tags to GitHub
git push --follow-tags
```

### Manual Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @eimzo/core build
pnpm --filter @eimzo/vue build

# Check bundle sizes
pnpm --filter @eimzo/core build --metafile
```

### Package.json Configuration

**Core package:**
```json
{
  "name": "@eimzo/core",
  "version": "2.0.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": [
    "dist"
  ],
  "sideEffects": false
}
```

**Vue package (IMPORTANT: peer dependencies):**
```json
{
  "name": "@eimzo/vue",
  "version": "2.0.0",
  "peerDependencies": {
    "vue": "^3.3.0",
    "@eimzo/core": "^2.0.0"
  },
  "devDependencies": {
    "@eimzo/core": "workspace:*",
    "vue": "^3.3.0"
  }
}
```

### npm Publishing

```bash
# Login to npm (one-time)
npm login

# Publish with provenance (requires 2FA)
npm publish --access public --provenance

# Verify published package
npm info @eimzo/core
npm info @eimzo/vue
```

### GitHub Release

After publishing:
1. Create GitHub release from tag
2. Copy changelog entries to release notes
3. Announce on social media if major release

---

## Critical Rules

### 1. Immutability (HIGHEST PRIORITY)
NEVER mutate objects or arrays. Always create new instances with spread operators.

```typescript
// FORBIDDEN
cert.name = 'new name'
certificates.push(newCert)

// REQUIRED
const updatedCert = { ...cert, name: 'new name' }
const updatedCerts = [...certificates, newCert]
```

### 2. No Emojis
No emojis in code, comments, documentation, or commit messages.

### 3. Test-Driven Development
Write tests BEFORE implementation. Use `/tdd` skill.
- Write test (RED)
- Implement minimal code (GREEN)
- Refactor (IMPROVE)
- Verify 80%+ coverage

### 4. File Size Limits
- Typical: 200-400 lines
- Maximum: 800 lines
- Many small files > few large files

### 5. No console.log in Production
Use proper logging utilities or remove debug statements.

### 6. Proper Error Handling
Always use try/catch with specific error types.

```typescript
try {
  const result = await client.signData(id, data)
  return result
}
catch (error) {
  if (error instanceof EIMZOError) {
    // Handle EIMZO-specific error
  }
  throw error
}
```

### 7. TypeScript Strict Mode
All packages must use strict TypeScript:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`

### 8. Exports Must Be Explicit
Never use `export *`. Always name exports explicitly.

```typescript
export { EIMZOClient } from './client'

// WRONG
export * from './types'
// CORRECT
export type { Certificate, EIMZOError, SignResult } from './types'
```

### 9. Peer Dependencies for Framework Integrations
Framework packages (@eimzo/vue, @eimzo/react) MUST use @eimzo/core as peer dependency, not regular dependency.

### 10. Changesets for Versioning
Always create changeset entries for changes:
```bash
pnpm changeset
```

---

## Common Patterns Reference

### Certificate Type Checking
```typescript
import { isPfxCertificate } from '@eimzo/core'

if (isPfxCertificate(cert)) {
  // TypeScript knows: cert is PfxCertificate
  console.log(cert.alias)
}
```

### Retry Logic Usage
```typescript
import { withResilience } from '@eimzo/core'

const result = await withResilience(
  () => client.listAllUserKeys(),
  {
    enableRetry: true,
    maxRetries: 3,
    onRetry: (attempt, error, delay) => {
      console.log(`Retry ${attempt} after ${delay}ms`)
    }
  }
)
```

### Vue Composable Usage
```typescript
import { useESignature } from '@eimzo/vue'

const {
  isInstalled,
  certificates,
  install,
  listKeys,
  loadKey,
  signData
} = useESignature()

// Reactive state
watch(isInstalled, (value) => {
  if (value)
    console.log('E-IMZO installed')
})
```

---

## Architecture Principles

1. **Layer Separation**: Never skip layers. Vue calls Core, Core calls CAPIWS.
2. **Single Responsibility**: Each class/function does ONE thing well.
3. **Dependency Injection**: Accept dependencies as parameters, don't create them.
4. **Type Safety**: Use TypeScript's type system fully (discriminated unions, type guards).
5. **Error Messages**: Always provide i18n error messages (en, ru, uz).

---

## Related Files

- `ARCHITECTURE.md` - Detailed architecture documentation
- `IMPROVEMENTS.md` - Planned improvements (P0-P3)
- `ROADMAP-10-10.md` - Path to 10/10 quality
- `.claude/rules/` - Coding style, testing, security rules
- `.changeset/` - Changeset configurations
