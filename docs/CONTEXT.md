# EIMZO SDK - Global Context

This file is read by Claude at session start. Keep it concise and up-to-date.

---

## Project Overview

**What:** TypeScript SDK for Uzbekistan's E-IMZO electronic signature system
**Packages:** `@eimzo/core`, `@eimzo/vue`
**Version:** 2.0.0 (in development)

---

## Architecture (5 Layers)

```
Layer 1: Framework Integration (@eimzo/vue)
    ↓
Layer 2: High-Level Client (@eimzo/core - EIMZOClient)
    ↓
Layer 3: WebSocket Protocol (@eimzo/core - CAPIWS)
    ↓
Layer 4: Utilities (resilience, i18n, detection)
    ↓
Layer 5: Types (Certificate, SignResult, etc.)
```

**Key files:**
- `packages/core/src/index.ts` - EIMZOClient
- `packages/core/src/capiws.ts` - WebSocket layer
- `packages/core/src/types.ts` - All types
- `packages/vue/src/composable.ts` - useESignature

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Discriminated unions for Certificate | Type-safe PFX vs FTJC handling |
| Retry with exponential backoff | Resilience for WebSocket |
| i18n (en/ru/uz) | Multi-language error messages |
| Peer dependencies for @eimzo/vue | Avoid bundle duplication |
| Immutability always | Predictable state management |

---

## Tech Stack

- **Language:** TypeScript 5.3+ (strict mode)
- **Build:** tsup (esbuild)
- **Package Manager:** pnpm workspaces
- **Testing:** Vitest
- **Versioning:** Changesets

---

## Current State

**Completed:**
- Core architecture design
- Basic type definitions
- CAPIWS WebSocket layer
- Vue plugin structure

**In Progress:**
- See `docs/contexts/` for active tasks

**Planned:**
- See `docs/architecture/ROADMAP-10-10.md` for full roadmap

---

## Patterns to Follow

1. **Immutability:** Never mutate, always spread
2. **TDD-lite:** Tests first for utilities, integration tests for WebSocket
3. **Layer separation:** Never skip layers
4. **Explicit exports:** No `export *`
5. **Conventional commits:** feat:, fix:, refactor:

---

## Active Tasks

Check `docs/contexts/` for task-specific context files.

---

*Last updated: 2024-02-05*
