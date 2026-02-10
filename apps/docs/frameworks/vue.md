# Vue.js Integration

## Installation

```bash
pnpm add @eimzo/core @eimzo/vue
```

## Plugin Setup

Register the plugin in your main entry file:

```typescript
import { VueESignature } from '@eimzo/vue'
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.use(VueESignature, {
  // Optional: API keys for domain authorization
  apiKeys: [
    { domain: 'your-domain.com', key: 'API_KEY' }
  ]
})

app.mount('#app')
```

## useESignature Composable

The main composable provides all E-IMZO functionality:

```typescript
import { useESignature } from '@eimzo/vue'

const {
  // Reactive state
  signer, // ESignature instance
  isInstalled, // Ref<boolean>
  isLoading, // Ref<boolean>
  error, // Ref<string | null>
  certificates, // Ref<Certificate[]>
  loadedCert, // Ref<Certificate | null>
  loadedKeyId, // Ref<string | null>
  connectionState, // Ref<ConnectionState>
  retryInfo, // Ref<RetryInfo | null>
  failureCount, // Ref<number>
  lastSuccessTime, // Ref<Date | null>

  // Methods
  install, // () => Promise<boolean>
  listKeys, // () => Promise<Certificate[]>
  loadKey, // (cert) => Promise<LoadKeyResult>
  signData, // (data, keyId?) => Promise<SignPkcs7Result>
  signWithUSB, // (data) => Promise<string>
  signWithBAIK, // (data) => Promise<string>
  signWithCKC, // (data) => Promise<string>
  checkUSBToken, // () => Promise<boolean>
  checkBAIKToken, // () => Promise<boolean>
  checkCKCDevice, // () => Promise<boolean>
  clearError, // () => void
  reset, // () => void
  reconnect, // () => Promise<boolean>
  cancelRetry, // () => void
} = useESignature()
```

## Composable Options

```typescript
const { ... } = useESignature({
  // Operation timeout (default: 30000ms)
  timeout: 30000,

  // Enable automatic retry (default: true)
  enableRetry: true,

  // Max retry attempts (default: 3)
  maxRetries: 3,

  // Auto-reconnect on connection loss (default: true)
  autoReconnect: true,

  // Health check interval in ms (default: 0 = disabled)
  healthCheckInterval: 30000,

  // Retry callback
  onRetry: (operation, attempt, error) => {
    console.log(`Retrying ${operation} (${attempt}/${maxRetries})`)
  }
})
```

## Complete Example

```vue
<script setup lang="ts">
import type { Certificate } from '@eimzo/vue'
import { useESignature } from '@eimzo/vue'
import { computed, onMounted, ref } from 'vue'

const {
  isInstalled,
  isLoading,
  error,
  certificates,
  connectionState,
  install,
  listKeys,
  loadKey,
  signData,
  clearError,
} = useESignature()

const selectedCert = ref<Certificate | null>(null)
const documentText = ref('')
const signature = ref<string | null>(null)

// Initialize on mount
onMounted(async () => {
  const success = await install()
  if (success) {
    await listKeys()
  }
})

// Filter valid certificates
const validCerts = computed(() =>
  certificates.value.filter(c => new Date() < c.validTo)
)

// Sign document
async function handleSign() {
  if (!selectedCert.value || !documentText.value)
    return

  try {
    await loadKey(selectedCert.value)
    const result = await signData(documentText.value)
    signature.value = typeof result === 'string' ? result : result.pkcs7
  }
  catch (err) {
    console.error('Signing failed:', err)
  }
}
</script>

<template>
  <div class="esignature-demo">
    <!-- Connection status -->
    <div class="status" :class="connectionState">
      Status: {{ connectionState }}
    </div>

    <!-- Error display -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <button @click="clearError">
        Dismiss
      </button>
    </div>

    <!-- Not installed -->
    <div v-if="!isInstalled && !isLoading">
      <p>E-IMZO is not available.</p>
      <a href="https://e-imzo.uz" target="_blank">Download E-IMZO</a>
    </div>

    <!-- Main form -->
    <div v-else-if="isInstalled">
      <div class="form-group">
        <label>Certificate</label>
        <select v-model="selectedCert" :disabled="isLoading">
          <option :value="null">
            Select certificate...
          </option>
          <option
            v-for="cert in validCerts"
            :key="cert.serialNumber"
            :value="cert"
          >
            {{ cert.CN }} ({{ cert.type }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Document</label>
        <textarea
          v-model="documentText"
          rows="5"
          placeholder="Enter text to sign..."
          :disabled="isLoading"
        />
      </div>

      <button
        :disabled="isLoading || !selectedCert || !documentText"
        @click="handleSign"
      >
        {{ isLoading ? 'Signing...' : 'Sign Document' }}
      </button>

      <div v-if="signature" class="result">
        <label>Signature (Base64)</label>
        <textarea :value="signature" readonly rows="5" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-overlay">
      Loading...
    </div>
  </div>
</template>

<style scoped>
.status {
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 16px;
}
.status.connected { background: #d4edda; }
.status.error { background: #f8d7da; }
.status.connecting, .status.retrying { background: #fff3cd; }
.status.disconnected { background: #e2e3e5; }

.error-banner {
  background: #f8d7da;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 16px;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

## Provide/Inject Pattern

Access the signer instance anywhere in your app:

```vue
<script setup lang="ts">
import { ESIGNATURE_INJECTION_KEY } from '@eimzo/vue'
import { inject } from 'vue'

const signer = inject(ESIGNATURE_INJECTION_KEY)

if (signer) {
  // Use signer directly
  const certs = await signer.listAllUserKeys()
}
</script>
```

## Next Steps

- [Nuxt Integration](/frameworks/nuxt)
- [Examples](/examples/basic-signing)
