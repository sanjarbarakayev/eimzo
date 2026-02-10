# Signing Documents

## Basic Signing

The simplest way to sign data:

```typescript
const { loadKey, signData, certificates } = useESignature()

async function sign(data: string) {
  // Load certificate first
  const cert = certificates.value[0]
  await loadKey(cert)

  // Sign the data
  const signature = await signData(data)
  return signature
}
```

## PKCS#7 Signatures

E-IMZO creates PKCS#7 (CMS) signatures:

```typescript
const result = await signData(documentData)

// Result can be string or SignPkcs7Result
if (typeof result === 'string') {
  console.log('Signature (base64):', result)
}
else {
  console.log('Signature:', result.pkcs7)
  console.log('Signer:', result.signer)
}
```

## Signing with Different Key Types

### Software Certificate (PFX)

```typescript
const cert = certificates.value.find(c => c.type === 'pfx')
await loadKey(cert)
const signature = await signData(data)
```

### USB Token / ID Card

```typescript
// Check if token is connected
const isPlugged = await checkUSBToken()
if (!isPlugged) {
  alert('Please connect your ID card')
  return
}

// Sign directly with USB token
const signature = await signWithUSB(data)
```

### BAIK Token

```typescript
const isPlugged = await checkBAIKToken()
if (isPlugged) {
  const signature = await signWithBAIK(data)
}
```

### CKC Device

```typescript
const isPlugged = await checkCKCDevice()
if (isPlugged) {
  const signature = await signWithCKC(data)
}
```

## Signing Multiple Documents

```typescript
async function signMultiple(documents: string[]) {
  const cert = certificates.value[0]
  await loadKey(cert)

  const signatures = await Promise.all(
    documents.map(doc => signData(doc))
  )

  return signatures
}
```

## Signing with Progress

```typescript
async function signWithProgress(documents: string[], onProgress: (current: number, total: number) => void) {
  const cert = certificates.value[0]
  await loadKey(cert)

  const signatures: string[] = []

  for (let i = 0; i < documents.length; i++) {
    const signature = await signData(documents[i])
    signatures.push(typeof signature === 'string' ? signature : signature.pkcs7)
    onProgress(i + 1, documents.length)
  }

  return signatures
}
```

## Batch Signing with Error Handling

```typescript
import { executeBatch } from '@eimzo/core'

async function batchSign(documents: { id: string, data: string }[]) {
  const cert = certificates.value[0]
  const keyResult = await loadKey(cert)

  const results = await executeBatch(
    documents,
    async (doc) => {
      const sig = await signData(doc.data)
      return { id: doc.id, signature: sig }
    },
    {
      continueOnError: true,
      maxConcurrent: 1,
    }
  )

  console.log('Successful:', results.succeeded.length)
  console.log('Failed:', results.failed.length)

  return results
}
```

## Complete Signing Form

```vue
<script setup lang="ts">
import { useESignature } from '@eimzo/vue'
import { ref } from 'vue'

const { certificates, loadKey, signData, isLoading, error } = useESignature()

const documentText = ref('')
const signature = ref<string | null>(null)
const selectedCert = ref<Certificate | null>(null)

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
  <form @submit.prevent="handleSign">
    <div class="form-group">
      <label>Select Certificate</label>
      <select v-model="selectedCert">
        <option :value="null">
          Select...
        </option>
        <option v-for="cert in certificates" :key="cert.serialNumber" :value="cert">
          {{ cert.CN }} ({{ cert.type }})
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Document</label>
      <textarea v-model="documentText" rows="5" />
    </div>

    <button type="submit" :disabled="isLoading || !selectedCert || !documentText">
      {{ isLoading ? 'Signing...' : 'Sign Document' }}
    </button>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="signature" class="signature-result">
      <label>Signature (Base64)</label>
      <textarea readonly :value="signature" rows="5" />
    </div>
  </form>
</template>
```

## Next Steps

- [Error Handling](/guide/error-handling)
- [Internationalization](/guide/i18n)
