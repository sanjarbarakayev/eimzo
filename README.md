# E-IMZO SDK

Official SDK for E-IMZO electronic digital signature system (Uzbekistan).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@eimzo/core](./packages/core) | [![npm](https://img.shields.io/npm/v/@eimzo/core.svg)](https://www.npmjs.com/package/@eimzo/core) | Framework-agnostic core library |
| [@eimzo/vue](./packages/vue) | [![npm](https://img.shields.io/npm/v/@eimzo/vue.svg)](https://www.npmjs.com/package/@eimzo/vue) | Vue 3 plugin and composables |
| @eimzo/nuxt | 🚧 Coming soon | Nuxt module |
| @eimzo/react | 🚧 Coming soon | React hooks |

## Quick Start

### Vue 3

```bash
npm install @eimzo/vue
```

```typescript
import { createApp } from 'vue'
import { VueESignature } from '@eimzo/vue'

const app = createApp(App)
app.use(VueESignature)
app.mount('#app')
```

```vue
<script setup>
import { useESignature } from '@eimzo/vue'

const { install, listKeys, loadKey, signData } = useESignature()

async function sign() {
  await install()
  const keys = await listKeys()
  const { id } = await loadKey(keys[0])
  const signature = await signData('Document content', id)
}
</script>
```

### Core (Framework-agnostic)

```bash
npm install @eimzo/core
```

```typescript
import { EIMZOClient, CAPIWS } from '@eimzo/core'

// Use low-level client directly
```

## Features

- ✅ PFX certificates (software-based)
- ✅ FTJC tokens (hardware smart cards)
- ✅ USB ID cards
- ✅ BAIK tokens
- ✅ CKC devices
- ✅ Mobile signing via QR code
- ✅ PKCS#7 signature creation
- ✅ TypeScript support
- ✅ Internationalization (en, ru, uz)
- ✅ Retry & timeout resilience

## Documentation

- [Getting Started](./docs/guide/quick-start.md)
- [API Reference](./docs/api/index.md)
- [Examples](./examples/)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Development mode
pnpm dev
```

## License

MIT © [Sanjar Barakayev](https://github.com/sanjarbarakayev)
