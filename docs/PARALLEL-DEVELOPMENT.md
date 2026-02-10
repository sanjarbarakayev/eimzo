# Parallel Development Guide

How to work on multiple features simultaneously using tmux and git worktrees.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Terminal (tmux)                                                │
├─────────────────────────────────────────────────────────────────┤
│  Window 1: feat-caching     │  Window 2: feat-middleware        │
│  ~/eimzo-feat-caching/      │  ~/eimzo-feat-middleware/         │
│  branch: feat/caching       │  branch: feat/middleware          │
│  claude --session feat-...  │  claude --session feat-...        │
├─────────────────────────────────────────────────────────────────┤
│  Window 3: main             │  Window 4: hotfix                 │
│  ~/eimzo-monorepo/          │  ~/eimzo-monorepo/                │
│  branch: main               │  branch: hotfix/urgent            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: tmux Basics

### Installation

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux
```

### Essential Commands

| Action | Command |
|--------|---------|
| Start new session | `tmux new -s eimzo` |
| Detach (keep running) | `Ctrl+b d` |
| Reattach | `tmux attach -t eimzo` |
| List sessions | `tmux ls` |
| Kill session | `tmux kill-session -t eimzo` |

### Window Management

| Action | Command |
|--------|---------|
| New window | `Ctrl+b c` |
| Rename window | `Ctrl+b ,` |
| Next window | `Ctrl+b n` |
| Previous window | `Ctrl+b p` |
| Go to window N | `Ctrl+b 0-9` |
| List windows | `Ctrl+b w` |
| Close window | `Ctrl+b &` or `exit` |

### Pane Management (Split Screen)

| Action | Command |
|--------|---------|
| Split vertical | `Ctrl+b %` |
| Split horizontal | `Ctrl+b "` |
| Switch pane | `Ctrl+b arrow` |
| Close pane | `Ctrl+b x` or `exit` |
| Toggle fullscreen | `Ctrl+b z` |

---

## Part 2: Git Worktrees

### What Are Worktrees?

Git worktrees let you have multiple branches checked out simultaneously in different folders. Each folder is a complete working copy linked to the same repository.

### Setup Worktree for a Feature

```bash
# Start from main repo
cd ~/projects/eimzo-monorepo

# Create branch (if doesn't exist)
git checkout -b feat/caching
git push -u origin feat/caching
git checkout main  # Go back to main

# Create worktree
git worktree add ../eimzo-feat-caching feat/caching

# Result:
# ~/projects/eimzo-monorepo/        → main branch
# ~/projects/eimzo-feat-caching/    → feat/caching branch
```

### Worktree Commands

```bash
# List all worktrees
git worktree list

# Create worktree for existing branch
git worktree add ../folder-name branch-name

# Create worktree with new branch
git worktree add -b feat/new-feature ../folder-name

# Remove worktree (after merging)
git worktree remove ../eimzo-feat-caching

# Prune stale worktree references
git worktree prune
```

---

## Part 3: Complete Workflow

### Initial Setup (One Time)

```bash
# 1. Start tmux session for EIMZO work
tmux new -s eimzo

# 2. Rename first window to "main"
Ctrl+b ,
# Type: main

# You now have:
# - tmux session "eimzo"
# - Window "main" in ~/projects/eimzo-monorepo
```

### Starting a New Feature

```bash
# 1. In tmux, create new window
Ctrl+b c

# 2. Rename window
Ctrl+b ,
# Type: feat-caching

# 3. Create worktree (from main repo)
cd ~/projects/eimzo-monorepo
git worktree add ../eimzo-feat-caching feat/caching

# 4. Go to worktree
cd ../eimzo-feat-caching

# 5. Start Claude session
claude --session feat-caching

# 6. Start working
/f "Add certificate caching with TTL"
```

### Starting a Second Feature (Parallel)

```bash
# 1. Create another tmux window
Ctrl+b c

# 2. Rename
Ctrl+b ,
# Type: feat-middleware

# 3. Create second worktree
cd ~/projects/eimzo-monorepo
git worktree add ../eimzo-feat-middleware feat/middleware

# 4. Go to worktree
cd ../eimzo-feat-middleware

# 5. Start separate Claude session
claude --session feat-middleware

# 6. Work on this feature independently
/f "Add plugin middleware system"
```

### Switching Between Features

```bash
# In tmux:
Ctrl+b n          # Next window
Ctrl+b p          # Previous window
Ctrl+b 1          # Go to window 1
Ctrl+b 2          # Go to window 2
Ctrl+b w          # Show window list, select with arrows
```

### Quick Hotfix While Working on Features

