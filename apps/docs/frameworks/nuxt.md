# Nuxt Integration

## Installation

```bash
pnpm add @eimzo/core @eimzo/vue
```

## Plugin Setup

Create a client-side plugin:

```typescript
// plugins/eimzo.client.ts
import { VueESignature } from '@eimzo/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueESignature, {
    apiKeys: [
      {
        domain: useRuntimeConfig().public.eimzoDomain,
        key: useRuntimeConfig().public.eimzoApiKey,
      }
    ]
  })
})
```

## Runtime Config

Add E-IMZO configuration to `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      eimzoDomain: process.env.EIMZO_DOMAIN || '',
      eimzoApiKey: process.env.EIMZO_API_KEY || '',
    }
  }
})
```

## Environment Variables

```bash
# .env
EIMZO_DOMAIN=your-domain.com
EIMZO_API_KEY=your-api-key
```

## Client-Only Component

E-IMZO requires browser environment. Use `<ClientOnly>` wrapper:

```vue
<!-- pages/sign.vue -->
<template>
  <ClientOnly>
    <ESignatureForm />
    <template #fallback>
      <p>Loading signature form...</p>
    </template>
  </ClientOnly>
</template>
```

Or use `.client.vue` suffix:

```vue
<!-- components/ESignatureForm.client.vue -->
<script setup lang="ts">
import { useESignature } from '@eimzo/vue'

const { install, listKeys, certificates } = useESignature()

onMounted(async () => {
  await install()
  await listKeys()
})
</script>

<template>
  <div>
    <div v-for="cert in certificates" :key="cert.serialNumber">
      {{ cert.CN }}
    </div>
  </div>
</template>
```

## Composable Wrapper

Create a Nuxt-friendly composable:

```typescript
// composables/useESignature.ts
import { useESignature as useESignatureVue } from '@eimzo/vue'

export function useESignature() {
  // Only run on client
  if (import.meta.server) {
    return {
      isInstalled: ref(false),
      isLoading: ref(false),
      error: ref(null),
      certificates: ref([]),
      // ... stub methods
      install: async () => false,
      listKeys: async () => [],
    }
  }

  return useESignatureVue()
}
```

## i18n Integration

Sync E-IMZO locale with Nuxt i18n:

```typescript
// plugins/eimzo-i18n.client.ts
import { setLocale } from '@eimzo/core'

export default defineNuxtPlugin(() => {
  const { locale } = useI18n()

  // Watch for locale changes
  watch(locale, (newLocale) => {
    const supported = ['uz', 'ru', 'en']
    if (supported.includes(newLocale)) {
      setLocale(newLocale as 'uz' | 'ru' | 'en')
    }
  }, { immediate: true })
})
```

## Complete Page Example

```vue
<!-- pages/documents/sign.vue -->
<script setup lang="ts">
import type { Certificate } from '@eimzo/core'
import { ref } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const { install, listKeys, loadKey, signData, certificates, isLoading, error } = useESignature()

const selectedCert = ref<Certificate | null>(null)
const document = ref('')
const signature = ref<string | null>(null)

const initialized = ref(false)

onMounted(async () => {
  const success = await install()
  if (success) {
    await listKeys()
    initialized.value = true
  }
})

async function handleSign() {
  if (!selectedCert.value)
    return

  await loadKey(selectedCert.value)
  const result = await signData(document.value)
  signature.value = typeof result === 'string' ? result : result.pkcs7

  // Send to API
  await $fetch('/api/documents/sign', {
    method: 'POST',
    body: {
      document: document.value,
      signature: signature.value,
    }
  })

  navigateTo('/documents')
}
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">
      Sign Document
    </h1>

    <ClientOnly>
      <div v-if="!initialized && isLoading">
        <p>Connecting to E-IMZO...</p>
      </div>

      <div v-else-if="error" class="bg-red-100 p-4 rounded mb-4">
        {{ error }}
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSign">
        <div>
          <label class="block font-medium mb-1">Certificate</label>
          <select v-model="selectedCert" class="w-full border rounded p-2">
            <option :value="null">
              Select...
            </option>
            <option
              v-for="cert in certificates"
              :key="cert.serialNumber"
              :value="cert"
            >
              {{ cert.CN }}
            </option>
          </select>
        </div>

        <div>
          <label class="block font-medium mb-1">Document</label>
          <textarea
            v-model="document"
            rows="5"
            class="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading || !selectedCert"
          class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {{ isLoading ? 'Signing...' : 'Sign' }}
        </button>
      </form>

      <template #fallback>
        <p>Loading...</p>
      </template>
    </ClientOnly>
  </div>
</template>
```

## API Route for Verification

```typescript
// server/api/documents/sign.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { document, signature } = body

  // Verify signature server-side
  // (requires E-IMZO server-side verification API)

  // Store document and signature
  const result = await prisma.document.create({
    data: {
      content: document,
      signature,
      signedAt: new Date(),
    }
  })

  return { success: true, id: result.id }
})
```

## Next Steps

- [Vanilla JS](/frameworks/vanilla)
- [Examples](/examples/basic-signing)
