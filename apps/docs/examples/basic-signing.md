# Basic Signing Example

A complete example of signing a document with E-IMZO.

## Overview

This example demonstrates:
- Initializing the E-IMZO connection
- Listing available certificates
- Selecting a certificate
- Signing a document
- Displaying the signature

## Vue Component

```vue
<script setup lang="ts">
import type { Certificate } from '@eimzo/vue'
import { useESignature } from '@eimzo/vue'
import { computed, onMounted, ref } from 'vue'

// Get composable
const {
  isInstalled,
  isLoading,
  error,
  certificates,
  loadedCert,
  install,
  listKeys,
  loadKey,
  signData,
  clearError,
} = useESignature()

// Local state
const selectedCert = ref<Certificate | null>(null)
const documentText = ref('Hello, World! This is a test document.')
const signature = ref<string | null>(null)
const showSuccess = ref(false)

// Computed
const canSign = computed(() =>
  selectedCert.value && documentText.value && !isLoading.value
)

const validCertificates = computed(() =>
  certificates.value.filter((cert) => {
    const now = new Date()
    return cert.validFrom <= now && now <= cert.validTo
  })
)

// Initialize on mount
onMounted(async () => {
  const success = await install()
  if (success) {
    await listKeys()
  }
})

// Sign document
async function handleSign() {
  if (!selectedCert.value || !documentText.value)
    return

  try {
    // Load the selected certificate
    await loadKey(selectedCert.value)

    // Sign the document
    const result = await signData(documentText.value)

    // Extract signature string
    signature.value = typeof result === 'string' ? result : result.pkcs7

    // Show success message
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  }
  catch (err) {
    console.error('Signing failed:', err)
  }
}

// Copy signature to clipboard
async function copySignature() {
  if (signature.value) {
    await navigator.clipboard.writeText(signature.value)
    alert('Signature copied!')
  }
}

// Reset form
function resetForm() {
  selectedCert.value = null
  documentText.value = ''
  signature.value = null
  clearError()
}
</script>

<template>
  <div class="signing-example">
    <h1>Document Signing</h1>

    <!-- Status indicator -->
    <div class="status-bar">
      <span class="status-dot" :class="{ connected: isInstalled }" />
      <span>{{ isInstalled ? 'Connected' : 'Not connected' }}</span>
    </div>

    <!-- Error display -->
    <div v-if="error" class="error-box">
      <p>{{ error }}</p>
      <button @click="clearError">
        Dismiss
      </button>
    </div>

    <!-- Success message -->
    <div v-if="showSuccess" class="success-box">
      Document signed successfully!
    </div>

    <!-- Not installed message -->
    <div v-if="!isInstalled && !isLoading" class="info-box">
      <p>E-IMZO is not running.</p>
      <p>Please start the E-IMZO application and refresh this page.</p>
      <a href="https://e-imzo.uz" target="_blank" class="download-link">
        Download E-IMZO
      </a>
    </div>

    <!-- Main form -->
    <form v-else class="signing-form" @submit.prevent="handleSign">
      <!-- Certificate selection -->
      <div class="form-group">
        <label for="certificate">Select Certificate</label>
        <select
          id="certificate"
          v-model="selectedCert"
          :disabled="isLoading"
        >
          <option :value="null">
            Choose a certificate...
          </option>
          <option
            v-for="cert in validCertificates"
            :key="cert.serialNumber"
            :value="cert"
          >
            {{ cert.CN }} ({{ cert.type }})
          </option>
        </select>

        <!-- Selected certificate details -->
        <div v-if="selectedCert" class="cert-details">
          <p><strong>Organization:</strong> {{ selectedCert.O }}</p>
          <p><strong>Type:</strong> {{ selectedCert.type }}</p>
          <p><strong>Valid until:</strong> {{ selectedCert.validTo.toLocaleDateString() }}</p>
        </div>
      </div>

      <!-- Document input -->
      <div class="form-group">
        <label for="document">Document Content</label>
        <textarea
          id="document"
          v-model="documentText"
          rows="6"
          placeholder="Enter the text to sign..."
          :disabled="isLoading"
        />
        <p class="hint">
          {{ documentText.length }} characters
        </p>
      </div>

      <!-- Submit button -->
      <div class="form-actions">
        <button
          type="submit"
          :disabled="!canSign"
          class="btn-primary"
        >
          <span v-if="isLoading">Signing...</span>
          <span v-else>Sign Document</span>
        </button>
        <button
          type="button"
          class="btn-secondary"
          @click="resetForm"
        >
          Reset
        </button>
      </div>
    </form>

    <!-- Signature result -->
    <div v-if="signature" class="signature-result">
      <h2>Signature</h2>
      <div class="signature-box">
        <textarea readonly :value="signature" rows="8" />
        <button class="btn-copy" @click="copySignature">
          Copy to Clipboard
        </button>
      </div>
      <p class="hint">
        This is a PKCS#7 (CMS) signature in Base64 format.
      </p>
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner" />
      <p>Processing...</p>
    </div>
  </div>
</template>

<style scoped>
.signing-example {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dc3545;
}

.status-dot.connected {
  background: #28a745;
}

.error-box {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-box {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-box {
  background: #cce5ff;
  color: #004085;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.download-link {
  display: inline-block;
  margin-top: 10px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.cert-details {
  margin-top: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 13px;
}

.cert-details p {
  margin: 5px 0;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.signature-result {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.signature-box {
  position: relative;
}

.signature-box textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  background: #f9f9f9;
}

.btn-copy {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

## Key Points

1. **Initialization**: Call `install()` first to connect to E-IMZO
2. **List Certificates**: Use `listKeys()` to get available certificates
3. **Load Certificate**: Call `loadKey(cert)` before signing
4. **Sign**: Use `signData(data)` to create the signature
5. **Handle Errors**: Check the `error` ref for any failures

## Next Steps

- [Certificate Selection Example](/examples/certificate-selection)
- [Error Handling Example](/examples/error-handling)
