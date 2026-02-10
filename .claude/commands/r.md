# /r - Refactor Shortcut

Shortcut for `/task refactor`.

## Usage

```
/r "Extract utility functions from CAPIWS"
/r Simplify error handling
```

## Behavior

This is an alias for `/task refactor`. When invoked:

1. Invoke the `/task` command with type `refactor`
2. Pass the description argument
3. Follow the refactor workflow:
   - Sonnet plans refactor
   - Sonnet implements (no behavior change)
   - Opus reviews
   - Commit with "refactor:" prefix

## Example

```
User: /r "Split types.ts into separate files"

# Equivalent to:
User: /task refactor "Split types.ts into separate files"
```

See `/task` command for full workflow details.
