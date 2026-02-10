/**
 * Project Templates
 */

export interface TemplateFile {
  filename: string
  content: string
}

export function getVueTemplate(): TemplateFile[] {
  return [
    {
      filename: 'src/components/ESignatureDemo.vue',
      content: `<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useESignature, type Certificate } from '@eimzo/vue'

const {
  isInstalled,
  isLoading,
  error,
  certificates,
  install,
  listKeys,
  loadKey,
  signData,
  clearError,
} = useESignature()

const selectedCert = ref<Certificate | null>(null)
const documentText = ref('')
const signature = ref<string | null>(null)

onMounted(async () => {
  const success = await install()
  if (success) {
    await listKeys()
  }
})

const handleSign = async () => {
  if (!selectedCert.value || !documentText.value) return

  await loadKey(selectedCert.value)
  const result = await signData(documentText.value)
  signature.value = typeof result === 'string' ? result : result.pkcs7
}
</script>

<template>
  <div class="esignature-demo">
    <h2>E-IMZO Signing Demo</h2>

    <div v-if="error" class="error">
      {{ error }}
      <button @click="clearError">Dismiss</button>
    </div>

    <div v-if="!isInstalled && !isLoading">
      <p>E-IMZO is not available.</p>
      <a href="https://e-imzo.uz" target="_blank">Download E-IMZO</a>
    </div>

    <div v-else>
      <div class="form-group">
        <label>Certificate</label>
        <select v-model="selectedCert" :disabled="isLoading">
          <option :value="null">Select...</option>
          <option
            v-for="cert in certificates"
            :key="cert.serialNumber"
            :value="cert"
          >
            {{ cert.CN }} ({{ cert.type }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Document</label>
        <textarea v-model="documentText" rows="5" :disabled="isLoading" />
      </div>

      <button @click="handleSign" :disabled="isLoading || !selectedCert">
        {{ isLoading ? 'Signing...' : 'Sign' }}
      </button>

      <div v-if="signature" class="result">
        <label>Signature (Base64)</label>
        <textarea :value="signature" readonly rows="5" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.esignature-demo {
  max-width: 500px;
  padding: 20px;
}
.error {
  background: #fee;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background: #ccc;
}
.result {
  margin-top: 20px;
}
</style>
`,
    },
  ]
}

export function getNuxtTemplate(): TemplateFile[] {
  return [
    {
      filename: 'plugins/eimzo.client.ts',
      content: `import { VueESignature } from '@eimzo/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueESignature, {
    // Add API keys if needed
    // apiKeys: [{ domain: 'your-domain.com', key: 'YOUR_API_KEY' }]
  })
})
`,
    },
    {
      filename: 'components/ESignatureDemo.vue',
      content: `<script setup lang="ts">
import { ref } from 'vue'
import { useESignature, type Certificate } from '@eimzo/vue'

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

const selectedCert = ref<Certificate | null>(null)
const documentText = ref('')
const signature = ref<string | null>(null)

onMounted(async () => {
  const success = await install()
  if (success) {
    await listKeys()
  }
})

const handleSign = async () => {
  if (!selectedCert.value) return
  await loadKey(selectedCert.value)
  const result = await signData(documentText.value)
  signature.value = typeof result === 'string' ? result : result.pkcs7
}
</script>

<template>
  <ClientOnly>
    <div class="esignature-demo">
      <h2>E-IMZO Signing</h2>

      <div v-if="!isInstalled && !isLoading">
        E-IMZO not available. <a href="https://e-imzo.uz">Download</a>
      </div>

      <div v-else>
        <select v-model="selectedCert">
          <option :value="null">Select certificate...</option>
          <option v-for="c in certificates" :key="c.serialNumber" :value="c">
            {{ c.CN }}
          </option>
        </select>

        <textarea v-model="documentText" placeholder="Enter text to sign" />

        <button @click="handleSign" :disabled="isLoading">Sign</button>

        <div v-if="signature">
          <textarea :value="signature" readonly />
        </div>
      </div>
    </div>

    <template #fallback>
      <p>Loading...</p>
    </template>
  </ClientOnly>
</template>
`,
    },
  ]
}

export function getVanillaTemplate(): TemplateFile[] {
  return [
    {
      filename: 'src/eimzo-example.ts',
      content: `import { EIMZOClient, detectEIMZO, getEIMZODownloadUrl } from '@eimzo/core'

async function main() {
  // Check if E-IMZO is available
  const status = await detectEIMZO()

  if (!status.installed) {
    console.log('E-IMZO not installed. Download:', getEIMZODownloadUrl())
    return
  }

  // Create client and connect
  const client = new EIMZOClient()
  await client.install()

  // List certificates
  const certificates = await client.listAllUserKeys()
  console.log('Found certificates:', certificates.length)

  if (certificates.length === 0) {
    console.log('No certificates found')
    return
  }

  // Load first certificate
  const cert = certificates[0]
  console.log('Loading:', cert.CN)

  const keyResult = await client.loadKey(cert)
  console.log('Key loaded:', keyResult.id)

  // Sign data
  const data = 'Hello, World!'
  const signature = await client.createPkcs7(keyResult.id, data)
  console.log('Signature:', signature)
}

main().catch(console.error)
`,
    },
  ]
}
