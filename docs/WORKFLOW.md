  Table of Contents

  1. #1-problem-statement
  2. #2-workflow-commands-system
  3. #3-model-strategy
  4. #4-tdd-lite-approach
  5. #5-context-preservation
  6. #6-git-worktrees-for-parallel-work
  7. #7-session-management
  8. #8-folder-structure
  9. #9-claude-folder-cleanup
  10. #10-hooks-configuration
  11. #11-complete-workflow-examples
  12. #12-implementation-checklist

  ---
  1. Problem Statement

  Your pain points:
  - Every new session re-analyzes project structure (wasting tokens)
  - MD files generated in random locations
  - No automatic model selection (Opus/Sonnet/Haiku)
  - Trouble working on multiple features in parallel
  - No clear workflow for feature/bugfix/refactor tasks
  - Unclear what's needed in .claude/ folder

  Solutions we designed:
  - /task command with automatic model orchestration
  - Context preservation with Supermemory + CONTEXT.md + branch contexts
  - Git worktrees for true parallel development
  - Organized docs/ folder for all generated markdown
  - Cleaned up .claude/ folder with only necessary files

  ---
  2. Workflow Commands System

  The /task Command (Hybrid Approach)

  Main command:
  /task              → Asks what type of task
  /task feature      → Direct to feature workflow
  /task bugfix       → Direct to bugfix workflow
  /task refactor     → Direct to refactor workflow
  /task hotfix       → Direct to hotfix workflow
  /task research     → Direct to research workflow

  Shortcuts:
  /f    → alias for /task feature
  /b    → alias for /task bugfix
  /r    → alias for /task refactor
  /h    → alias for /task hotfix

  Workflow Per Task Type
  ┌───────────┬──────────────────────────────────────────────────────┬────────────────────────┐
  │ Task Type │                        Steps                         │      Models Used       │
  ├───────────┼──────────────────────────────────────────────────────┼────────────────────────┤
  │ Feature   │ Plan → Approve → Test → Implement → Review → Commit  │ Opus → Sonnet → Opus   │
  ├───────────┼──────────────────────────────────────────────────────┼────────────────────────┤
  │ Bugfix    │ Analyze → Approve → Test → Fix → Review → Commit     │ Sonnet → Sonnet → Opus │
  ├───────────┼──────────────────────────────────────────────────────┼────────────────────────┤
  │ Refactor  │ Plan → Approve → Refactor → Verify → Review → Commit │ Sonnet → Sonnet → Opus │
  ├───────────┼──────────────────────────────────────────────────────┼────────────────────────┤
  │ Hotfix    │ Quick fix → Minimal review → Commit                  │ Haiku → Haiku          │
  ├───────────┼──────────────────────────────────────────────────────┼────────────────────────┤
  │ Research  │ Deep research → Document findings                    │ Opus                   │
  └───────────┴──────────────────────────────────────────────────────┴────────────────────────┘
  Feature Workflow Detail

  /task feature "Add certificate caching"

  Step 1: [Opus subagent]
          - Analyze requirements
          - Research codebase
          - Create detailed plan

  Step 2: [Main agent]
          - Present plan to you
          - Show complexity indicator
          - WAIT FOR YOUR APPROVAL

  Step 3: [Sonnet subagent]
          - Write failing tests (TDD-lite)

  Step 4: [Sonnet subagent]
          - Implement to pass tests

  Step 5: [Opus subagent]
          - Code review
          - Security check
          - Quality assessment

  Step 6: [Main agent]
          - Present changes
          - WAIT FOR YOUR APPROVAL

  Step 7: [Main agent]
          - Commit with conventional message
          - Update context file

  Bugfix Workflow Detail

  /task bugfix "WebSocket reconnection fails"

  Step 1: [Sonnet subagent]
          - Analyze bug
          - Find root cause
          - Identify affected files

  Step 2: [Main agent]
          - Present analysis
          - APPROVAL (skip if obvious bug)

  Step 3: [Sonnet subagent]
          - Write test that reproduces bug

  Step 4: [Sonnet subagent]
          - Fix bug (test should pass)

  Step 5: [Opus subagent]
          - Quick review

  Step 6: [Main agent]
          - Commit with "fix:" prefix

  ---
  3. Model Strategy

  Model Selection by Task
  ┌────────┬─────────────────────────────────────┬────────┬─────────┐
  │ Model  │               Use For               │  Cost  │ Quality │
  ├────────┼─────────────────────────────────────┼────────┼─────────┤
  │ Opus   │ Planning, Architecture, Code Review │ High   │ Highest │
  ├────────┼─────────────────────────────────────┼────────┼─────────┤
  │ Sonnet │ Implementation, TDD, Analysis       │ Medium │ High    │
  ├────────┼─────────────────────────────────────┼────────┼─────────┤
  │ Haiku  │ Quick fixes, Simple tasks           │ Low    │ Good    │
  └────────┴─────────────────────────────────────┴────────┴─────────┘
  Your Approved Configuration
  ┌──────────────────┬────────┐
  │    Task Phase    │ Model  │
  ├──────────────────┼────────┤
  │ Planning         │ Opus   │
  ├──────────────────┼────────┤
  │ Code Review      │ Opus   │
  ├──────────────────┼────────┤
  │ Implementation   │ Sonnet │
  ├──────────────────┼────────┤
  │ Test Writing     │ Sonnet │
  ├──────────────────┼────────┤
  │ Bug Analysis     │ Sonnet │
  ├──────────────────┼────────┤
  │ Hotfixes         │ Haiku  │
  ├──────────────────┼────────┤
  │ Simple refactors │ Haiku  │
  └──────────────────┴────────┘
  How Model Selection Works

  You start Claude Code (any model)
           ↓
  You: "/task feature Add caching"
           ↓
  Main agent spawns Opus subagent for planning
           ↓
  Opus subagent returns plan
           ↓
  Main agent shows you plan, asks approval
           ↓
  You approve
           ↓
  Main agent spawns Sonnet subagent for implementation
           ↓
  ... and so on

  Key insight: The main conversation can be ANY model. The /task command orchestrates subagents with optimal models.

  ---
  4. TDD-Lite Approach

  What is TDD-Lite?

  Full TDD for everything that's practically testable, integration tests for complex parts.

  When to Use TDD (Write Test First)
  ┌────────────────────────────────────────────┬──────┬──────────────────────────────┐
  │                 Component                  │ TDD? │            Reason            │
  ├────────────────────────────────────────────┼──────┼──────────────────────────────┤
  │ Utility functions (resilience.ts, i18n.ts) │ Yes  │ Pure functions, easy to test │
  ├────────────────────────────────────────────┼──────┼──────────────────────────────┤
  │ Type guards                                │ Yes  │ Simple input/output          │
  ├────────────────────────────────────────────┼──────┼──────────────────────────────┤
  │ Error classes                              │ Yes  │ Predictable behavior         │
  ├────────────────────────────────────────────┼──────┼──────────────────────────────┤
  │ Vue composables                            │ Yes  │ With Vue Test Utils          │
  ├────────────────────────────────────────────┼──────┼──────────────────────────────┤
  │ Business logic                             │ Yes  │ Core functionality           │
  └────────────────────────────────────────────┴──────┴──────────────────────────────┘
  When to Use Integration Tests (Write After)
  ┌──────────────────────────────────┬─────────────────────┐
  │            Component             │     Why Not TDD     │
  ├──────────────────────────────────┼─────────────────────┤
  │ WebSocket communication (CAPIWS) │ Needs mock server   │
  ├──────────────────────────────────┼─────────────────────┤
  │ E-IMZO detection                 │ Browser-specific    │
  ├──────────────────────────────────┼─────────────────────┤
  │ Full signing workflow            │ External dependency │
  └──────────────────────────────────┴─────────────────────┘
  TDD-Lite Workflow

  1. Identify what you're building
  2. Is it a utility/pure function?
     → YES: Write test first (TDD)
     → NO: Write implementation, then integration test
  3. Run tests
  4. Verify 80%+ coverage on testable code

  ---
  5. Context Preservation

  Three-Layer Context System

  ┌─────────────────────────────────────────────────┐
  │  Layer 1: Supermemory (Automatic)               │
  │  - Persists across ALL sessions automatically   │
  │  - Learns patterns from your work               │
  │  - Searchable with /claude-supermemory:search   │
  └─────────────────────────────────────────────────┘
                        ↓
  ┌─────────────────────────────────────────────────┐
  │  Layer 2: docs/CONTEXT.md (Global)              │
  │  - Architecture overview                        │
  │  - Key decisions                                │
  │  - Current state of project                     │
  │  - Shared across all tasks                      │
  └─────────────────────────────────────────────────┘
                        ↓
  ┌─────────────────────────────────────────────────┐
  │  Layer 3: docs/contexts/{task}.md (Per-Task)    │
  │  - Task-specific progress                       │
  │  - Files changed                                │
  │  - Current status                               │
  │  - Blockers and notes                           │
  └─────────────────────────────────────────────────┘

  When Context is Loaded

  Session starts
      ↓
  Read docs/CONTEXT.md (global knowledge)
      ↓
  Read docs/contexts/{session-name}.md (task-specific)
      ↓
  Supermemory fills gaps automatically
      ↓
  Ready to work with full context

  Context File Templates

  docs/CONTEXT.md (Global):
  # EIMZO SDK Context

  ## Architecture
  5-layer architecture: Vue → Core → CAPIWS → Utils → Types

  ## Key Decisions
  - Discriminated unions for Certificate types
  - Retry with exponential backoff
  - i18n for en/ru/uz

  ## Current State
  - Version: 2.0.0
  - Packages: @eimzo/core, @eimzo/vue
  - Active work: See docs/contexts/

  ## Patterns
  - Immutability always
  - TDD-lite approach
  - Peer dependencies for framework packages

  docs/contexts/{task}.md (Per-Task):
  # Task: {name}

  ## Status
  - [x] Planning
  - [x] Tests written
  - [ ] Implementation
  - [ ] Code review
  - [ ] Committed

  ## Branch
  `feat/task-name`

  ## Goal
  What we're trying to achieve

  ## Plan Summary
  Key steps from planning phase

  ## Files Changed
  - path/to/file.ts - what changed

  ## Current Progress
  What's done, what's next

  ## Blockers / Notes
  Any issues encountered

  ## Session History
  - 2024-01-15: Started planning
  - 2024-01-16: Implementation in progress

  ---
  6. Git Worktrees for Parallel Work

  The Problem

  Git only allows one branch checked out at a time in a single directory.

  The Solution: Git Worktrees

  Multiple working directories, each with different branch.

  Setup

  # Main repo (stays on main/develop)
  cd ~/projects/eimzo-monorepo

  # Create worktree for feature 1
  git worktree add ../eimzo-feat-caching feat/caching

  # Create worktree for feature 2
  git worktree add ../eimzo-feat-middleware feat/middleware

  # Result:
  ~/projects/eimzo-monorepo/           # main branch
  ~/projects/eimzo-feat-caching/       # feat/caching branch
  ~/projects/eimzo-feat-middleware/    # feat/middleware branch

  Working with Worktrees

  # Terminal 1: Feature 1
  cd ~/projects/eimzo-feat-caching
  claude --session feat-caching

  # Terminal 2: Feature 2
  cd ~/projects/eimzo-feat-middleware
  claude --session feat-middleware

  # Terminal 3: Hotfix (can use main repo)
  cd ~/projects/eimzo-monorepo
  git checkout -b hotfix/urgent-fix
  claude --session hotfix-urgent

  Managing Worktrees

  # List all worktrees
  git worktree list

  # Remove worktree when done
  git worktree remove ../eimzo-feat-caching

  # Prune stale worktrees
  git worktree prune

  Worktree + Context Flow

  Create worktree for feat/caching
           ↓
  Start Claude session: claude --session feat-caching
           ↓
  Claude reads:
    - docs/CONTEXT.md (global)
    - docs/contexts/feat-caching.md (if exists)
           ↓
  Work on feature
           ↓
  Claude updates docs/contexts/feat-caching.md
           ↓
  End session
           ↓
  Next day: resume with full context

  ---
  7. Session Management

  Session Naming Convention

  # Pattern: {type}-{short-description}

  # Features
  claude --session feat-caching
  claude --session feat-middleware
  claude --session feat-plugins

  # Bugfixes
  claude --session bugfix-reconnect
  claude --session bugfix-timeout

  # Refactors
  claude --session refactor-types
  claude --session refactor-errors

  # Research
  claude --session research-architecture

  Session Commands

  # Start new session
  claude --session feat-new-feature

  # Resume existing session
  claude --resume feat-caching

  # List all sessions
  claude /sessions

  Recommended Terminal Setup (tmux)

  # Create tmux session for EIMZO work
  tmux new-session -s eimzo

  # Create windows for different tasks
  Ctrl+b c          # New window
  Ctrl+b ,          # Rename window to "feat-caching"

  # Switch between windows
  Ctrl+b n          # Next window
  Ctrl+b p          # Previous window
  Ctrl+b 0-9        # Window by number

  # Split for logs
  Ctrl+b %          # Vertical split
  Ctrl+b "          # Horizontal split

  Complete Session Workflow

  1. Start terminal
  2. cd to appropriate directory (worktree if parallel work)
  3. Start/resume Claude session
  4. Use /task command for structured work
  5. Claude auto-updates context files
  6. End session when done
  7. Context preserved for next time

  ---
  8. Folder Structure

  Project Structure

  eimzo-monorepo/
  ├── packages/
  │   ├── core/                    # @eimzo/core
  │   └── vue/                     # @eimzo/vue
  │
  ├── docs/                        # ALL generated docs go here
  │   ├── CONTEXT.md              # Global context (I update)
  │   ├── contexts/               # Per-task contexts
  │   │   ├── feat-caching.md
  │   │   ├── feat-middleware.md
  │   │   └── bugfix-reconnect.md
  │   ├── architecture/           # Architecture docs
  │   │   └── ARCHITECTURE.md
  │   ├── plans/                  # Feature plans
  │   │   └── 2024-01-15-caching.md
  │   ├── reviews/                # Code reviews
  │   │   └── 2024-01-16-caching-review.md
  │   └── research/               # Research findings
  │       └── plugin-systems.md
  │
  ├── .claude/                    # Claude Code config
  │   ├── agents/                 # Agent definitions (7 files)
  │   ├── commands/               # Custom commands
  │   ├── hooks/                  # Hooks config
  │   ├── rules/                  # Coding rules
  │   └── skills/                 # Skills
  │
  ├── CLAUDE.md                   # Main Claude instructions
  ├── README.md                   # Project readme
  └── ...

  Rule: Where MD Files Go
  ┌────────────────┬────────────────────────────────┐
  │   File Type    │            Location            │
  ├────────────────┼────────────────────────────────┤
  │ Global context │ docs/CONTEXT.md                │
  ├────────────────┼────────────────────────────────┤
  │ Task context   │ docs/contexts/{task}.md        │
  ├────────────────┼────────────────────────────────┤
  │ Feature plans  │ docs/plans/{date}-{name}.md    │
  ├────────────────┼────────────────────────────────┤
  │ Code reviews   │ docs/reviews/{date}-{scope}.md │
  ├────────────────┼────────────────────────────────┤
  │ Research       │ docs/research/{topic}.md       │
  ├────────────────┼────────────────────────────────┤
  │ Architecture   │ docs/architecture/             │
  ├────────────────┼────────────────────────────────┤
  │ README         │ Root README.md                 │
  ├────────────────┼────────────────────────────────┤
  │ Claude config  │ Root CLAUDE.md                 │
  └────────────────┴────────────────────────────────┘
  I will NEVER create .md files outside these locations.

  ---
  9. .claude/ Folder Cleanup

  Agents to KEEP (7 files)
  ┌─────────────────────────┬─────────────────────────┐
  │          Agent          │         Purpose         │
  ├─────────────────────────┼─────────────────────────┤
  │ planner.md              │ Feature planning        │
  ├─────────────────────────┼─────────────────────────┤
  │ architect.md            │ System design           │
  ├─────────────────────────┼─────────────────────────┤
  │ code-reviewer.md        │ Code quality review     │
  ├─────────────────────────┼─────────────────────────┤
  │ tdd-guide.md            │ Test-driven development │
  ├─────────────────────────┼─────────────────────────┤
  │ build-error-resolver.md │ Fix build errors        │
  ├─────────────────────────┼─────────────────────────┤
  │ security-reviewer.md    │ Security analysis       │
  ├─────────────────────────┼─────────────────────────┤
  │ refactor-cleaner.md     │ Dead code cleanup       │
  └─────────────────────────┴─────────────────────────┘
  Agents to REMOVE (4 files)
  ┌──────────────────────┬─────────────────────────────┐
  │        Agent         │           Reason            │
  ├──────────────────────┼─────────────────────────────┤
  │ go-reviewer.md       │ Go-specific, not needed     │
  ├──────────────────────┼─────────────────────────────┤
  │ go-build-resolver.md │ Go-specific, not needed     │
  ├──────────────────────┼─────────────────────────────┤
  │ python-reviewer.md   │ Python-specific, not needed │
  ├──────────────────────┼─────────────────────────────┤
  │ database-reviewer.md │ No database in EIMZO        │
  └──────────────────────┴─────────────────────────────┘
  Commands to Review

  Potentially remove (Go/Python specific):
  - go-build.md
  - go-review.md
  - go-test.md
  - python-review.md

  Keep (useful for TypeScript):
  - plan.md
  - tdd.md
  - code-review.md
  - build-fix.md
  - verify.md
  - refactor-clean.md

  Skills to Review

  Keep:
  - project-guidelines-example/ (now EIMZO-specific)
  - tdd-workflow/
  - coding-standards/
  - security-review/

  Consider removing (complex/experimental):
  - continuous-learning/
  - continuous-learning-v2/
  - strategic-compact/
  - eval-harness/

  ---
  10. Hooks Configuration

  Current Hooks (Updated)
  ┌──────────────────────┬─────────────────────────────────────────┐
  │         Hook         │              What It Does               │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ Dev server blocker   │ Blocks npm run dev outside tmux         │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ tmux reminder        │ Suggests tmux for long commands         │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ git push review      │ Reminder before push                    │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ MD file blocker      │ Blocks .md except README, CLAUDE, docs/ │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ Prettier auto-format │ Formats JS/TS after edit                │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ TypeScript check     │ Runs tsc after .ts/.tsx edit            │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ console.log warning  │ Warns about console.log                 │
  ├──────────────────────┼─────────────────────────────────────────┤
  │ Session hooks        │ Start/end session context               │
  └──────────────────────┴─────────────────────────────────────────┘
  Updated MD File Hook

  Now allows:
  - README.md, CLAUDE.md, AGENTS.md, CONTRIBUTING.md
  - docs/**/*.md (anything in docs folder)

  Blocks:
  - Random .md files elsewhere

  ---
  11. Complete Workflow Examples

  Example 1: New Feature

  # 1. Create worktree (if working in parallel)
  cd ~/projects/eimzo-monorepo
  git worktree add ../eimzo-feat-caching feat/caching
  cd ../eimzo-feat-caching

  # 2. Start Claude session
  claude --session feat-caching

  # 3. Use /task command
  > /task feature "Add certificate caching with TTL"

  # 4. Claude workflow:
  #    - Opus plans the feature
  #    - Shows plan, asks approval
  #    - You approve
  #    - Sonnet writes tests
  #    - Sonnet implements
  #    - Opus reviews
  #    - Shows changes, asks approval
  #    - You approve
  #    - Commits with "feat: add certificate caching"

  # 5. End session (context saved)
  > /exit

  # 6. Next day, resume
  claude --resume feat-caching
  # Full context loaded automatically

  Example 2: Bugfix

  # 1. Start session
  claude --session bugfix-reconnect

  # 2. Use /task command
  > /task bugfix "WebSocket doesn't reconnect after network loss"

  # 3. Claude workflow:
  #    - Sonnet analyzes the bug
  #    - Shows root cause
  #    - You approve fix approach
  #    - Sonnet writes reproducing test
  #    - Sonnet fixes bug
  #    - Opus quick review
  #    - Commits with "fix: handle WebSocket reconnection"

  # 4. Done

  Example 3: Parallel Work

  # Terminal 1: Feature A
  cd ~/projects/eimzo-feat-caching
  claude --session feat-caching
  > /task feature "Certificate caching"
  # ... working ...

  # Terminal 2: Feature B (same time!)
  cd ~/projects/eimzo-feat-middleware
  claude --session feat-middleware
  > /task feature "Plugin middleware"
  # ... working ...

  # Terminal 3: Quick hotfix
  cd ~/projects/eimzo-monorepo
  git checkout -b hotfix/urgent
  claude --session hotfix-urgent
  > /task hotfix "Fix typo in error message"
  # ... quick fix ...

  ---
  12. Implementation Checklist

  What Needs to Be Done
  ┌─────┬───────────────────────────────────────────┬────────┐
  │  #  │                   Task                    │ Status │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 1   │ Update hooks.json (allow docs/)           │ DONE   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 2   │ Create docs/ folder structure             │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 3   │ Create docs/CONTEXT.md                    │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 4   │ Create context template                   │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 5   │ Remove unused agents (4 files)            │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 6   │ Remove unused commands (4 files)          │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 7   │ Create /task command                      │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 8   │ Create shortcut commands (/f, /b, /r, /h) │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 9   │ Update CLAUDE.md with workflow            │ TODO   │
  ├─────┼───────────────────────────────────────────┼────────┤
  │ 10  │ Test complete workflow                    │ TODO   │
  └─────┴───────────────────────────────────────────┴────────┘
  Implementation Order

  Phase 1: Structure
    1. Create docs/ folder structure
    2. Create docs/CONTEXT.md
    3. Create context template

  Phase 2: Cleanup
    4. Remove unused agents
    5. Remove unused commands
    6. Review/remove unused skills

  Phase 3: Commands
    7. Create /task command
    8. Create shortcuts

  Phase 4: Documentation
    9. Update CLAUDE.md
    10. Test everything

  ---
  Quick Reference Card

  ┌─────────────────────────────────────────────────────────────┐
  │                 EIMZO SDK WORKFLOW                          │
  ├─────────────────────────────────────────────────────────────┤
  │ COMMANDS                                                    │
  │   /task feature "desc"  → Full feature workflow             │
  │   /task bugfix "desc"   → Bug fix workflow                  │
  │   /task refactor "desc" → Refactor workflow                 │
  │   /task hotfix "desc"   → Quick fix workflow                │
  │   /f, /b, /r, /h        → Shortcuts                         │
  ├─────────────────────────────────────────────────────────────┤
  │ MODELS                                                      │
  │   Opus   → Planning, Code Review                            │
  │   Sonnet → Implementation, Tests, Analysis                  │
  │   Haiku  → Quick fixes, Simple tasks                        │
  ├─────────────────────────────────────────────────────────────┤
  │ PARALLEL WORK                                               │
  │   git worktree add ../name branch                           │
  │   cd ../name && claude --session name                       │
  ├─────────────────────────────────────────────────────────────┤
  │ SESSIONS                                                    │
  │   claude --session {type}-{name}   → New session            │
  │   claude --resume {name}           → Resume session         │
  │   /sessions                        → List sessions          │
  ├─────────────────────────────────────────────────────────────┤
  │ CONTEXT FILES                                               │
  │   docs/CONTEXT.md              → Global context             │
  │   docs/contexts/{task}.md      → Task context               │
  │   docs/plans/{date}-{name}.md  → Plans                      │
  │   docs/reviews/{date}.md       → Reviews                    │
  └─────────────────────────────────────────────────────────────┘

  ---
