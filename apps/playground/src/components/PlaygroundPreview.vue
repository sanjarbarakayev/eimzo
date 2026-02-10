<script setup lang="ts">
import type { Certificate } from '@eimzo/vue'
import { useESignature } from '@eimzo/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { mockCertificates } from '../mock/mock-certificates'

const props = defineProps<{
  example: string
  mockMode: boolean
}>()

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
const documentText = ref('Hello, World! This is a test document.')
const signature = ref<string | null>(null)
const logs = ref<{ type: string, message: string, time: Date }[]>([])

// Use mock certificates in mock mode
const availableCerts = computed(() =>
  props.mockMode ? mockCertificates : certificates.value,
)

function log(type: string, message: string) {
  logs.value.unshift({ type, message, time: new Date() })
  if (logs.value.length > 50)
    logs.value.pop()
}

onMounted(async () => {
  if (!props.mockMode) {
    log('info', 'Connecting to E-IMZO...')
    const success = await install()
    if (success) {
      log('success', 'Connected to E-IMZO')
      await listKeys()
      log('info', `Found ${certificates.value.length} certificates`)
    }
    else {
      log('error', 'Failed to connect to E-IMZO')
    }
  }
  else {
    log('info', 'Mock mode enabled - using mock certificates')
  }
})

watch(
  () => props.mockMode,
  async (isMock) => {
    if (isMock) {
      log('info', 'Switched to mock mode')
    }
    else {
      log('info', 'Switched to live mode - connecting to E-IMZO...')
      const success = await install()
      if (success) {
        log('success', 'Connected to E-IMZO')
        await listKeys()
      }
    }
  },
)

async function handleSign() {
  if (!selectedCert.value || !documentText.value)
    return

  log('info', `Signing with ${selectedCert.value.CN}...`)

  if (props.mockMode) {
    // Simulate signing in mock mode
    await new Promise(r => setTimeout(r, 500))
    signature.value = btoa(`MOCK_SIGNATURE_${Date.now()}_${documentText.value.substring(0, 20)}`)
    log('success', 'Document signed (mock)')
    return
  }

  try {
    await loadKey(selectedCert.value)
    const result = await signData(documentText.value)
    signature.value = typeof result === 'string' ? result : result.pkcs7
    log('success', 'Document signed successfully')
  }
  catch (err) {
    log('error', `Signing failed: ${err}`)
  }
}
</script>

<template>
  <div class="preview-wrapper">
    <div class="preview-header">
      <span>Preview</span>
      <span class="status" :class="connectionState">
        {{ props.mockMode ? "Mock" : connectionState }}
      </span>
    </div>

    <div class="preview-content">
      <!-- Error Banner -->
      <div v-if="error" class="error-banner">
        {{ error }}
        <button @click="clearError">
          Dismiss
        </button>
      </div>

      <!-- Not Connected -->
      <div v-if="!props.mockMode && !isInstalled && !isLoading" class="info-box">
        <p>E-IMZO not connected.</p>
        <p>Make sure the desktop app is running.</p>
      </div>

      <!-- Main Form -->
      <div v-else class="form">
        <div class="form-group">
          <label>Certificate</label>
          <select v-model="selectedCert" :disabled="isLoading">
            <option :value="null">
              Select certificate...
            </option>
            <option
              v-for="cert in availableCerts"
              :key="cert.serialNumber"
              :value="cert"
            >
              {{ cert.CN }} ({{ cert.type }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Document</label>
          <textarea v-model="documentText" rows="4" :disabled="isLoading" />
        </div>

        <button
          class="sign-btn"
          :disabled="isLoading || !selectedCert || !documentText"
          @click="handleSign"
        >
          {{ isLoading ? "Signing..." : "Sign Document" }}
        </button>

        <div v-if="signature" class="result">
          <label>Signature</label>
          <textarea :value="signature" readonly rows="4" />
        </div>
      </div>

      <!-- Log Panel -->
      <div class="log-panel">
        <div class="log-header">
          Console
        </div>
        <div class="log-content">
          <div
            v-for="(item, i) in logs"
            :key="i"
            class="log-item"
            :class="item.type"
          >
            <span class="log-time">{{ item.time.toLocaleTimeString() }}</span>
            <span class="log-message">{{ item.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  font-size: 12px;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.status.connected,
.status.Mock {
  background: #22c55e;
  color: white;
}

.status.connecting,
.status.retrying {
  background: #f59e0b;
  color: white;
}

.status.error,
.status.disconnected {
  background: #ef4444;
  color: white;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: auto;
}

.error-banner {
  background: #450a0a;
  color: #fca5a5;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-banner button {
  background: #7f1d1d;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  color: #fca5a5;
  cursor: pointer;
}

.info-box {
  background: #1e3a5f;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #858585;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  background: #2d2d2d;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  color: #d4d4d4;
  font-family: inherit;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0e639c;
}

.sign-btn {
  padding: 12px 20px;
  background: #0e639c;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.sign-btn:hover:not(:disabled) {
  background: #1177bb;
}

.sign-btn:disabled {
  background: #3c3c3c;
  cursor: not-allowed;
}

.result {
  margin-top: 8px;
}

.result textarea {
  font-family: monospace;
  font-size: 11px;
  background: #1a1a1a;
}

.log-panel {
  margin-top: auto;
  background: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
}

.log-header {
  padding: 8px 12px;
  background: #252526;
  font-size: 12px;
  color: #858585;
}

.log-content {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  font-family: monospace;
}

.log-time {
  color: #858585;
}

.log-item.success .log-message {
  color: #22c55e;
}

.log-item.error .log-message {
  color: #ef4444;
}

.log-item.info .log-message {
  color: #3b82f6;
}
</style>
