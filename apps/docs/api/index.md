# API Reference

This section contains the auto-generated API documentation for all E-IMZO SDK packages.

## Packages

### @eimzo/core

The core package provides framework-agnostic functionality:

- [EIMZOClient](/api/core/classes/EIMZOClient) - Main client class
- [createEIMZOClient](/api/core/functions/createEIMZOClient) - Client factory
- [Middleware](/api/core/interfaces/Middleware) - Middleware types
- [Events](/api/core/classes/EIMZOEventEmitter) - Event emitter

### @eimzo/vue

Vue 3 integration:

- [useESignature](/api/vue/functions/useESignature) - Main composable
- [VueESignature](/api/vue/variables/VueESignature) - Vue plugin

## Quick Links

### Types

- [Certificate](/api/core/interfaces/Certificate)
- [SignPkcs7Result](/api/core/interfaces/SignPkcs7Result)
- [ConnectionState](/api/core/types/ConnectionState)
- [EIMZOError](/api/core/classes/EIMZOError)

### Utilities

- [detectEIMZO](/api/core/functions/detectEIMZO)
- [withRetry](/api/core/functions/withRetry)
- [withTimeout](/api/core/functions/withTimeout)
- [classifyError](/api/core/functions/classifyError)

### i18n

- [setLocale](/api/core/functions/setLocale)
- [getErrorMessage](/api/core/functions/getErrorMessage)
- [detectAndSetBrowserLocale](/api/core/functions/detectAndSetBrowserLocale)

## Generating API Docs

API documentation is generated using TypeDoc. To regenerate:

```bash
pnpm typedoc
```

The output will be placed in `apps/docs/api/`.
