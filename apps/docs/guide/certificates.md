# Certificates

## Certificate Types

E-IMZO supports multiple certificate types:

### PFX (Software) Certificates

Personal certificates stored as `.pfx` files on disk.

```typescript
const pfxCerts = certificates.filter(c => c.type === 'pfx')
```

### ID Card Certificates

Certificates on the national ID card. Requires card reader.

```typescript
const idCardCerts = certificates.filter(c => c.type === 'id-card')

// Check if ID card is connected
const isConnected = await checkUSBToken()
```

### BAIK Tokens

Hardware security tokens from BAIK.

```typescript
// Check if BAIK token is connected
const isConnected = await checkBAIKToken()

// Sign with BAIK token
const signature = await signWithBAIK(data)
```

### CKC Devices

Hardware cryptographic devices.

```typescript
// Check if CKC device is connected
const isConnected = await checkCKCDevice()

// Sign with CKC device
const signature = await signWithCKC(data)
```

## Certificate Properties

Each certificate has these properties:

```typescript
interface Certificate {
  // Unique identifier
  serialNumber: string

  // Certificate type
  type: 'pfx' | 'id-card' | 'baik' | 'ckc'

  // Subject fields
  CN: string // Common Name
  O: string // Organization
  T?: string // Title
  OU?: string // Organizational Unit

  // Validity
  validFrom: Date
  validTo: Date

  // Tax Identification Number
  TIN?: string

  // Personal Identification Number
  PINFL?: string
}
```

## Filtering Certificates

### By Type

```typescript
const { certificates } = useESignature()

const softwareCerts = computed(() =>
  certificates.value.filter(c => c.type === 'pfx')
)

const hardwareCerts = computed(() =>
  certificates.value.filter(c =>
    ['id-card', 'baik', 'ckc'].includes(c.type)
  )
)
```

### By Validity

```typescript
const validCerts = computed(() =>
  certificates.value.filter((c) => {
    const now = new Date()
    return c.validFrom <= now && now <= c.validTo
  })
)

const expiredCerts = computed(() =>
  certificates.value.filter(c => new Date() > c.validTo)
)
```

### By Organization

```typescript
const orgCerts = computed(() =>
  certificates.value.filter(c =>
    c.O?.toLowerCase().includes('company name')
  )
)
```

## Loading Certificates

```typescript
const { loadKey, loadedCert, loadedKeyId } = useESignature()

async function selectCertificate(cert: Certificate) {
  try {
    const result = await loadKey(cert)
    console.log('Key loaded:', result.id)

    // loadedCert and loadedKeyId are now updated
    console.log('Loaded cert:', loadedCert.value?.CN)
  }
  catch (error) {
    if (error.message.includes('PIN')) {
      // User cancelled PIN entry
    }
  }
}
```

## Certificate UI Component

```vue
<script setup lang="ts">
import type { Certificate } from '@eimzo/vue'
import { useESignature } from '@eimzo/vue'
import { computed } from 'vue'

const emit = defineEmits<{
  select: [cert: Certificate]
}>()

const { certificates, loadKey, loadedCert, isLoading } = useESignature()

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function isExpired(cert: Certificate) {
  return new Date() > cert.validTo
}

async function selectCert(cert: Certificate) {
  await loadKey(cert)
  emit('select', cert)
}
</script>

<template>
  <div class="certificate-list">
    <div
      v-for="cert in certificates"
      :key="cert.serialNumber"
      class="certificate-card"
      :class="{
        selected: loadedCert?.serialNumber === cert.serialNumber,
        expired: isExpired(cert),
      }"
      @click="selectCert(cert)"
    >
      <div class="cert-name">
        {{ cert.CN }}
      </div>
      <div class="cert-org">
        {{ cert.O }}
      </div>
      <div class="cert-type">
        {{ cert.type }}
      </div>
      <div class="cert-validity">
        Valid: {{ formatDate(cert.validFrom) }} - {{ formatDate(cert.validTo) }}
      </div>
      <span v-if="isExpired(cert)" class="badge expired">Expired</span>
    </div>
    <div v-if="isLoading" class="loading">
      Loading...
    </div>
  </div>
</template>
```

## Next Steps

- [Signing Documents](/guide/signing)
- [Error Handling](/guide/error-handling)
