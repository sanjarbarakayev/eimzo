import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateBackoffDelay,
  classifyError,
  DEFAULT_RESILIENCE_OPTIONS,
  isRetryExhaustedError,
  isTimeoutError,
  isTransientError,
  RetryExhaustedError,
  TimeoutError,
  withResilience,
  withRetry,
  withTimeout,
} from '../utils/resilience'

describe('resilience utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('timeoutError', () => {
    it('should create TimeoutError with message and timeout', () => {
      const error = new TimeoutError('Test timeout', 5000)
      expect(error.message).toBe('Test timeout')
      expect(error.timeout).toBe(5000)
      expect(error.name).toBe('TimeoutError')
    })

    it('should be instanceof TimeoutError', () => {
      const error = new TimeoutError('Test', 1000)
      expect(error instanceof TimeoutError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('retryExhaustedError', () => {
    it('should create RetryExhaustedError with message, attempts, and lastError', () => {
      const lastError = new Error('Original error')
      const error = new RetryExhaustedError('Retries exhausted', 3, lastError)
      expect(error.message).toBe('Retries exhausted')
      expect(error.attempts).toBe(3)
      expect(error.lastError).toBe(lastError)
      expect(error.name).toBe('RetryExhaustedError')
    })

    it('should be instanceof RetryExhaustedError', () => {
      const error = new RetryExhaustedError('Test', 3, null)
      expect(error instanceof RetryExhaustedError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('classifyError', () => {
    it('should classify transient WebSocket close codes', () => {
      expect(classifyError(1001)).toBe('transient') // Going Away
      expect(classifyError(1006)).toBe('transient') // Abnormal Closure
      expect(classifyError(1011)).toBe('transient') // Unexpected Condition
      expect(classifyError(1012)).toBe('transient') // Service Restart
      expect(classifyError(1013)).toBe('transient') // Try Again Later
    })

    it('should classify application WebSocket close codes', () => {
      expect(classifyError(1000)).toBe('application') // Normal Closure
      expect(classifyError(1002)).toBe('application') // Protocol Error
      expect(classifyError(1003)).toBe('application') // Unsupported Data
    })

    it('should classify application errors from error messages', () => {
      expect(classifyError(new Error('BadPaddingException'))).toBe('application')
      expect(classifyError(new Error('InvalidKeyException'))).toBe('application')
      expect(classifyError(new Error('CertificateExpired'))).toBe('application')
      expect(classifyError(new Error('InvalidPassword'))).toBe('application')
    })

    it('should classify transient errors from error messages', () => {
      expect(classifyError(new Error('Network error'))).toBe('transient')
      expect(classifyError(new Error('Connection refused'))).toBe('transient')
      expect(classifyError(new Error('timeout'))).toBe('transient')
      expect(classifyError(new Error('ECONNREFUSED'))).toBe('transient')
      expect(classifyError(new Error('WebSocket error'))).toBe('transient')
    })

    it('should classify TimeoutError as transient', () => {
      const error = new TimeoutError('Test', 1000)
      expect(classifyError(error)).toBe('transient')
    })

    it('should classify unknown errors', () => {
      expect(classifyError(new Error('Unknown error type'))).toBe('unknown')
      expect(classifyError('string error')).toBe('unknown')
      expect(classifyError(null)).toBe('unknown')
    })
  })

  describe('isTransientError', () => {
    it('should return true for transient errors', () => {
      expect(isTransientError(new Error('Network error'))).toBe(true)
      expect(isTransientError(1006)).toBe(true)
    })

    it('should return false for application errors', () => {
      expect(isTransientError(new Error('InvalidPassword'))).toBe(false)
      expect(isTransientError(1000)).toBe(false)
    })

    it('should return true for unknown errors (conservative approach)', () => {
      expect(isTransientError(new Error('Some random error'))).toBe(true)
    })
  })

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff delay', () => {
      // With 0 jitter for testing, we mock Math.random
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // No jitter effect

      const delay1 = calculateBackoffDelay(1, 1000, 10000, 2)
      const delay2 = calculateBackoffDelay(2, 1000, 10000, 2)
      const delay3 = calculateBackoffDelay(3, 1000, 10000, 2)

      // With jitter at 0.5, the delay should be exactly base
      expect(delay1).toBe(1000)
      expect(delay2).toBe(2000)
      expect(delay3).toBe(4000)
    })

    it('should respect maxDelay', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const delay = calculateBackoffDelay(10, 1000, 5000, 2)
      expect(delay).toBe(5000) // Clamped to maxDelay
    })

    it('should add jitter', () => {
      // Test with min jitter
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const minDelay = calculateBackoffDelay(1, 1000, 10000, 2)
      expect(minDelay).toBe(750) // 1000 - 25%

      // Test with max jitter
      vi.spyOn(Math, 'random').mockReturnValue(1)
      const maxDelay = calculateBackoffDelay(1, 1000, 10000, 2)
      expect(maxDelay).toBe(1250) // 1000 + 25%
    })
  })

  describe('withTimeout', () => {
    it('should resolve when operation completes before timeout', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const resultPromise = withTimeout(operation, { timeout: 1000 })
      await vi.runAllTimersAsync()
      const result = await resultPromise

      expect(result).toBe('success')
    })

    it('should reject with TimeoutError when operation exceeds timeout', async () => {
      const operation = vi
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 5000)))

      const resultPromise = withTimeout(operation, { timeout: 1000 })

      // Advance time past the timeout
      vi.advanceTimersByTime(1001)

      await expect(resultPromise).rejects.toThrow(TimeoutError)
      await expect(resultPromise).rejects.toThrow('Operation timed out after 1000ms')
    })

    it('should use custom timeout message', async () => {
      const operation = vi
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 5000)))

      const resultPromise = withTimeout(operation, {
        timeout: 1000,
        timeoutMessage: 'Custom timeout message',
      })

      vi.advanceTimersByTime(1001)

      await expect(resultPromise).rejects.toThrow('Custom timeout message')
    })

    it('should propagate operation errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'))

      const resultPromise = withTimeout(operation, { timeout: 1000 })

      await expect(resultPromise).rejects.toThrow('Operation failed')
    })
  })

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await withRetry(operation, { maxRetries: 3 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on transient errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue('success')

      const resultPromise = withRetry(operation, { maxRetries: 3, baseDelay: 100 })

      // Run timers for retries
      await vi.runAllTimersAsync()
      const result = await resultPromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw immediately on application errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('InvalidPassword'))

      await expect(withRetry(operation, { maxRetries: 3 })).rejects.toThrow('InvalidPassword')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should throw RetryExhaustedError after max retries', async () => {
      vi.useRealTimers() // Use real timers for this test to avoid unhandled rejection

      const operation = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        withRetry(operation, { maxRetries: 2, baseDelay: 10, maxDelay: 50 }),
      ).rejects.toThrow(RetryExhaustedError)

      expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries

      vi.useFakeTimers() // Restore fake timers
    })

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn()
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const resultPromise = withRetry(operation, {
        maxRetries: 3,
        baseDelay: 100,
        onRetry,
      })

      await vi.runAllTimersAsync()
      await resultPromise

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number))
    })

    it('should use custom isRetryable function', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Custom error'))
      const isRetryable = vi.fn().mockReturnValue(false)

      await expect(withRetry(operation, { maxRetries: 3, isRetryable })).rejects.toThrow(
        'Custom error',
      )

      expect(isRetryable).toHaveBeenCalledWith(expect.any(Error))
      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('withResilience', () => {
    it('should combine timeout and retry', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const resultPromise = withResilience(operation, {
        timeout: 5000,
        maxRetries: 3,
        baseDelay: 100,
      })

      await vi.runAllTimersAsync()
      const result = await resultPromise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should respect enableRetry=false', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(withResilience(operation, { enableRetry: false })).rejects.toThrow(
        'Network error',
      )

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should respect enableTimeout=false', async () => {
      const operation = vi
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve('success'), 5000)),
        )

      const resultPromise = withResilience(operation, {
        timeout: 1000,
        enableTimeout: false,
      })

      vi.advanceTimersByTime(5001)
      const result = await resultPromise

      expect(result).toBe('success')
    })
  })

  describe('isTimeoutError', () => {
    it('should return true for TimeoutError', () => {
      expect(isTimeoutError(new TimeoutError('Test', 1000))).toBe(true)
    })

    it('should return false for other errors', () => {
      expect(isTimeoutError(new Error('Test'))).toBe(false)
      expect(isTimeoutError(null)).toBe(false)
      expect(isTimeoutError('string')).toBe(false)
    })
  })

  describe('isRetryExhaustedError', () => {
    it('should return true for RetryExhaustedError', () => {
      expect(isRetryExhaustedError(new RetryExhaustedError('Test', 3, null))).toBe(true)
    })

    it('should return false for other errors', () => {
      expect(isRetryExhaustedError(new Error('Test'))).toBe(false)
      expect(isRetryExhaustedError(null)).toBe(false)
    })
  })

  describe('dEFAULT_RESILIENCE_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_RESILIENCE_OPTIONS.timeout).toBe(30000)
      expect(DEFAULT_RESILIENCE_OPTIONS.maxRetries).toBe(3)
      expect(DEFAULT_RESILIENCE_OPTIONS.baseDelay).toBe(1000)
      expect(DEFAULT_RESILIENCE_OPTIONS.maxDelay).toBe(10000)
      expect(DEFAULT_RESILIENCE_OPTIONS.backoffMultiplier).toBe(2)
      expect(DEFAULT_RESILIENCE_OPTIONS.enableRetry).toBe(true)
      expect(DEFAULT_RESILIENCE_OPTIONS.enableTimeout).toBe(true)
    })
  })
})