```bash
# 1. Switch to "main" window
Ctrl+b 0  # or Ctrl+b w and select "main"

# 2. Create hotfix branch (no worktree needed for quick fix)
cd ~/projects/eimzo-monorepo
git checkout -b hotfix/urgent-typo

# 3. Quick Claude session
claude --session hotfix-typo

# 4. Fix and commit
/h "Fix typo in error message"

# 5. Merge and cleanup
git checkout main
git merge hotfix/urgent-typo
git branch -d hotfix/urgent-typo
git push

# 6. Return to feature work
Ctrl+b 1  # Back to feat-caching window
```

### Ending Work Session

```bash
# Option 1: Detach tmux (keep everything running)
Ctrl+b d
# Later: tmux attach -t eimzo

# Option 2: Close Claude sessions but keep tmux
# In each window, exit Claude: /exit or Ctrl+C
# Windows stay open for next session

# Option 3: Full cleanup
# Close all Claude sessions
# Remove merged worktrees:
git worktree remove ../eimzo-feat-caching
# Kill tmux: tmux kill-session -t eimzo
```

---

## Part 4: Daily Workflow Example

### Morning: Resume Work

```bash
# 1. Reattach to tmux
tmux attach -t eimzo

# 2. You're back with all windows intact
# Switch to feature you want to work on
Ctrl+b w  # Select window

# 3. Resume Claude session
claude --resume feat-caching

# 4. Continue where you left off
# Claude reads docs/contexts/feat-caching.md automatically
```

### During Day: Context Switching

```bash
# Working on feat-caching...
# Boss: "Quick fix needed!"

# 1. Switch to main window
Ctrl+b 0

# 2. Handle hotfix
git checkout -b hotfix/urgent
claude --session hotfix-urgent
/h "Fix the urgent thing"
# ... commit, merge, push ...

# 3. Return to feature
Ctrl+b 1
# Claude session still running with full context
```

### Evening: Save Progress

```bash
# In each active Claude session:
# Claude automatically updates docs/contexts/{task}.md

# Detach tmux (everything keeps running)
Ctrl+b d

# Or if shutting down computer:
# Exit Claude sessions gracefully: /exit
# Close tmux: exit in each window
```

---

## Part 5: Recommended tmux Config

Add to `~/.tmux.conf`:

```bash
# Better prefix (optional - Ctrl+a instead of Ctrl+b)
# set -g prefix C-a
# unbind C-b

# Enable mouse (scroll, click to switch panes)
set -g mouse on

# Start window numbers at 1
set -g base-index 1

# Faster key repetition
set -s escape-time 0

# Increase history
set -g history-limit 10000

# Better colors
set -g default-terminal "screen-256color"

# Status bar
set -g status-style 'bg=#333333 fg=#ffffff'
set -g window-status-current-style 'bg=#555555 bold'

# Show session name and window name
set -g status-left '[#S] '
set -g status-right '%H:%M'
```

Reload config: `tmux source-file ~/.tmux.conf`

---

## Part 6: Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL DEVELOPMENT                          │
├─────────────────────────────────────────────────────────────────┤│ TMUX                                                             │
│   tmux new -s eimzo          Start session                       │
│   tmux attach -t eimzo       Reattach                            │
│   Ctrl+b d                   Detach                              │
│   Ctrl+b c                   New window                          │
│   Ctrl+b ,                   Rename window                       │
│   Ctrl+b n/p                 Next/prev window                    │
│   Ctrl+b 0-9                 Go to window N                      │
│   Ctrl+b w                   List windows                        │
├─────────────────────────────────────────────────────────────────┤
│ GIT WORKTREES                                                    │
│   git worktree add ../name branch    Create worktree             │
│   git worktree list                  List all                    │
│   git worktree remove ../name        Remove worktree             │
├─────────────────────────────────────────────────────────────────┤
│ CLAUDE SESSIONS                                                  │
│   claude --session name      Start named session                 │
│   claude --resume name       Resume session                      │
│   /sessions                  List sessions                       │
├─────────────────────────────────────────────────────────────────┤
│ WORKFLOW                                                         │
│   1. tmux new -s eimzo                                           │
│   2. Ctrl+b c → rename → create worktree → cd                    │
│   3. claude --session {name}                                     │
│   4. /f "feature description"                                    │
│   5. Work... Ctrl+b n to switch... work on other feature         │
│   6. Ctrl+b d to detach when done                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Worktree already exists"
```bash
git worktree prune
# Then try again
```

### "Branch already checked out"
```bash
# A branch can only be in one worktree
# Either remove the existing worktree or use a different branch
git worktree list  # See where branch is checked out
```

### "tmux session not found"
```bash
tmux ls  # List all sessions
# If empty, start new: tmux new -s eimzo
```

### Lost Claude context
```bash
# Context is saved in docs/contexts/{session-name}.md
# Resume with: claude --resume {session-name}
# Or check: cat docs/contexts/{task}.md
```
