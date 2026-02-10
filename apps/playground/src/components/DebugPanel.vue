<script setup lang="ts">
import { useESignature } from '@eimzo/vue'

const emit = defineEmits<{
  close: []
}>()

const {
  isInstalled,
  isLoading,
  error,
  certificates,
  loadedCert,
  loadedKeyId,
  connectionState,
  retryInfo,
  failureCount,
  lastSuccessTime,
} = useESignature()
</script>

<template>
  <div class="debug-panel">
    <div class="panel-header">
      <h3>Debug</h3>
      <button class="close-btn" @click="emit('close')">
        x
      </button>
    </div>

    <div class="panel-content">
      <div class="debug-section">
        <h4>Connection</h4>
        <div class="debug-item">
          <span class="label">State:</span>
          <span class="value" :class="connectionState">{{ connectionState }}</span>
        </div>
        <div class="debug-item">
          <span class="label">Installed:</span>
          <span class="value">{{ isInstalled }}</span>
        </div>
        <div class="debug-item">
          <span class="label">Loading:</span>
          <span class="value">{{ isLoading }}</span>
        </div>
        <div class="debug-item">
          <span class="label">Error:</span>
          <span class="value error">{{ error || "None" }}</span>
        </div>
      </div>

      <div class="debug-section">
        <h4>Certificates</h4>
        <div class="debug-item">
          <span class="label">Count:</span>
          <span class="value">{{ certificates.length }}</span>
        </div>
        <div class="debug-item">
          <span class="label">Loaded Cert:</span>
          <span class="value">{{ loadedCert?.CN || "None" }}</span>
        </div>
        <div class="debug-item">
          <span class="label">Key ID:</span>
          <span class="value mono">{{ loadedKeyId || "None" }}</span>
        </div>
      </div>

      <div class="debug-section">
        <h4>Retry Info</h4>
        <template v-if="retryInfo">
          <div class="debug-item">
            <span class="label">Operation:</span>
            <span class="value">{{ retryInfo.operation }}</span>
          </div>
          <div class="debug-item">
            <span class="label">Attempt:</span>
            <span class="value">{{ retryInfo.attempt }} / {{ retryInfo.maxAttempts }}</span>
          </div>
        </template>
        <div v-else class="debug-item">
          <span class="label">Status:</span>
          <span class="value">No active retry</span>
        </div>
      </div>

      <div class="debug-section">
        <h4>Statistics</h4>
        <div class="debug-item">
          <span class="label">Failure Count:</span>
          <span class="value">{{ failureCount }}</span>
        </div>
        <div class="debug-item">
          <span class="label">Last Success:</span>
          <span class="value">{{ lastSuccessTime?.toLocaleTimeString() || "Never" }}</span>
        </div>
      </div>

      <div class="debug-section">
        <h4>Certificate List</h4>
        <div v-if="certificates.length === 0" class="empty">
          No certificates loaded
        </div>
        <div v-else class="cert-list">
          <div
            v-for="cert in certificates"
            :key="cert.serialNumber"
            class="cert-item"
            :class="{ loaded: loadedCert?.serialNumber === cert.serialNumber }"
          >
            <div class="cert-name">
              {{ cert.CN }}
            </div>
            <div class="cert-type">
              {{ cert.type }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: #252526;
  border-left: 1px solid #3c3c3c;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #3c3c3c;
}

.panel-header h3 {
  font-size: 14px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #858585;
  font-size: 18px;
  cursor: pointer;
}

.close-btn:hover {
  color: #d4d4d4;
}

.panel-content {
  padding: 16px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  font-size: 11px;
  text-transform: uppercase;
  color: #858585;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
}

.debug-item .label {
  color: #858585;
}

.debug-item .value {
  color: #d4d4d4;
}

.debug-item .value.mono {
  font-family: monospace;
  font-size: 11px;
}

.debug-item .value.error {
  color: #ef4444;
}

.debug-item .value.connected {
  color: #22c55e;
}

.debug-item .value.connecting,
.debug-item .value.retrying {
  color: #f59e0b;
}

.debug-item .value.disconnected {
  color: #858585;
}

.empty {
  color: #858585;
  font-size: 12px;
  font-style: italic;
}

.cert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cert-item {
  padding: 8px;
  background: #1e1e1e;
  border-radius: 4px;
  border: 1px solid transparent;
}

.cert-item.loaded {
  border-color: #22c55e;
}

.cert-name {
  font-size: 12px;
  font-weight: 500;
}

.cert-type {
  font-size: 11px;
  color: #858585;
}
</style>
