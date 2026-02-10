/**
 * @eimzo/vue - E-IMZO Digital Signature SDK for Vue 3
 *
 * Vue 3 plugin and composables for E-IMZO integration.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // Install the plugin
 * import { createApp } from 'vue'
 * import { VueESignature } from '@eimzo/vue'
 *
 * const app = createApp(App)
 * app.use(VueESignature)
 * app.mount('#app')
 *
 * // Use the composable in components
 * import { useESignature } from '@eimzo/vue'
 *
 * const { install, listKeys, loadKey, signData } = useESignature()
 * ```
 */

export {
  ERROR_BOUNDARY_KEY,
  type ErrorBoundaryContext,
  type ErrorBoundarySlotProps,
  type ESignatureErrorBoundaryProps,
} from './components/error-boundary-types'
// Components
export { default as ESignatureErrorBoundary } from './components/ESignatureErrorBoundary.vue'

// Composable
export { useESignature } from './composable'
export type { UseESignatureOptions, UseESignatureReturn } from './composable'

// Composables
export { useErrorBoundary } from './composables/useErrorBoundary'

// Client Factory
export { createEIMZOClient } from './create-client'
export type { EnhancedEIMZOClient } from './create-client'

// DevTools
export { emitDevToolsEvent, setupDevtools } from './devtools'
// ESignature class (for non-composable usage)
export { ESignature } from './eimzo'

// Vue Plugin
export { ESIGNATURE_INJECTION_KEY, VueESignature } from './plugin'

export { default } from './plugin'

// Re-export everything from core for convenience
export * from '@eimzo/core'
