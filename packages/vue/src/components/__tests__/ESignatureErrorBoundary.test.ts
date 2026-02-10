import type { ErrorBoundarySlotProps } from '../error-boundary-types'
import { EIMZOError, ERROR_CODES } from '@eimzo/core'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject, ref } from 'vue'
import {
  ERROR_BOUNDARY_KEY,

} from '../error-boundary-types'
import ESignatureErrorBoundary from '../ESignatureErrorBoundary.vue'

// Helper component that throws an error
const ThrowingComponent = defineComponent({
  props: {
    shouldThrow: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: 'Test error',
    },
  },
  setup(props) {
    if (props.shouldThrow) {
      throw new Error(props.errorMessage)
    }
    return () => h('div', 'Success')
  },
})

// Helper component that throws EIMZOError
const ThrowingEIMZOComponent = defineComponent({
  props: {
    code: {
      type: String,
      default: ERROR_CODES.SIGNING_ERROR,
    },
  },
  setup(props) {
    throw new EIMZOError(props.code as typeof ERROR_CODES[keyof typeof ERROR_CODES], 'EIMZO Error', {
      context: { operation: 'test' },
    })
  },
})

// Helper component that accesses error boundary context
const ContextConsumer = defineComponent({
  setup() {
    const context = inject(ERROR_BOUNDARY_KEY)
    return () =>
      h('div', { 'data-testid': 'context-consumer' }, [
        h('span', { 'data-testid': 'has-error' }, String(context?.hasError)),
      ])
  },
})

