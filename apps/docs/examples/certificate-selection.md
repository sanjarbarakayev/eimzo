# Certificate Selection Example

A comprehensive certificate selection UI with filtering and details display.

## Features

- Filter by certificate type (PFX, ID Card, BAIK, CKC)
- Filter by validity (valid, expiring soon, expired)
- Search by name
- Certificate details panel
- Hardware token detection

## Component

```vue
<script setup lang="ts">
import type { Certificate } from '@eimzo/vue'
import { useESignature } from '@eimzo/vue'
import { computed, onMounted, ref } from 'vue'

const emit = defineEmits<{
  select: [cert: Certificate]
}>()

const {
  certificates,
  isLoading,
  install,
  listKeys,
  loadKey,
  loadedCert,
  checkUSBToken,
  checkBAIKToken,
  checkCKCDevice,
} = useESignature()

// Filter state
const searchQuery = ref('')
const selectedType = ref<string | null>(null)
const selectedValidity = ref<string | null>(null)

// Hardware detection
const hardwareStatus = ref({
  usb: false,
  baik: false,
  ckc: false,
})

// Initialize
onMounted(async () => {
  await install()
  await listKeys()

  // Check hardware tokens
  hardwareStatus.value.usb = await checkUSBToken()
  hardwareStatus.value.baik = await checkBAIKToken()
  hardwareStatus.value.ckc = await checkCKCDevice()
})

// Certificate types
const certTypes = [
  { value: 'pfx', label: 'Software (PFX)' },
  { value: 'id-card', label: 'ID Card' },
  { value: 'baik', label: 'BAIK Token' },
  { value: 'ckc', label: 'CKC Device' },
]

// Validity options
const validityOptions = [
  { value: 'valid', label: 'Valid' },
  { value: 'expiring', label: 'Expiring Soon (30 days)' },
  { value: 'expired', label: 'Expired' },
]

// Helper functions
const isExpired = (cert: Certificate) => new Date() > cert.validTo

function isExpiringSoon(cert: Certificate) {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  const now = new Date()
  return !isExpired(cert) && (cert.validTo.getTime() - now.getTime()) < thirtyDays
}

function getValidityStatus(cert: Certificate) {
  if (isExpired(cert))
    return 'expired'
  if (isExpiringSoon(cert))
    return 'expiring'
  return 'valid'
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

// Filtered certificates
const filteredCertificates = computed(() => {
  return certificates.value.filter((cert) => {
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const matchesName = cert.CN.toLowerCase().includes(query)
      const matchesOrg = cert.O?.toLowerCase().includes(query)
      if (!matchesName && !matchesOrg)
        return false
    }

    // Type filter
    if (selectedType.value && cert.type !== selectedType.value) {
      return false
    }

    // Validity filter
    if (selectedValidity.value) {
      const status = getValidityStatus(cert)
      if (status !== selectedValidity.value)
        return false
    }

    return true
  })
})

// Group certificates by type
const groupedCertificates = computed(() => {
  const groups: Record<string, Certificate[]> = {}

  for (const cert of filteredCertificates.value) {
    const type = cert.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(cert)
  }

  return groups
})

// Select certificate
async function selectCertificate(cert: Certificate) {
  await loadKey(cert)
  emit('select', cert)
}

// Clear filters
function clearFilters() {
  searchQuery.value = ''
  selectedType.value = null
  selectedValidity.value = null
}
</script>

<template>
  <div class="cert-selector">
    <!-- Hardware status -->
    <div class="hardware-status">
      <h3>Hardware Tokens</h3>
      <div class="token-list">
        <div class="token" :class="{ connected: hardwareStatus.usb }">
          <span class="icon">💳</span>
          <span>ID Card</span>
          <span class="status">{{ hardwareStatus.usb ? 'Connected' : 'Not connected' }}</span>
        </div>
        <div class="token" :class="{ connected: hardwareStatus.baik }">
          <span class="icon">🔑</span>
          <span>BAIK Token</span>
          <span class="status">{{ hardwareStatus.baik ? 'Connected' : 'Not connected' }}</span>
        </div>
        <div class="token" :class="{ connected: hardwareStatus.ckc }">
          <span class="icon">🔐</span>
          <span>CKC Device</span>
          <span class="status">{{ hardwareStatus.ckc ? 'Connected' : 'Not connected' }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name..."
          class="search-input"
        >
      </div>

      <div class="filter-group">
        <select v-model="selectedType">
          <option :value="null">
            All types
          </option>
          <option v-for="type in certTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="selectedValidity">
          <option :value="null">
            All validity
          </option>
          <option v-for="opt in validityOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <button class="btn-clear" @click="clearFilters">
        Clear Filters
      </button>
    </div>

    <!-- Results count -->
    <div class="results-count">
      {{ filteredCertificates.length }} of {{ certificates.length }} certificates
    </div>

    <!-- Certificate list -->
    <div v-if="isLoading" class="loading">
      Loading certificates...
    </div>

    <div v-else-if="filteredCertificates.length === 0" class="no-results">
      No certificates match your filters.
    </div>

    <div v-else class="cert-list">
      <div v-for="(certs, type) in groupedCertificates" :key="type" class="cert-group">
        <h3 class="group-title">
          {{ certTypes.find(t => t.value === type)?.label || type }}
          <span class="count">({{ certs.length }})</span>
        </h3>

        <div
          v-for="cert in certs"
          :key="cert.serialNumber"
          class="cert-card"
          :class="{
            selected: loadedCert?.serialNumber === cert.serialNumber,
            expired: isExpired(cert),
            expiring: isExpiringSoon(cert),
          }"
          @click="selectCertificate(cert)"
        >
          <div class="cert-header">
            <span class="cert-name">{{ cert.CN }}</span>
            <span class="validity-badge" :class="getValidityStatus(cert)">
              {{ getValidityStatus(cert) }}
            </span>
          </div>

          <div class="cert-body">
            <p class="cert-org">
              {{ cert.O }}
            </p>
            <p class="cert-validity">
              Valid: {{ formatDate(cert.validFrom) }} - {{ formatDate(cert.validTo) }}
            </p>
            <p v-if="cert.TIN" class="cert-tin">
              TIN: {{ cert.TIN }}
            </p>
          </div>

          <div v-if="loadedCert?.serialNumber === cert.serialNumber" class="selected-badge">
            Selected
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cert-selector {
  max-width: 800px;
  margin: 0 auto;
}

.hardware-status {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.hardware-status h3 {
  margin: 0 0 10px;
  font-size: 14px;
}

.token-list {
  display: flex;
  gap: 15px;
}

.token {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.token.connected {
  background: #d4edda;
}

.token .icon {
  font-size: 18px;
}

.token .status {
  color: #666;
  font-size: 11px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-group select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  min-width: 200px;
}

.btn-clear {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.results-count {
  margin-bottom: 15px;
  color: #666;
  font-size: 13px;
}

.cert-group {
  margin-bottom: 25px;
}

.group-title {
  font-size: 16px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.group-title .count {
  color: #999;
  font-weight: normal;
}

.cert-card {
  position: relative;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.cert-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cert-card.selected {
  border-color: #28a745;
  background: #f0fff4;
}

.cert-card.expired {
  opacity: 0.7;
  background: #fff5f5;
}

.cert-card.expiring {
  background: #fffbeb;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cert-name {
  font-weight: 600;
  font-size: 15px;
}

.validity-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  text-transform: uppercase;
}

.validity-badge.valid {
  background: #d4edda;
  color: #155724;
}

.validity-badge.expiring {
  background: #fff3cd;
  color: #856404;
}

.validity-badge.expired {
  background: #f8d7da;
  color: #721c24;
}

.cert-body p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}

.cert-org {
  font-weight: 500;
  color: #333 !important;
}

.selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  background: #28a745;
  color: white;
  border-radius: 4px;
  font-size: 11px;
}

.loading,
.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
```

## Usage

```vue
<script setup lang="ts">
import CertificateSelector from './CertificateSelector.vue'

function handleSelect(cert) {
  console.log('Selected:', cert.CN)
}
</script>

<template>
  <CertificateSelector @select="handleSelect" />
</template>
```

## Next Steps

- [Error Handling Example](/examples/error-handling)
- [Basic Signing Example](/examples/basic-signing)
