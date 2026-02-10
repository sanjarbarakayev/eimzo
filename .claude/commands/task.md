# /task - Unified Task Workflow Command

Execute structured workflows for features, bugfixes, refactors, and more with automatic model orchestration.

---

## Usage

```
/task                     # Interactive - asks task type
/task feature "desc"      # Feature workflow
/task bugfix "desc"       # Bugfix workflow
/task refactor "desc"     # Refactor workflow
/task hotfix "desc"       # Hotfix workflow
/task research "desc"     # Research workflow
```

**Shortcuts:** `/f`, `/b`, `/r`, `/h` (see separate command files)

---

## Workflow Instructions

When this command is invoked, follow these steps:

### Step 1: Parse Input

If no task type provided, ask:
```
What type of task?
1. feature  - New functionality
2. bugfix   - Fix broken behavior
3. refactor - Improve code structure
4. hotfix   - Urgent quick fix
5. research - Explore/investigate
```

### Step 2: Show Complexity Indicator

Before starting, display:
```
Task: {type} - "{description}"

Workflow:
  - Planning: {Opus/Sonnet} subagent
  - Implementation: {Sonnet} subagent
  - Review: {Opus} subagent

Estimated steps: {N}
Files likely affected: {estimate}

Proceed? [Y/n]
```

Wait for user confirmation.

### Step 3: Execute Workflow by Type

---

## FEATURE Workflow

**Models:** Opus (plan) → Sonnet (implement) → Opus (review)

```
1. [Opus subagent - planner]
   - Analyze requirements
   - Research codebase for related code
   - Identify files to modify/create
   - Create detailed implementation plan
   - Return plan document

2. [Main agent]
   - Present plan to user
   - Save plan to docs/plans/{date}-{name}.md
   - ASK FOR APPROVAL - do not proceed without it

3. [Sonnet subagent - tdd-guide]
   - Write failing tests first (TDD-lite)
   - Focus on testable logic
   - Skip tests for WebSocket/browser-specific code

4. [Sonnet subagent - implementation]
   - Implement to pass tests
   - Follow existing patterns
   - Maintain immutability

5. [Opus subagent - code-reviewer]
   - Review all changes
   - Check for security issues
   - Verify patterns followed
   - Return review document

6. [Main agent]
   - Present review results
   - Save review to docs/reviews/{date}-{name}.md
   - If issues found, fix them
   - ASK FOR FINAL APPROVAL

7. [Main agent]
   - Update docs/contexts/{task}.md
   - Commit with "feat: {description}"
```

---

## BUGFIX Workflow

**Models:** Sonnet (analyze) → Sonnet (fix) → Opus (review)

```
1. [Sonnet subagent - planner]
   - Analyze bug description
   - Find root cause
   - Identify affected files
   - Return analysis

2. [Main agent]
   - Present analysis
   - For obvious bugs, skip approval
   - For complex bugs, ASK FOR APPROVAL

3. [Sonnet subagent - tdd-guide]
   - Write test that reproduces the bug
   - Test should FAIL initially

4. [Sonnet subagent - implementation]
   - Fix the bug
   - Test should now PASS

5. [Opus subagent - code-reviewer]
   - Quick review
   - Verify fix doesn't break anything

6. [Main agent]
   - Update docs/contexts/{task}.md
   - Commit with "fix: {description}"
```

---

## REFACTOR Workflow

**Models:** Sonnet (plan) → Sonnet (refactor) → Opus (review)

```
1. [Sonnet subagent - planner]
   - Analyze current code structure
   - Propose refactoring approach
   - Identify risks
   - Return plan

2. [Main agent]
   - Present refactor plan
   - ASK FOR APPROVAL

3. [Sonnet subagent - implementation]
   - Execute refactoring
   - Ensure tests still pass
   - No behavior changes

4. [Opus subagent - code-reviewer]
   - Verify no behavior changes
   - Check code quality improved

5. [Main agent]
   - Update docs/contexts/{task}.md
   - Commit with "refactor: {description}"
```

---

## HOTFIX Workflow

**Models:** Haiku/Sonnet (fix) → Haiku (review)

```
1. [Haiku or Sonnet subagent]
   - Quick fix implementation
   - Minimal changes only

2. [Main agent]
   - Brief review
   - Commit with "fix: {description}"
```

---

## RESEARCH Workflow

**Models:** Opus (research)

```
1. [Opus subagent - architect]
   - Deep research on topic
   - Analyze codebase
   - Explore options
   - Return findings document

2. [Main agent]
   - Save to docs/research/{topic}.md
   - Present summary to user
```

---

## Context Management

**Before starting any task:**
1. Read `docs/CONTEXT.md` (global context)
2. Check if `docs/contexts/{task-name}.md` exists
3. If exists, read and continue from last state
4. If not, create from template

**After completing any task:**
1. Update `docs/contexts/{task-name}.md` with progress
2. Update status checkboxes
3. Add session history entry

---

## Model Selection Reference

| Task Phase | Model | Reason |
|------------|-------|--------|
| Planning (feature) | Opus | Deep thinking required |
| Planning (bugfix/refactor) | Sonnet | Moderate complexity |
| Implementation | Sonnet | Good balance |
| Code Review | Opus | Quality matters |
| Hotfix | Haiku | Speed priority |
| Research | Opus | Deep analysis |

---

## Error Handling

If any step fails:
1. Do NOT proceed to next step
2. Report error to user
3. Ask how to proceed:
   - Retry the step
   - Skip and continue
   - Abort task

---

## Example Session

```
User: /task feature "Add certificate caching with TTL"

Claude:
Task: feature - "Add certificate caching with TTL"

Workflow:
  - Planning: Opus subagent (deep analysis)
  - Tests: Sonnet subagent
  - Implementation: Sonnet subagent
  - Review: Opus subagent (thorough review)

Estimated steps: 7
Files likely affected: 3-5

Proceed? [Y/n]

User: y

Claude: [Spawns Opus planner subagent...]
...
```
