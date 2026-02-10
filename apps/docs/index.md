---
layout: home

hero:
  name: E-IMZO SDK
  text: Electronic Digital Signatures for JavaScript
  tagline: TypeScript SDK for Uzbekistan's E-IMZO digital signature system
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/sanjarbarakayev/eimzo

features:
  - icon:
      src: /icons/typescript.svg
    title: Type-Safe
    details: Full TypeScript support with branded types, strict null checks, and comprehensive type definitions.
  - icon:
      src: /icons/vue.svg
    title: Vue Integration
    details: First-class Vue 3 support with composables, plugins, and DevTools integration.
  - icon:
      src: /icons/shield.svg
    title: Resilient
    details: Built-in retry logic, connection recovery, and comprehensive error handling.
  - icon:
      src: /icons/globe.svg
    title: Multi-language
    details: Full i18n support with Uzbek, Russian, and English translations.
  - icon:
      src: /icons/puzzle.svg
    title: Middleware System
    details: Extensible middleware architecture for logging, caching, and custom transformations.
  - icon:
      src: /icons/devices.svg
    title: All Device Types
    details: Support for PFX files, ID cards, BAIK tokens, and CKC devices.
---

## Quick Example

```vue
<script setup lang="ts">
import { useESignature } from '@eimzo/vue'
import { onMounted } from 'vue'

const { install, listKeys, loadKey, signData, certificates } = useESignature()

onMounted(async () => {
  await install()
  await listKeys()
})

async function sign(cert, data) {
  await loadKey(cert)
  return await signData(data)
}
</script>
```
