# Installation

## Prerequisites

Before using the E-IMZO SDK, ensure you have:

1. **E-IMZO Desktop Application** - Download from [e-imzo.uz](https://e-imzo.uz)
2. **Node.js 18+** - Required for development
3. **A valid E-IMZO certificate** - PFX file or hardware token

## Package Installation

::: code-group

```bash [pnpm]
pnpm add @eimzo/core @eimzo/vue
```

```bash [npm]
npm install @eimzo/core @eimzo/vue
```

```bash [yarn]
yarn add @eimzo/core @eimzo/vue
```

:::

## Framework-Specific Setup

### Vue 3

```typescript
import { VueESignature } from '@eimzo/vue'
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(VueESignature)
app.mount('#app')
```

### Nuxt 3

```typescript
// plugins/eimzo.client.ts
import { VueESignature } from '@eimzo/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueESignature)
})
```

### Vanilla JavaScript

```typescript
import { EIMZOClient } from '@eimzo/core'

const client = new EIMZOClient()
await client.install()
```

## Verify Installation

Run this quick test to verify everything is working:

```typescript
import { detectEIMZO } from '@eimzo/core'

const status = await detectEIMZO()
console.log('E-IMZO Status:', status)
// { installed: true, version: '3.0.0', ... }
```

## Next Steps

- [Quick Start Guide](/getting-started/quick-start)
- [Configuration Options](/getting-started/configuration)
- [Vue Integration](/frameworks/vue)
