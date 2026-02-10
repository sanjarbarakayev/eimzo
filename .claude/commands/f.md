# /f - Feature Shortcut

Shortcut for `/task feature`.

## Usage

```
/f "Add certificate caching"
/f Add certificate caching
```

## Behavior

This is an alias for `/task feature`. When invoked:

1. Invoke the `/task` command with type `feature`
2. Pass the description argument
3. Follow the feature workflow:
   - Opus plans
   - Sonnet implements with TDD
   - Opus reviews
   - Commit with "feat:" prefix

## Example

```
User: /f "Add retry logic to WebSocket"

# Equivalent to:
User: /task feature "Add retry logic to WebSocket"
```

See `/task` command for full workflow details.
