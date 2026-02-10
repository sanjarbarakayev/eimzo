<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
}>()

const config = ref({
  timeout: 30000,
  enableRetry: true,
  maxRetries: 3,
  locale: 'en',
})
</script>

<template>
  <div class="config-panel">
    <div class="panel-header">
      <h3>Configuration</h3>
      <button class="close-btn" @click="emit('close')">
        x
      </button>
    </div>

    <div class="panel-content">
      <div class="config-group">
        <label>Timeout (ms)</label>
        <input v-model="config.timeout" type="number">
      </div>

      <div class="config-group">
        <label>
          <input v-model="config.enableRetry" type="checkbox">
          Enable Retry
        </label>
      </div>

      <div class="config-group">
        <label>Max Retries</label>
        <input
          v-model="config.maxRetries"
          type="number"
          :disabled="!config.enableRetry"
        >
      </div>

      <div class="config-group">
        <label>Locale</label>
        <select v-model="config.locale">
          <option value="en">
            English
          </option>
          <option value="ru">
            Russian
          </option>
          <option value="uz">
            Uzbek
          </option>
        </select>
      </div>

      <div class="config-code">
        <h4>Generated Code</h4>
        <pre><code>useESignature({
  timeout: {{ config.timeout }},
  enableRetry: {{ config.enableRetry }},
  maxRetries: {{ config.maxRetries }},
})</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
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

.config-group {
  margin-bottom: 16px;
}

.config-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #858585;
}

.config-group input[type="number"],
.config-group select {
  width: 100%;
  padding: 8px;
  background: #1e1e1e;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  color: #d4d4d4;
}

.config-group input[type="checkbox"] {
  margin-right: 8px;
}

.config-code {
  margin-top: 24px;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 6px;
}

.config-code h4 {
  font-size: 12px;
  color: #858585;
  margin-bottom: 8px;
}

.config-code pre {
  font-size: 12px;
  font-family: monospace;
  overflow-x: auto;
}
</style>
