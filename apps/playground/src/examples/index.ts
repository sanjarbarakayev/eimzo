/**
 * Code examples for the playground
 */

export const examples: Record<string, string> = {
  'basic': `<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature } from '@eimzo/vue'

const {
  isInstalled,
  isLoading,
  error,
  certificates,
  install,
  listKeys,
  loadKey,
  signData,
} = useESignature()

const selectedCert = ref(null)
const document = ref('Hello, World!')
const signature = ref(null)

onMounted(async () => {
  await install()
  await listKeys()
})

const sign = async () => {
  if (!selectedCert.value) return
  await loadKey(selectedCert.value)
  const result = await signData(document.value)
  signature.value = typeof result === 'string'
    ? result
    : result.pkcs7
}
</script>

<template>
  <div>
    <select v-model="selectedCert">
      <option :value="null">Select certificate...</option>
      <option
        v-for="cert in certificates"
        :key="cert.serialNumber"
        :value="cert"
      >
        {{ cert.CN }}
      </option>
    </select>

    <textarea v-model="document" />

    <button @click="sign" :disabled="!selectedCert">
      Sign
    </button>

    <div v-if="signature">
      Signature: {{ signature.substring(0, 50) }}...
    </div>
  </div>
</template>`,

  'certificates': `<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useESignature } from '@eimzo/vue'

const {
  certificates,
  loadedCert,
  install,
  listKeys,
  loadKey
} = useESignature()

// Filter state
const typeFilter = ref('')
const searchQuery = ref('')

// Filtered certificates
const filteredCerts = computed(() => {
  return certificates.value.filter(cert => {
    const matchesType = !typeFilter.value || cert.type === typeFilter.value
    const matchesSearch = !searchQuery.value ||
      cert.CN.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesType && matchesSearch
  })
})

// Certificate types for filter
const certTypes = computed(() => {
  const types = new Set(certificates.value.map(c => c.type))
  return Array.from(types)
})

// Check if expired
const isExpired = (cert) => new Date() > cert.validTo

onMounted(async () => {
  await install()
  await listKeys()
})
</script>

<template>
  <div class="cert-explorer">
    <!-- Filters -->
    <div class="filters">
      <input
        v-model="searchQuery"
        placeholder="Search by name..."
      />
      <select v-model="typeFilter">
        <option value="">All types</option>
        <option v-for="t in certTypes" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
    </div>

    <!-- Certificate list -->
    <div class="cert-list">
      <div
        v-for="cert in filteredCerts"
        :key="cert.serialNumber"
        class="cert-card"
        :class="{
          selected: loadedCert?.serialNumber === cert.serialNumber,
          expired: isExpired(cert)
        }"
        @click="loadKey(cert)"
      >
        <div class="cert-name">{{ cert.CN }}</div>
        <div class="cert-org">{{ cert.O }}</div>
        <div class="cert-meta">
          <span class="type">{{ cert.type }}</span>
          <span v-if="isExpired(cert)" class="expired-badge">
            Expired
          </span>
        </div>
      </div>
    </div>
  </div>
</template>`,

  'error-handling': `<script setup lang="ts">
import { computed } from 'vue'
import { useESignature } from '@eimzo/vue'
import { classifyError, getErrorMessage, setLocale } from '@eimzo/core'

const {
  error,
  connectionState,
  retryInfo,
  failureCount,
  clearError,
  reconnect,
  cancelRetry,
} = useESignature({
  enableRetry: true,
  maxRetries: 3,
  onRetry: (op, attempt, err) => {
    console.log(\`Retry \${attempt}: \${op}\`)
  }
})

// Classify the error
const errorDetails = computed(() => {
  if (!error.value) return null

  const err = new Error(error.value)
  return {
    type: classifyError(err),
    message: getErrorMessage(error.value),
    canRetry: ['connection', 'timeout'].includes(classifyError(err))
  }
})

// Change language for error messages
const changeLocale = (locale) => {
  setLocale(locale)
}
</script>

<template>
  <div class="error-demo">
    <!-- Connection status -->
    <div class="status" :class="connectionState">
      {{ connectionState }}
    </div>

    <!-- Error display -->
    <div v-if="errorDetails" class="error-box">
      <div class="error-type">{{ errorDetails.type }}</div>
      <div class="error-message">{{ errorDetails.message }}</div>

      <div class="error-actions">
        <button v-if="errorDetails.canRetry" @click="reconnect">
          Retry
        </button>
        <button @click="clearError">Dismiss</button>
      </div>
    </div>

    <!-- Retry progress -->
    <div v-if="retryInfo" class="retry-info">
      <p>Retrying {{ retryInfo.operation }}...</p>
      <p>Attempt {{ retryInfo.attempt }} / {{ retryInfo.maxAttempts }}</p>
      <button @click="cancelRetry">Cancel</button>
    </div>

    <!-- Stats -->
    <div class="stats">
      <p>Failure count: {{ failureCount }}</p>
    </div>

    <!-- Locale selector -->
    <div class="locale-selector">
      <button @click="changeLocale('en')">EN</button>
      <button @click="changeLocale('ru')">RU</button>
      <button @click="changeLocale('uz')">UZ</button>
    </div>
  </div>
</template>`,

  'hardware': `<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature } from '@eimzo/vue'

const {
  install,
  checkUSBToken,
  checkBAIKToken,
  checkCKCDevice,
  signWithUSB,
  signWithBAIK,
  signWithCKC,
} = useESignature()

const hardwareStatus = ref({
  usb: false,
  baik: false,
  ckc: false
})

const document = ref('Document to sign')
const signature = ref(null)

onMounted(async () => {
  await install()

  // Check hardware tokens
  hardwareStatus.value.usb = await checkUSBToken()
  hardwareStatus.value.baik = await checkBAIKToken()
  hardwareStatus.value.ckc = await checkCKCDevice()
})

const signWith = async (type) => {
  try {
    switch (type) {
      case 'usb':
        signature.value = await signWithUSB(document.value)
        break
      case 'baik':
        signature.value = await signWithBAIK(document.value)
        break
      case 'ckc':
        signature.value = await signWithCKC(document.value)
        break
    }
  } catch (error) {
    console.error('Signing failed:', error)
  }
}
</script>

<template>
  <div class="hardware-demo">
    <h3>Hardware Token Status</h3>

    <div class="token-list">
      <div class="token" :class="{ connected: hardwareStatus.usb }">
        <span class="icon">&#128179;</span>
        <span class="name">ID Card / USB Token</span>
        <span class="status">
          {{ hardwareStatus.usb ? 'Connected' : 'Not detected' }}
        </span>
        <button
          @click="signWith('usb')"
          :disabled="!hardwareStatus.usb"
        >
          Sign
        </button>
      </div>

      <div class="token" :class="{ connected: hardwareStatus.baik }">
        <span class="icon">&#128273;</span>
        <span class="name">BAIK Token</span>
        <span class="status">
          {{ hardwareStatus.baik ? 'Connected' : 'Not detected' }}
        </span>
        <button
          @click="signWith('baik')"
          :disabled="!hardwareStatus.baik"
        >
          Sign
        </button>
      </div>

      <div class="token" :class="{ connected: hardwareStatus.ckc }">
        <span class="icon">&#128274;</span>
        <span class="name">CKC Device</span>
        <span class="status">
          {{ hardwareStatus.ckc ? 'Connected' : 'Not detected' }}
        </span>
        <button
          @click="signWith('ckc')"
          :disabled="!hardwareStatus.ckc"
        >
          Sign
        </button>
      </div>
    </div>

    <div class="document-input">
      <textarea v-model="document" rows="4" />
    </div>

    <div v-if="signature" class="result">
      <h4>Signature</h4>
      <code>{{ signature.substring(0, 100) }}...</code>
    </div>
  </div>
</template>`,
}
