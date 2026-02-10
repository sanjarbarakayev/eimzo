# Error Handling Example

Comprehensive error handling patterns for E-IMZO operations.

## Features

- Error classification and display
- Connection state monitoring
- Retry with progress indication
- Recovery strategies
- User-friendly messages

## Component

```vue
<script setup lang="ts">
import {
  classifyError,
  getErrorMessage,
  isTransientError,
  setLocale,
} from '@eimzo/core'
import { useESignature } from '@eimzo/vue'
import { computed, ref, watch } from 'vue'

const {
  error,
  connectionState,
  retryInfo,
  failureCount,
  lastSuccessTime,
  clearError,
  reconnect,
  cancelRetry,
  install,
  signData,
} = useESignature({
  enableRetry: true,
  maxRetries: 3,
  onRetry: (operation, attempt, err) => {
    retryHistory.value.push({
      operation,
      attempt,
      error: err.message,
      timestamp: new Date(),
    })
  },
})

// Language selection
const selectedLocale = ref<'uz' | 'ru' | 'en'>('en')
watch(selectedLocale, locale => setLocale(locale))

// Retry history for debugging
const retryHistory = ref<{
  operation: string
  attempt: number
  error: string
  timestamp: Date
}[]>([])

// Error details
const errorDetails = computed(() => {
  if (!error.value)
    return null

  const err = new Error(error.value)
  const type = classifyError(err)
  const isTransient = isTransientError(err)
  const localizedMessage = getErrorMessage(error.value)

  return {
    raw: error.value,
    type,
    isTransient,
    localizedMessage,
    canRetry: type === 'connection' || type === 'timeout' || isTransient,
  }
})

// Connection status styling
const connectionStatusClass = computed(() => ({
  connected: connectionState.value === 'connected',
  connecting: connectionState.value === 'connecting',
  retrying: connectionState.value === 'retrying',
  error: connectionState.value === 'error',
  disconnected: connectionState.value === 'disconnected',
}))

// Simulate operations for testing
async function simulateOperation(type: 'success' | 'timeout' | 'connection') {
  try {
    switch (type) {
      case 'success':
        await install()
        break
      case 'timeout':
        // This would timeout if E-IMZO is slow
        await signData('test')
        break
      case 'connection':
        // This would fail if E-IMZO is not running
        await install()
        break
    }
  }
  catch (err) {
    // Error is automatically captured in error.value
  }
}

// Manual reconnection
async function handleReconnect() {
  retryHistory.value = []
  const success = await reconnect()
  if (success) {
    clearError()
  }
}

// Clear all state
function clearAll() {
  clearError()
  retryHistory.value = []
}
</script>

<template>
  <div class="error-handling-demo">
    <h1>Error Handling Demo</h1>

    <!-- Language selector -->
    <div class="language-selector">
      <label>Error message language:</label>
      <select v-model="selectedLocale">
        <option value="en">
          English
        </option>
        <option value="ru">
          Русский
        </option>
        <option value="uz">
          O'zbekcha
        </option>
      </select>
    </div>

    <!-- Connection status panel -->
    <div class="status-panel">
      <h2>Connection Status</h2>

      <div class="status-indicator" :class="connectionStatusClass">
        <span class="status-dot" />
        <span class="status-text">{{ connectionState }}</span>
      </div>

      <div class="status-details">
        <p><strong>Failure count:</strong> {{ failureCount }}</p>
        <p>
          <strong>Last success:</strong>
          {{ lastSuccessTime ? lastSuccessTime.toLocaleTimeString() : 'Never' }}
        </p>
      </div>

      <!-- Retry progress -->
      <div v-if="retryInfo" class="retry-progress">
        <h3>Retry in Progress</h3>
        <p>Operation: {{ retryInfo.operation }}</p>
        <p>Attempt: {{ retryInfo.attempt }} / {{ retryInfo.maxAttempts }}</p>
        <div class="progress-bar">
          <div
            class="progress"
            :style="{ width: `${(retryInfo.attempt / retryInfo.maxAttempts) * 100}%` }"
          />
        </div>
        <button class="btn-cancel" @click="cancelRetry">
          Cancel Retry
        </button>
      </div>
    </div>

    <!-- Error display panel -->
    <div v-if="errorDetails" class="error-panel" :class="errorDetails.type">
      <h2>Error Details</h2>

      <div class="error-header">
        <span class="error-type-badge">{{ errorDetails.type }}</span>
        <span v-if="errorDetails.isTransient" class="transient-badge">
          Transient
        </span>
      </div>

      <div class="error-message">
        <p class="localized">
          {{ errorDetails.localizedMessage }}
        </p>
        <p class="raw">
          Raw: {{ errorDetails.raw }}
        </p>
      </div>

      <div class="error-actions">
        <button
          v-if="errorDetails.canRetry"
          class="btn-retry"
          @click="handleReconnect"
        >
          Retry Connection
        </button>
        <button class="btn-dismiss" @click="clearAll">
          Dismiss
        </button>
      </div>

      <!-- Error type specific guidance -->
      <div class="error-guidance">
        <template v-if="errorDetails.type === 'connection'">
          <h4>Connection Error</h4>
          <ul>
            <li>Make sure E-IMZO desktop app is running</li>
            <li>Check if the app is properly installed</li>
            <li>Try restarting the E-IMZO application</li>
          </ul>
        </template>

        <template v-else-if="errorDetails.type === 'timeout'">
          <h4>Timeout Error</h4>
          <ul>
            <li>The operation took too long to complete</li>
            <li>Check your hardware token connection</li>
            <li>Try the operation again</li>
          </ul>
        </template>

        <template v-else-if="errorDetails.type === 'certificate'">
          <h4>Certificate Error</h4>
          <ul>
            <li>The selected certificate may be expired</li>
            <li>Try selecting a different certificate</li>
            <li>Verify your certificate is valid</li>
          </ul>
        </template>

        <template v-else-if="errorDetails.type === 'user_cancelled'">
          <h4>Operation Cancelled</h4>
          <p>You cancelled the operation. No action needed.</p>
        </template>
      </div>
    </div>

    <!-- No error state -->
    <div v-else class="no-error-panel">
      <p>No errors. System is functioning normally.</p>
    </div>

    <!-- Retry history -->
    <div v-if="retryHistory.length > 0" class="retry-history">
      <h2>Retry History</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Operation</th>
            <th>Attempt</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, i) in retryHistory" :key="i">
            <td>{{ entry.timestamp.toLocaleTimeString() }}</td>
            <td>{{ entry.operation }}</td>
            <td>{{ entry.attempt }}</td>
            <td>{{ entry.error }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Test buttons (for demo) -->
    <div class="test-buttons">
      <h2>Test Error Scenarios</h2>
      <p>Use these buttons to simulate different error conditions:</p>
      <button @click="simulateOperation('success')">
        Test Connection
      </button>
      <button @click="simulateOperation('timeout')">
        Simulate Timeout
      </button>
      <button @click="simulateOperation('connection')">
        Simulate Connection Error
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-handling-demo {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.language-selector {
  margin-bottom: 20px;
}

.language-selector select {
  margin-left: 10px;
  padding: 5px 10px;
}

.status-panel {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.status-indicator.connected { background: #d4edda; }
.status-indicator.connecting,
.status-indicator.retrying { background: #fff3cd; }
.status-indicator.error { background: #f8d7da; }
.status-indicator.disconnected { background: #e2e3e5; }

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
}

.status-indicator.connected .status-dot { background: #28a745; }
.status-indicator.connecting .status-dot,
.status-indicator.retrying .status-dot { background: #ffc107; }
.status-indicator.error .status-dot { background: #dc3545; }
.status-indicator.disconnected .status-dot { background: #6c757d; }

.retry-progress {
  background: #fff3cd;
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  margin: 10px 0;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #ffc107;
  transition: width 0.3s;
}

.error-panel {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.error-panel.connection { border-left: 4px solid #dc3545; }
.error-panel.timeout { border-left: 4px solid #ffc107; }
.error-panel.certificate { border-left: 4px solid #17a2b8; }
.error-panel.user_cancelled { border-left: 4px solid #6c757d; }

.error-header {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.error-type-badge {
  padding: 4px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
}

.transient-badge {
  padding: 4px 12px;
  background: #fff3cd;
  border-radius: 4px;
  font-size: 12px;
}

.error-message .localized {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.error-message .raw {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.error-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.btn-retry {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-dismiss,
.btn-cancel {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-guidance {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
}

.error-guidance h4 {
  margin: 0 0 10px;
}

.error-guidance ul {
  margin: 0;
  padding-left: 20px;
}

.no-error-panel {
  background: #d4edda;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
}

.retry-history {
  margin-bottom: 20px;
}

.retry-history table {
  width: 100%;
  border-collapse: collapse;
}

.retry-history th,
.retry-history td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.retry-history th {
  background: #f8f9fa;
}

.test-buttons {
  background: #e9ecef;
  padding: 20px;
  border-radius: 8px;
}

.test-buttons button {
  margin-right: 10px;
  margin-top: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #007bff;
  color: white;
}
</style>
```

## Key Patterns

### 1. Error Classification

```typescript
import { classifyError } from '@eimzo/core'

const type = classifyError(error)
// 'connection' | 'timeout' | 'certificate' | 'user_cancelled' | 'transient' | 'permanent'
```

### 2. Localized Messages

```typescript
import { getErrorMessage, setLocale } from '@eimzo/core'

setLocale('uz')
const message = getErrorMessage('CONNECTION_ERROR')
```

### 3. Retry Handling

```typescript
const { ... } = useESignature({
  enableRetry: true,
  maxRetries: 3,
  onRetry: (operation, attempt, error) => {
    showToast(`Retrying ${operation} (${attempt}/3)`)
  },
})
```

### 4. Connection Recovery

```typescript
const { reconnect, cancelRetry, connectionState } = useESignature()

// Manual reconnection
await reconnect()

// Cancel ongoing retry
cancelRetry()
```

## Next Steps

- [Basic Signing Example](/examples/basic-signing)
- [Error Handling Guide](/guide/error-handling)
