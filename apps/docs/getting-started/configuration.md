# Configuration

## Client Options

The E-IMZO client accepts various configuration options:

```typescript
import { createEIMZOClient } from '@eimzo/core'

const client = createEIMZOClient({
  // Timeout for operations (default: 30000ms)
  timeout: 30000,

  // Enable automatic retry on transient failures (default: true)
  enableRetry: true,

  // Maximum retry attempts (default: 3)
  maxRetries: 3,

  // Middleware for request/response interception
  middleware: [],

  // WebSocket adapter (default: BrowserWebSocketAdapter)
  adapter: undefined,

  // Event emitter for lifecycle events
  eventEmitter: undefined,
})
```

## Vue Composable Options

```typescript
import { useESignature } from '@eimzo/vue'

const { ... } = useESignature({
  // All client options plus:

  // Auto-reconnect on connection loss (default: true)
  autoReconnect: true,

  // Health check interval in ms, 0 to disable (default: 0)
  healthCheckInterval: 0,

  // Retry callback
  onRetry: (operation, attempt, error) => {
    console.log(`Retrying ${operation} (attempt ${attempt})`)
  },
})
```

## Vue Plugin Options

```typescript
import { VueESignature } from '@eimzo/vue'
import { createApp } from 'vue'

app.use(VueESignature, {
  // API keys for domain authorization
  apiKeys: [
    { domain: 'your-domain.com', key: 'YOUR_API_KEY' }
  ],

  // Auto-install on plugin registration (default: false)
  autoInstall: false,
})
```

## Middleware Configuration

Add middleware for logging, caching, and custom behavior:

```typescript
import {
  cachingMiddleware,
  createEIMZOClient,
  loggingMiddleware,
  performanceMiddleware,
} from '@eimzo/core'

const client = createEIMZOClient({
  middleware: [
    // Log all operations
    loggingMiddleware,

    // Warn if operations take > 5 seconds
    performanceMiddleware(5000),

    // Cache results for 5 minutes
    cachingMiddleware(300000),
  ],
})
```

## Environment Variables

For secure API key management:

```bash
# .env
VITE_EIMZO_API_KEY=your-api-key
VITE_EIMZO_DOMAIN=your-domain.com
```

```typescript
// main.ts
app.use(VueESignature, {
  apiKeys: [
    {
      domain: import.meta.env.VITE_EIMZO_DOMAIN,
      key: import.meta.env.VITE_EIMZO_API_KEY,
    }
  ],
})
```

## Internationalization

Configure language for error messages:

```typescript
import { setLocale } from '@eimzo/core'

// Supported: 'uz', 'ru', 'en'
setLocale('uz')
```

Auto-detect browser language:

```typescript
import { detectAndSetBrowserLocale } from '@eimzo/core'

detectAndSetBrowserLocale()
```

## Next Steps

- [Core Concepts](/guide/core-concepts)
- [Middleware System](/guide/middleware)
- [Error Handling](/guide/error-handling)
