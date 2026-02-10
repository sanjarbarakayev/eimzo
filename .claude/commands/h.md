# /h - Hotfix Shortcut

Shortcut for `/task hotfix`.

## Usage

```
/h "Fix typo in error message"
/h Update version number
```

## Behavior

This is an alias for `/task hotfix`. When invoked:

1. Invoke the `/task` command with type `hotfix`
2. Pass the description argument
3. Follow the hotfix workflow:
   - Haiku/Sonnet quick fix
   - Minimal review
   - Commit with "fix:" prefix

## Important

Use hotfix ONLY for:
- Typo fixes
- Minor text changes
- Version bumps
- Trivial one-line fixes

For actual bugs, use `/b` (bugfix) instead.

## Example

```
User: /h "Fix typo: 'Certifcate' -> 'Certificate'"

# Equivalent to:
User: /task hotfix "Fix typo: 'Certifcate' -> 'Certificate'"
```

See `/task` command for full workflow details.
