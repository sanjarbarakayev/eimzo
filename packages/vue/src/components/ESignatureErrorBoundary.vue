<script lang="ts">
/**
 * Error Boundary Component for E-Signature Operations
 *
 * Catches errors from child components and provides recovery options.
 *
 * @example
 * ```vue
 * <ESignatureErrorBoundary @error="logError" :max-retries="3">
 *   <CertificateSelector />
 *   <template #error="{ error, retry, retryCount }">
 *     <div>{{ error.message }}</div>
 *     <button @click="retry">Retry ({{ retryCount }}/3)</button>
 *   </template>
 * </ESignatureErrorBoundary>
 * ```
 */

import type { PropType } from 'vue'
import { EIMZOError } from '@eimzo/core'
import {
  defineComponent,
  onErrorCaptured,

  provide,
  ref,
  watch,
} from 'vue'
import { ERROR_BOUNDARY_KEY } from './error-boundary-types'

// Re-export types for backwards compatibility
export type {
  ErrorBoundaryContext,
  ErrorBoundarySlotProps,
  ESignatureErrorBoundaryProps as Props,
} from './error-boundary-types'
export { ERROR_BOUNDARY_KEY } from './error-boundary-types'

// ============================================================================
// Component
// ============================================================================

export default defineComponent({
  name: 'ESignatureErrorBoundary',

  props: {
    maxRetries: {
      type: Number as PropType<number>,
      default: 3,
    },
    autoResetMs: {
      type: Number as PropType<number>,
      default: 0,
    },
    shouldCatch: {
      type: Function as PropType<(error: unknown) => boolean>,
      default: () => true,
    },
  },

  emits: {
    error: (error: EIMZOError) => true,
    retry: (retryCount: number) => true,
    reset: () => true,
  },

  setup(props, { emit, expose }) {
    const currentError = ref<EIMZOError | null>(null)
    const retryCount = ref(0)
    const slotKey = ref(0)

    function retry(): void {
      if (retryCount.value >= props.maxRetries) {
        return
      }

      retryCount.value++
      currentError.value = null
      slotKey.value++

      emit('retry', retryCount.value)
    }

    function reset(): void {
      currentError.value = null
      retryCount.value = 0
      slotKey.value++

      emit('reset')
    }

    // Error handling
    onErrorCaptured((error: unknown, _instance, info) => {
      // Check if error should be caught
      if (!props.shouldCatch(error)) {
        return true // Let error propagate
      }

      // Convert to EIMZOError
      const eimzoError = EIMZOError.isEIMZOError(error)
        ? error
        : EIMZOError.from(error, {
            operation: 'component',
            metadata: { componentInfo: info },
          })

      currentError.value = eimzoError
      emit('error', eimzoError)

      // Prevent error from propagating
      return false
    })

    // Auto-reset
    let autoResetTimer: ReturnType<typeof setTimeout> | null = null

    watch(
      () => currentError.value,
      (error) => {
        // Clear any existing timer
        if (autoResetTimer) {
          clearTimeout(autoResetTimer)
          autoResetTimer = null
        }

        // Set up auto-reset if enabled and there's an error
        if (error && props.autoResetMs > 0) {
          autoResetTimer = setTimeout(() => {
            reset()
          }, props.autoResetMs)
        }
      },
    )

    // Provide context
    provide(ERROR_BOUNDARY_KEY, {
      hasError: currentError.value !== null,
      triggerRetry: retry,
      triggerReset: reset,
    })

    // Expose for template refs
    expose({
      error: currentError,
      retryCount,
      retry,
      reset,
    })

    return {
      currentError,
      retryCount,
      slotKey,
      retry,
      reset,
    }
  },
})
</script>

<template>
  <template v-if="currentError">
    <slot
      name="error"
      :error="currentError"
      :retry="retry"
      :reset="reset"
      :retry-count="retryCount"
    >
      <!-- Default error UI -->
      <div class="esignature-error-boundary">
        <div class="esignature-error-boundary__content">
          <h3 class="esignature-error-boundary__title">
            E-Signature Error
          </h3>
          <p class="esignature-error-boundary__message">
            {{ currentError.message }}
          </p>
          <p class="esignature-error-boundary__code">
            Code: {{ currentError.code }}
          </p>
          <div class="esignature-error-boundary__actions">
            <button
              v-if="retryCount < maxRetries"
              class="esignature-error-boundary__retry-btn"
              @click="retry"
            >
              Retry ({{ retryCount }}/{{ maxRetries }})
            </button>
            <button
              class="esignature-error-boundary__reset-btn"
              @click="reset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </slot>
  </template>
  <template v-else>
    <slot :key="slotKey" />
  </template>
</template>
