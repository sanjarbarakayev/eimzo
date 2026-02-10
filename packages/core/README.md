# @eimzo/core

[![npm version](https://img.shields.io/npm/v/@eimzo/core)](https://www.npmjs.com/package/@eimzo/core)
[![npm downloads](https://img.shields.io/npm/dm/@eimzo/core)](https://www.npmjs.com/package/@eimzo/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@eimzo/core)](https://bundlephobia.com/package/@eimzo/core)
[![license](https://img.shields.io/npm/l/@eimzo/core)](https://github.com/sanjarbarakayev/eimzo/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Framework-agnostic core library for E-IMZO electronic digital signature system.

## Installation

```bash
npm install @eimzo/core
```

## Usage

```typescript
import { CAPIWS, detectEIMZO, EIMZOClient } from '@eimzo/core'

// Check if E-IMZO is installed
const status = await detectEIMZO()
if (status.isRunning) {
  console.log('E-IMZO is running on port', status.port)
}
```

### Crypto Utilities

```typescript
import { crc32, gosthash } from '@eimzo/core/crypto'

const checksum = crc32('data')
const hash = gosthash('data')
```

### Mobile QR Code

```typescript
import { EIMZOMobile } from '@eimzo/core/mobile'

const result = EIMZOMobile.generateQRCodeData('siteId', 'docNumber', 'content')
// Use result.code with your QR library
```

### Internationalization

```typescript
import { getErrorMessage, setLocale } from '@eimzo/core/i18n'

setLocale('uz')
console.log(getErrorMessage('WRONG_PASSWORD'))
```

## API

See the [full documentation](https://github.com/sanjarbarakayev/eimzo#readme).

## License

MIT
