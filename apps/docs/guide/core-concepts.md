# Core Concepts

## Architecture Overview

The E-IMZO SDK follows a layered architecture:

```
Vue App
   |
   v
@eimzo/vue (useESignature, VueESignature plugin)
   |
   v
@eimzo/core (EIMZOClient, middleware, events)
   |
   v
E-IMZO Desktop App (WebSocket: wss://127.0.0.1:64443)
   |
   v
Certificate Store / Hardware Tokens
```

## Key Components

### EIMZOClient

The core client that communicates with E-IMZO desktop app:

```typescript
import { EIMZOClient } from '@eimzo/core'

const client = new EIMZOClient()
await client.install()
const certs = await client.listAllUserKeys()
```

### useESignature Composable

Vue 3 composable providing reactive state:

```typescript
const {
  // State (readonly refs)
  isInstalled, // Connection status
  isLoading, // Operation in progress
  error, // Current error message
  certificates, // Available certificates
  loadedCert, // Currently loaded certificate
  connectionState, // 'disconnected' | 'connecting' | 'connected' | 'error' | 'retrying'

  // Methods
  install, // Initialize connection
  listKeys, // List certificates
  loadKey, // Load certificate for signing
  signData, // Create signature
  reconnect, // Manual reconnection
} = useESignature()
```

### Middleware System

Intercept and transform operations:

```typescript
const loggingMiddleware: Middleware = async (ctx, next) => {
  console.log(`Starting ${ctx.operation}`)
  const result = await next()
  console.log(`Completed ${ctx.operation}`)
  return result
}
```

## Certificate Lifecycle

```
1. install()
   └── Connects to E-IMZO desktop app
       └── Verifies API key (if configured)

2. listAllUserKeys()
   └── Retrieves all certificates
       └── PFX files from disk
       └── ID card (if connected)
       └── Hardware tokens

3. loadKey(cert)
   └── Loads certificate into memory
       └── May prompt for PIN/password
       └── Returns key ID for signing

4. createPkcs7(keyId, data)
   └── Creates PKCS#7 signature
       └── Uses loaded key
       └── Returns base64 signature
```

## Connection States

| State | Description |
|-------|-------------|
| `disconnected` | Not connected to E-IMZO |
| `connecting` | Connection in progress |
| `connected` | Successfully connected |
| `error` | Connection or operation failed |
| `retrying` | Automatic retry in progress |

## Events System

Subscribe to lifecycle events:

```typescript
import { EIMZOEventEmitter } from '@eimzo/core'

const emitter = new EIMZOEventEmitter()

emitter.on('connection:established', () => {
  console.log('Connected to E-IMZO')
})

emitter.on('operation:error', (error) => {
  console.error('Operation failed:', error)
})
```

## Type Safety

The SDK uses branded types for compile-time safety:

```typescript
import type { Certificate, SignatureResult } from '@eimzo/core'

// Type-safe certificate handling
const cert: Certificate = certificates[0]
const signature: SignatureResult = await signData(data)
```

## Next Steps

- [Working with Certificates](/guide/certificates)
- [Signing Documents](/guide/signing)
- [Error Handling](/guide/error-handling)
