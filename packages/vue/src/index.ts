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

// Vue Plugin
export { VueESignature, ESIGNATURE_INJECTION_KEY } from "./plugin";
export { default } from "./plugin";

// Composable
export { useESignature } from "./composable";
export type { UseESignatureReturn, UseESignatureOptions } from "./composable";

// ESignature class (for non-composable usage)
export { ESignature } from "./eimzo";

// Client Factory
export { createEIMZOClient } from "./create-client";
export type { EnhancedEIMZOClient } from "./create-client";

// Components
export { default as ESignatureErrorBoundary } from "./components/ESignatureErrorBoundary.vue";
export {
  ERROR_BOUNDARY_KEY,
  type ErrorBoundarySlotProps,
  type ErrorBoundaryContext,
  type ESignatureErrorBoundaryProps,
} from "./components/error-boundary-types";

// Composables
export { useErrorBoundary } from "./composables/useErrorBoundary";

// Re-export everything from core for convenience
export * from "@eimzo/core";