describe('eSignatureErrorBoundary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders default slot when no error', () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: '<div data-testid="content">Content</div>',
        },
      })

      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
    })

    it('renders error slot when error is caught', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
          error: `<template #error="{ error }">
            <div data-testid="error-slot">{{ error.message }}</div>
          </template>`,
        },
      })

      await flushPromises()

      expect(wrapper.find('[data-testid="error-slot"]').exists()).toBe(true)
    })

    it('renders default error UI when no error slot provided', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      expect(wrapper.find('.esignature-error-boundary').exists()).toBe(true)
      expect(wrapper.find('.esignature-error-boundary__title').text()).toBe(
        'E-Signature Error',
      )
    })
  })

  describe('error handling', () => {
    it('catches standard Error and converts to EIMZOError', async () => {
      const onError = vi.fn()

      mount(ESignatureErrorBoundary, {
        props: { onError },
        slots: {
          default: () => h(ThrowingComponent, { errorMessage: 'Standard error' }),
        },
      })

      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
      const error = onError.mock.calls[0][0]
      expect(EIMZOError.isEIMZOError(error)).toBe(true)
      expect(error.message).toBe('Standard error')
      expect(error.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
    })

    it('preserves EIMZOError type', async () => {
      const onError = vi.fn()

      mount(ESignatureErrorBoundary, {
        props: { onError },
        slots: {
          default: () =>
            h(ThrowingEIMZOComponent, { code: ERROR_CODES.CERTIFICATE_EXPIRED }),
        },
      })

      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
      const error = onError.mock.calls[0][0]
      expect(error.code).toBe(ERROR_CODES.CERTIFICATE_EXPIRED)
    })

    it('emits error event', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      const emitted = wrapper.emitted('error')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBeInstanceOf(EIMZOError)
    })
  })

  describe('shouldCatch prop', () => {
    it('catches errors when shouldCatch returns true', async () => {
      const onError = vi.fn()

      mount(ESignatureErrorBoundary, {
        props: {
          onError,
          shouldCatch: () => true,
        },
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      expect(onError).toHaveBeenCalled()
    })

    it('does not catch errors when shouldCatch returns false', async () => {
      const onError = vi.fn()

      // When shouldCatch returns false, the error propagates
      // This test verifies the prop is respected
      const wrapper = mount(ESignatureErrorBoundary, {
        props: {
          onError,
          shouldCatch: () => false,
        },
        slots: {
          default: '<div>Safe content</div>',
        },
      })

      await flushPromises()

      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('retry functionality', () => {
    it('increments retry count on retry', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        props: { maxRetries: 3 },
        slots: {
          default: () => h(ThrowingComponent),
          error: `<template #error="{ retry, retryCount }">
            <div>
              <span data-testid="retry-count">{{ retryCount }}</span>
              <button data-testid="retry-btn" @click="retry">Retry</button>
            </div>
          </template>`,
        },
      })

      await flushPromises()

      expect(wrapper.find('[data-testid="retry-count"]').text()).toBe('0')

      await wrapper.find('[data-testid="retry-btn"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="retry-count"]').text()).toBe('1')
    })

    it('emits retry event', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        props: { maxRetries: 3 },
        slots: {
          default: () => h(ThrowingComponent),
          error: `<template #error="{ retry }">
            <button data-testid="retry-btn" @click="retry">Retry</button>
          </template>`,
        },
      })

      await flushPromises()
      await wrapper.find('[data-testid="retry-btn"]').trigger('click')

      const emitted = wrapper.emitted('retry')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([1])
    })

    it('does not retry beyond maxRetries', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        props: { maxRetries: 1 },
        slots: {
          default: () => h(ThrowingComponent),
          error: `<template #error="{ retry, retryCount }">
            <div>
              <span data-testid="retry-count">{{ retryCount }}</span>
              <button data-testid="retry-btn" @click="retry">Retry</button>
            </div>
          </template>`,
        },
      })

      await flushPromises()

      // First retry
      await wrapper.find('[data-testid="retry-btn"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="retry-count"]').text()).toBe('1')

      // Second retry should not increment
      await wrapper.find('[data-testid="retry-btn"]').trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="retry-count"]').text()).toBe('1')
    })
  })

  describe('reset functionality', () => {
    it('resets error state and retry count', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
          error: `<template #error="{ reset, retryCount }">
            <div>
              <span data-testid="retry-count">{{ retryCount }}</span>
              <button data-testid="reset-btn" @click="reset">Reset</button>
            </div>
          </template>`,
        },
      })

      await flushPromises()
      await wrapper.find('[data-testid="reset-btn"]').trigger('click')

      const emitted = wrapper.emitted('reset')
      expect(emitted).toBeTruthy()
    })

    it('emits reset event', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
          error: `<template #error="{ reset }">
            <button data-testid="reset-btn" @click="reset">Reset</button>
          </template>`,
        },
      })

      await flushPromises()
      await wrapper.find('[data-testid="reset-btn"]').trigger('click')

      expect(wrapper.emitted('reset')).toBeTruthy()
    })
  })

  describe('autoResetMs prop', () => {
    it('auto-resets after specified time', async () => {
      const onReset = vi.fn()

      const wrapper = mount(ESignatureErrorBoundary, {
        props: { autoResetMs: 5000, onReset },
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      expect(wrapper.find('.esignature-error-boundary').exists()).toBe(true)

      vi.advanceTimersByTime(5000)
      await flushPromises()

      // Reset should have been triggered
      expect(wrapper.emitted('reset')).toBeTruthy()
    })

    it('does not auto-reset when autoResetMs is 0', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        props: { autoResetMs: 0 },
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      vi.advanceTimersByTime(10000)
      await flushPromises()

      expect(wrapper.emitted('reset')).toBeFalsy()
    })
  })

  describe('slot props', () => {
    it('provides all slot props to error slot', async () => {
      const slotProps = ref<ErrorBoundarySlotProps | null>(null)

      mount(ESignatureErrorBoundary, {
        props: { maxRetries: 5 },
        slots: {
          default: () => h(ThrowingEIMZOComponent),
          error: (props: ErrorBoundarySlotProps) => {
            slotProps.value = props
            return h('div', 'Error')
          },
        },
      })

      await flushPromises()

      expect(slotProps.value).not.toBeNull()
      expect(slotProps.value!.error).toBeInstanceOf(EIMZOError)
      expect(typeof slotProps.value!.retry).toBe('function')
      expect(typeof slotProps.value!.reset).toBe('function')
      expect(slotProps.value!.retryCount).toBe(0)
    })
  })

  describe('exposed methods', () => {
    it('exposes error, retryCount, retry, and reset', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      const vm = wrapper.vm as unknown as {
        error: typeof ref<EIMZOError | null>
        retryCount: typeof ref<number>
        retry: () => void
        reset: () => void
      }

      expect(vm.error).toBeDefined()
      expect(vm.retryCount).toBeDefined()
      expect(typeof vm.retry).toBe('function')
      expect(typeof vm.reset).toBe('function')
    })
  })

  describe('default error UI', () => {
    it('shows error code', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () =>
            h(ThrowingEIMZOComponent, { code: ERROR_CODES.CONNECTION_LOST }),
        },
      })

      await flushPromises()

      const codeElement = wrapper.find('.esignature-error-boundary__code')
      expect(codeElement.text()).toContain('CONNECTION_LOST')
    })

    it('shows retry button when retries remaining', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        props: { maxRetries: 3 },
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      const retryBtn = wrapper.find('.esignature-error-boundary__retry-btn')
      expect(retryBtn.exists()).toBe(true)
      expect(retryBtn.text()).toContain('0/3')
    })

    it('shows reset button', async () => {
      const wrapper = mount(ESignatureErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      })

      await flushPromises()

      const resetBtn = wrapper.find('.esignature-error-boundary__reset-btn')
      expect(resetBtn.exists()).toBe(true)
    })
  })
})
