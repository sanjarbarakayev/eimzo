# /b - Bugfix Shortcut

Shortcut for `/task bugfix`.

## Usage

```
/b "WebSocket doesn't reconnect"
/b Fix timeout error in signing
```

## Behavior

This is an alias for `/task bugfix`. When invoked:

1. Invoke the `/task` command with type `bugfix`
2. Pass the description argument
3. Follow the bugfix workflow:
   - Sonnet analyzes bug
   - Sonnet writes reproducing test
   - Sonnet fixes bug
   - Opus reviews
   - Commit with "fix:" prefix

## Example

```
User: /b "Certificate loading fails with wrong password"

# Equivalent to:
User: /task bugfix "Certificate loading fails with wrong password"
```

See `/task` command for full workflow details.
