# EIMZO SDK - Claude Code Configuration

TypeScript SDK for Uzbekistan's E-IMZO electronic signature system.

---

## Quick Start

```bash
# Start new task
/task feature "description"    # or /f "description"
/task bugfix "description"     # or /b "description"
/task refactor "description"   # or /r "description"
/task hotfix "description"     # or /h "description"

# Resume session
claude --resume {session-name}
```

---

## Project Overview

**Packages:** `@eimzo/core`, `@eimzo/vue`

**Architecture:** 5 layers (Vue → Client → CAPIWS → Utils → Types)

**Tech:** TypeScript 5.3+, tsup, pnpm, Vitest

**Full context:** Read `docs/CONTEXT.md`

---

## Workflow Commands

| Command | Purpose | Models Used |
|---------|---------|-------------|
| `/task feature` or `/f` | New functionality | Opus → Sonnet → Opus |
| `/task bugfix` or `/b` | Fix bugs | Sonnet → Sonnet → Opus |
| `/task refactor` or `/r` | Improve structure | Sonnet → Sonnet → Opus |
| `/task hotfix` or `/h` | Quick fix | Haiku |
| `/task research` | Deep investigation | Opus |

**Workflow:** Plan → Approve → Test → Implement → Review → Commit

---

## Critical Rules

### 1. Immutability (HIGHEST PRIORITY)

```typescript
// FORBIDDEN
cert.name = 'new'
certs.push(newCert)

// REQUIRED
const updated = { ...cert, name: 'new' }
const newCerts = [...certs, newCert]
```

### 2. Code Style

- No emojis in code/comments/docs
- No console.log in production
- Explicit exports only (no `export *`)
- TypeScript strict mode always

### 3. File Organization

- 200-400 lines typical, 800 max
- Many small files > few large files
- Organize by feature/domain

### 4. Testing (TDD-Lite)

- TDD for utilities and logic
- Integration tests for WebSocket
- 80% coverage on testable code

---

## Model Strategy

| Task | Model | Reason |
|------|-------|--------|
| Planning | **Opus** | Deep thinking |
| Code Review | **Opus** | Quality matters |
| Implementation | Sonnet | Good balance |
| Quick fixes | Haiku | Speed |

---

## Context System

```
docs/
├── CONTEXT.md           # Global (always read)
├── contexts/{task}.md   # Per-task progress
├── architecture/        # Design docs
├── plans/               # Feature plans
└── reviews/             # Code reviews
```

**Rule:** All .md files go in `docs/` (except README.md, CLAUDE.md)

---

## Session Management

```bash
# Naming: {type}-{short-name}
claude --session feat-caching
claude --session bugfix-reconnect

# Resume
claude --resume feat-caching

# List
/sessions
```

---

## Parallel Work (Git Worktrees)

```bash
# Create worktree for parallel feature
git worktree add ../eimzo-feat-caching feat/caching
cd ../eimzo-feat-caching
claude --session feat-caching

# Clean up when done
git worktree remove ../eimzo-feat-caching
```

---

## Git Workflow

- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- **Never** commit to main directly
- **Always** run tests before commit
- **Update** `docs/contexts/{task}.md` after work

---

## Available Commands

**Task Commands:**
- `/task`, `/f`, `/b`, `/r`, `/h` - Task workflows

**Development:**
- `/plan` - Create implementation plan
- `/tdd` - Test-driven development
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors
- `/verify` - Verify implementation

**Utilities:**
- `/sessions` - Manage sessions
- `/checkpoint` - Save progress
- `/refactor-clean` - Clean dead code

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/index.ts` | EIMZOClient (main API) |
| `packages/core/src/capiws.ts` | WebSocket layer |
| `packages/core/src/types.ts` | All TypeScript types |
| `packages/vue/src/composable.ts` | useESignature hook |
| `docs/CONTEXT.md` | Global context |
| `docs/WORKFLOW.md` | Complete workflow guide |

---

## Quick Reference

```
┌─────────────────────────────────────────────────┐
│  EIMZO SDK WORKFLOW                             │
├─────────────────────────────────────────────────┤
│  /f "desc"  → Feature (Opus→Sonnet→Opus)        │
│  /b "desc"  → Bugfix (Sonnet→Sonnet→Opus)       │
│  /r "desc"  → Refactor (Sonnet→Sonnet→Opus)     │
│  /h "desc"  → Hotfix (Haiku)                    │
├─────────────────────────────────────────────────┤
│  Immutability: NEVER mutate, always spread      │
│  TDD-Lite: Tests first for utilities            │
│  Context: docs/CONTEXT.md + docs/contexts/      │
└─────────────────────────────────────────────────┘
```
