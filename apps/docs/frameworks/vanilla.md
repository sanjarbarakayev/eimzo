# Vanilla JavaScript

## Installation

```bash
pnpm add @eimzo/core
```

## Basic Usage

```typescript
import { EIMZOClient } from '@eimzo/core'

const client = new EIMZOClient()

// Initialize
await client.install()

// List certificates
const certificates = await client.listAllUserKeys()
console.log('Found', certificates.length, 'certificates')

// Load a certificate
const cert = certificates[0]
const keyResult = await client.loadKey(cert)

// Sign data
const signature = await client.createPkcs7(keyResult.id, 'Hello, World!')
console.log('Signature:', signature)
```

## Using the Client Factory

For more control, use `createEIMZOClient`:

```typescript
import {
  createEIMZOClient,
  EIMZOEventEmitter,
  loggingMiddleware,
  performanceMiddleware,
} from '@eimzo/core'

// Create event emitter for lifecycle events
const emitter = new EIMZOEventEmitter()

emitter.on('connection:established', () => {
  console.log('Connected to E-IMZO')
})

emitter.on('operation:error', (error) => {
  console.error('Operation failed:', error)
})

// Create client with configuration
const client = createEIMZOClient({
  timeout: 30000,
  enableRetry: true,
  maxRetries: 3,
  middleware: [
    loggingMiddleware,
    performanceMiddleware(5000),
  ],
  eventEmitter: emitter,
})
```

## Event System

```typescript
import { EIMZOEventEmitter } from '@eimzo/core'

const emitter = new EIMZOEventEmitter()

// Connection events
emitter.on('connection:established', () => {})
emitter.on('connection:lost', () => {})
emitter.on('connection:reconnecting', (attempt) => {})

// Operation events
emitter.on('operation:start', (name, params) => {})
emitter.on('operation:success', (name, result) => {})
emitter.on('operation:error', (name, error) => {})

// Certificate events
emitter.on('certificate:loaded', (cert) => {})
emitter.on('signature:created', (signature) => {})
```

## Error Handling

```typescript
import { classifyError, EIMZOError } from '@eimzo/core'

try {
  await client.createPkcs7(keyId, data)
}
catch (error) {
  if (error instanceof EIMZOError) {
    const errorType = classifyError(error)

    switch (errorType) {
      case 'connection':
        showMessage('E-IMZO app is not running')
        break
      case 'timeout':
        showMessage('Operation timed out')
        break
      case 'certificate':
        showMessage(`Certificate error: ${error.message}`)
        break
      case 'user_cancelled':
        // User cancelled PIN entry
        break
      default:
        showMessage(`Error: ${error.message}`)
    }
  }
}
```

## Detection and Status

```typescript
import { detectEIMZO, getEIMZODownloadUrl, isEIMZOAvailable } from '@eimzo/core'

// Check if E-IMZO is available
const available = await isEIMZOAvailable()

if (!available) {
  const downloadUrl = getEIMZODownloadUrl()
  showMessage(`Please download E-IMZO: ${downloadUrl}`)
}

// Get detailed status
const status = await detectEIMZO()
console.log('Status:', status)
// { installed: true, version: '3.0.0', ... }
```

## Resilience Utilities

```typescript
import {
  RetryExhaustedError,
  TimeoutError,
  withResilience,
  withRetry,
  withTimeout,
} from '@eimzo/core'

// Add timeout to any async operation
const result = await withTimeout(
  () => longRunningOperation(),
  5000 // 5 seconds
)

// Add retry logic
const result = await withRetry(
  () => flakyOperation(),
  {
    maxRetries: 3,
    delay: 1000,
    backoff: 'exponential',
  }
)

// Combined timeout + retry
const result = await withResilience(
  () => unreliableOperation(),
  {
    timeout: 5000,
    maxRetries: 3,
  }
)
```

## i18n

```typescript
import { detectAndSetBrowserLocale, getErrorMessage, setLocale } from '@eimzo/core'

// Auto-detect from browser
detectAndSetBrowserLocale()

// Or set manually
setLocale('uz')

// Get localized message
const message = getErrorMessage('CONNECTION_ERROR')
// "E-IMZO ilovasi ishlamayapti"
```

## Complete HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>E-IMZO Signing Demo</title>
</head>
<body>
  <h1>E-IMZO Document Signing</h1>

  <div id="status"></div>

  <div id="not-installed" style="display: none;">
    <p>E-IMZO is not installed.</p>
    <a id="download-link" href="#">Download E-IMZO</a>
  </div>

  <div id="signing-form" style="display: none;">
    <div>
      <label for="certificate">Certificate:</label>
      <select id="certificate"></select>
    </div>

    <div>
      <label for="document">Document:</label>
      <textarea id="document" rows="5"></textarea>
    </div>

    <button id="sign-btn">Sign</button>

    <div id="signature-result" style="display: none;">
      <label>Signature:</label>
      <textarea id="signature" readonly rows="5"></textarea>
    </div>
  </div>

  <script type="module">
    import {
      EIMZOClient,
      isEIMZOAvailable,
      getEIMZODownloadUrl,
      detectAndSetBrowserLocale,
    } from '@eimzo/core'

    detectAndSetBrowserLocale()

    const status = document.getElementById('status')
    const notInstalled = document.getElementById('not-installed')
    const signingForm = document.getElementById('signing-form')
    const certSelect = document.getElementById('certificate')
    const documentInput = document.getElementById('document')
    const signBtn = document.getElementById('sign-btn')
    const signatureResult = document.getElementById('signature-result')
    const signatureOutput = document.getElementById('signature')

    let client
    let certificates = []
    let loadedKeyId = null

    async function init() {
      status.textContent = 'Checking E-IMZO...'

      const available = await isEIMZOAvailable()

      if (!available) {
        status.textContent = 'E-IMZO not available'
        notInstalled.style.display = 'block'
        document.getElementById('download-link').href = getEIMZODownloadUrl()
        return
      }

      client = new EIMZOClient()
      await client.install()

      certificates = await client.listAllUserKeys()

      // Populate certificate dropdown
      certificates.forEach((cert, i) => {
        const option = document.createElement('option')
        option.value = i
        option.textContent = `${cert.CN} (${cert.type})`
        certSelect.appendChild(option)
      })

      status.textContent = 'Connected'
      signingForm.style.display = 'block'
    }

    signBtn.addEventListener('click', async () => {
      const certIndex = parseInt(certSelect.value)
      const cert = certificates[certIndex]
      const data = documentInput.value

      if (!cert || !data) {
        alert('Please select certificate and enter document')
        return
      }

      signBtn.disabled = true
      signBtn.textContent = 'Signing...'

      try {
        const keyResult = await client.loadKey(cert)
        const signature = await client.createPkcs7(keyResult.id, data)

        signatureOutput.value = typeof signature === 'string'
          ? signature
          : signature.pkcs7
        signatureResult.style.display = 'block'
      } catch (error) {
        alert('Signing failed: ' + error.message)
      } finally {
        signBtn.disabled = false
        signBtn.textContent = 'Sign'
      }
    })

    init()
  </script>
</body>
</html>
```

## Next Steps

- [Examples](/examples/basic-signing)
- [Error Handling Guide](/guide/error-handling)
