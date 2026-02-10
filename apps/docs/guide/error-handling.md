# Error Handling

## Error Types

The SDK classifies errors into categories:

| Type | Description | Recovery |
|------|-------------|----------|
| `connection` | E-IMZO app not running | Prompt to start app |
| `timeout` | Operation timed out | Retry |
| `certificate` | Certificate error | Select different cert |
| `user_cancelled` | User cancelled operation | No action needed |
| `transient` | Temporary failure | Auto-retry |
| `permanent` | Unrecoverable error | Show error message |

## Basic Error Handling

```typescript
import { useESignature } from '@eimzo/vue'

const { error, clearError, signData } = useESignature()

async function sign(data: string) {
  try {
    const signature = await signData(data)
    return signature
  }
  catch (err) {
    // error.value is automatically set
    console.error('Signing failed:', error.value)
  }
}

// Clear error when user acknowledges
function dismissError() {
  clearError()
}
```

## Classifying Errors

```typescript
import { classifyError, EIMZOError } from '@eimzo/core'

function handleError(err: unknown) {
  const errorType = classifyError(err)

  switch (errorType) {
    case 'connection':
      return 'E-IMZO desktop app is not running. Please start it and try again.'

    case 'timeout':
      return 'Operation timed out. Please try again.'

    case 'certificate':
      return 'Certificate error. Please select a different certificate.'

    case 'user_cancelled':
      return null // User cancelled, no message needed

    case 'transient':
      return 'Temporary error. Retrying...'

    default:
      return `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
```

## EIMZOError Class

```typescript
import { EIMZOError } from '@eimzo/core'

try {
  await signData(data)
}
catch (err) {
  if (err instanceof EIMZOError) {
    console.log('Code:', err.code)
    console.log('Message:', err.message)
    console.log('Context:', err.context)
    console.log('Recoverable:', err.recoverable)
  }
}
```

## Automatic Retry

The SDK automatically retries transient failures:

```typescript
const { ... } = useESignature({
  enableRetry: true,
  maxRetries: 3,
  onRetry: (operation, attempt, error) => {
    console.log(`Retrying ${operation} (attempt ${attempt}/${maxRetries})`)
    showToast(`Retrying... (${attempt}/3)`)
  },
})
```

## Connection State Monitoring

```typescript
const { connectionState, retryInfo, reconnect, cancelRetry } = useESignature()

// Watch connection state
watch(connectionState, (state) => {
  switch (state) {
    case 'disconnected':
      showNotification('Not connected to E-IMZO')
      break
    case 'connecting':
      showNotification('Connecting...')
      break
    case 'connected':
      showNotification('Connected to E-IMZO')
      break
    case 'error':
      showNotification('Connection error')
      break
    case 'retrying':
      showNotification(`Retrying... (${retryInfo.value?.attempt})`)
      break
  }
})

// Manual reconnection
async function handleReconnect() {
  const success = await reconnect()
  if (!success) {
    showNotification('Reconnection failed')
  }
}

// Cancel ongoing retry
function handleCancel() {
  cancelRetry()
}
```

## Error Recovery Strategies

```typescript
import {
  certificateRefreshStrategy,
  DEFAULT_RECOVERY_STRATEGIES,
  reconnectStrategy,
  RecoveryExecutor,
} from '@eimzo/core'

const recovery = new RecoveryExecutor(client, {
  strategies: [
    reconnectStrategy,
    certificateRefreshStrategy,
    ...DEFAULT_RECOVERY_STRATEGIES,
  ],
  maxAttempts: 3,
})

try {
  await signData(data)
}
catch (err) {
  const recovered = await recovery.attempt(err)
  if (recovered.success) {
    // Retry the operation
    await signData(data)
  }
  else {
    // Show final error
    showError(recovered.error)
  }
}
```

## Error Handling Middleware

```typescript
import { createEIMZOClient, errorHandlingMiddleware } from '@eimzo/core'

const client = createEIMZOClient({
  middleware: [
    errorHandlingMiddleware((error, ctx) => {
      // Log to error tracking service
      Sentry.captureException(error, {
        tags: { operation: ctx.operation },
      })

      // Re-throw to propagate error
      throw error
    }),
  ],
})
```

## User-Friendly Error Messages

```typescript
import { getErrorMessage, setLocale } from '@eimzo/core'

// Set language
setLocale('uz') // or 'ru', 'en'

// Get localized error message
const message = getErrorMessage('CONNECTION_ERROR')
// Uzbek: "E-IMZO ilovasi ishlamayapti"
// Russian: "Приложение E-IMZO не запущено"
// English: "E-IMZO application is not running"
```

## Complete Error Handling Component

```vue
<script setup lang="ts">
import { classifyError, getErrorMessage } from '@eimzo/core'
import { useESignature } from '@eimzo/vue'
import { computed } from 'vue'

const {
  error,
  connectionState,
  retryInfo,
  clearError,
  reconnect,
  cancelRetry,
} = useESignature()

const errorType = computed(() =>
  error.value ? classifyError(new Error(error.value)) : null
)

const userMessage = computed(() => {
  if (!error.value)
    return null
  return getErrorMessage(error.value)
})

const canRetry = computed(() =>
  errorType.value === 'connection' || errorType.value === 'transient'
)
</script>

<template>
  <div v-if="error" class="error-banner" :class="errorType">
    <p>{{ userMessage }}</p>

    <div class="actions">
      <button v-if="canRetry" @click="reconnect">
        Retry
      </button>
      <button v-if="connectionState === 'retrying'" @click="cancelRetry">
        Cancel
      </button>
      <button @click="clearError">
        Dismiss
      </button>
    </div>

    <div v-if="retryInfo" class="retry-info">
      Attempt {{ retryInfo.attempt }} of {{ retryInfo.maxAttempts }}
    </div>
  </div>
</template>
```

## Next Steps

- [Internationalization](/guide/i18n)
- [Framework Guides](/frameworks/vue)
