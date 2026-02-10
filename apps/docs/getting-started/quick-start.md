# Quick Start

This guide walks you through signing your first document with E-IMZO SDK.

## Basic Workflow

The typical signing workflow is:

1. **Initialize** - Connect to E-IMZO desktop app
2. **List Certificates** - Get available certificates
3. **Load Key** - Select and load a certificate
4. **Sign** - Create digital signature

## Vue 3 Example

```vue
<script setup lang="ts">
import { useESignature } from '@eimzo/vue'
import { onMounted, ref } from 'vue'

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

const signature = ref<string | null>(null)

onMounted(async () => {
  // Step 1: Initialize
  const success = await install()
  if (!success) {
    console.error('E-IMZO not available')
    return
  }

  // Step 2: List certificates
  await listKeys()
})

async function signDocument(documentData: string) {
  // Step 3: Load the first certificate
  const cert = certificates.value[0]
  if (!cert)
    return

  const keyResult = await loadKey(cert)

  // Step 4: Sign
  const result = await signData(documentData)
  signature.value = typeof result === 'string' ? result : result.pkcs7
}
</script>

<template>
  <div class="signing-demo">
    <div v-if="isLoading">
      Loading...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="!isInstalled">
      <p>E-IMZO is not installed.</p>
      <a href="https://e-imzo.uz">Download E-IMZO</a>
    </div>
    <div v-else>
      <h3>Available Certificates</h3>
      <ul>
        <li v-for="cert in certificates" :key="cert.serialNumber">
          {{ cert.CN }} ({{ cert.type }})
        </li>
      </ul>

      <button @click="signDocument('Hello, World!')">
        Sign Document
      </button>

      <div v-if="signature">
        <h3>Signature</h3>
        <code>{{ signature.substring(0, 100) }}...</code>
      </div>
    </div>
  </div>
</template>
```

## Vanilla JavaScript Example

```typescript
import { EIMZOClient } from '@eimzo/core'

async function signDocument(data: string) {
  const client = new EIMZOClient()

  // Initialize
  await client.install()

  // List certificates
  const certificates = await client.listAllUserKeys()
  console.log('Found', certificates.length, 'certificates')

  // Load first certificate
  const cert = certificates[0]
  const keyResult = await client.loadKey(cert)

  // Sign
  const signature = await client.createPkcs7(keyResult.id, data)
  console.log('Signature:', signature)

  return signature
}
```

## Certificate Types

E-IMZO supports multiple certificate types:

| Type | Description | Usage |
|------|-------------|-------|
| `pfx` | Software certificate (file) | Common for general use |
| `id-card` | National ID card | Requires card reader |
| `baik` | BAIK token | Hardware token |
| `ckc` | CKC device | Hardware device |

## Next Steps

- [Configuration Options](/getting-started/configuration)
- [Working with Certificates](/guide/certificates)
- [Error Handling](/guide/error-handling)
