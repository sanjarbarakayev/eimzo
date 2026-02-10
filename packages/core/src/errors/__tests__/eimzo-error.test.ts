import type { ErrorContext } from '../eimzo-error'
import { describe, expect, it } from 'vitest'
import { ERROR_CODES } from '../../types/error-codes'
import { EIMZOError } from '../eimzo-error'

describe('eIMZOError', () => {
  describe('constructor', () => {
    it('creates an error with code and message', () => {
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_FAILED,
        'Connection failed',
      )

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(EIMZOError)
      expect(error.name).toBe('EIMZOError')
      expect(error.code).toBe(ERROR_CODES.CONNECTION_FAILED)
      expect(error.message).toBe('Connection failed')
    })

    it('creates an error with context', () => {
      const context: Partial<ErrorContext> = {
        operation: 'signData',
        certificateSerialNumber: '123456',
        keyId: 'key-123',
        retryAttempt: 2,
        params: { data: 'test' },
        metadata: { requestId: 'req-123' },
      }

      const error = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Signing failed',
        { context },
      )

      expect(error.context.operation).toBe('signData')
      expect(error.context.certificateSerialNumber).toBe('123456')
      expect(error.context.keyId).toBe('key-123')
      expect(error.context.retryAttempt).toBe(2)
      expect(error.context.params).toEqual({ data: 'test' })
      expect(error.context.metadata).toEqual({ requestId: 'req-123' })
    })

    it('uses "unknown" as default operation', () => {
      const error = new EIMZOError(
        ERROR_CODES.UNKNOWN_ERROR,
        'Something went wrong',
      )

      expect(error.context.operation).toBe('unknown')
    })

    it('generates a correlation ID', () => {
      const error = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Operation timed out',
      )

      expect(error.correlationId).toBeDefined()
      expect(error.correlationId).toMatch(/^eimzo-[a-z0-9]+-[a-z0-9]+$/)
    })

    it('uses provided correlation ID', () => {
      const correlationId = 'custom-correlation-123'
      const error = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Operation timed out',
        { correlationId },
      )

      expect(error.correlationId).toBe(correlationId)
    })

    it('records timestamp', () => {
      const before = new Date()
      const error = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Operation timed out',
      )
      const after = new Date()

      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('stores cause error', () => {
      const cause = new Error('Original error')
      const error = new EIMZOError(
        ERROR_CODES.UNKNOWN_ERROR,
        'Wrapped error',
        { cause },
      )

      expect(error.cause).toBe(cause)
    })

    it('has a stack trace', () => {
      const error = new EIMZOError(
        ERROR_CODES.UNKNOWN_ERROR,
        'Test error',
      )

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('EIMZOError')
    })
  })

  describe('withContext', () => {
    it('creates a new error with additional context', () => {
      const original = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Signing failed',
        { context: { operation: 'signData' } },
      )

      const withRetry = original.withContext({ retryAttempt: 1 })

      expect(withRetry).not.toBe(original)
      expect(withRetry.code).toBe(original.code)
      expect(withRetry.message).toBe(original.message)
      expect(withRetry.correlationId).toBe(original.correlationId)
      expect(withRetry.context.operation).toBe('signData')
      expect(withRetry.context.retryAttempt).toBe(1)
    })

    it('does not mutate the original error', () => {
      const original = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Signing failed',
        { context: { operation: 'signData' } },
      )

      original.withContext({ retryAttempt: 1 })

      expect(original.context.retryAttempt).toBeUndefined()
    })

    it('preserves the original timestamp', () => {
      const original = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Timed out',
        { context: { operation: 'connect' } },
      )

      // Wait a bit to ensure timestamps would be different
      const withContext = original.withContext({ retryAttempt: 1 })

      expect(withContext.timestamp.getTime()).toBe(original.timestamp.getTime())
    })

    it('deep merges metadata', () => {
      const original = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Signing failed',
        {
          context: {
            operation: 'signData',
            metadata: { foo: 'bar', keep: 'this' },
          },
        },
      )

      const withMetadata = original.withContext({
        metadata: { baz: 'qux', foo: 'overwritten' },
      })

      expect(withMetadata.context.metadata).toEqual({
        foo: 'overwritten',
        keep: 'this',
        baz: 'qux',
      })
    })

    it('overwrites context properties', () => {
      const original = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Connection lost',
        { context: { operation: 'connect', retryAttempt: 1 } },
      )

      const updated = original.withContext({ retryAttempt: 2 })

      expect(updated.context.retryAttempt).toBe(2)
      expect(original.context.retryAttempt).toBe(1)
    })

    it('preserves cause', () => {
      const cause = new Error('Original')
      const original = new EIMZOError(
        ERROR_CODES.UNKNOWN_ERROR,
        'Wrapped',
        { cause, context: { operation: 'test' } },
      )

      const withContext = original.withContext({ retryAttempt: 1 })

      expect(withContext.cause).toBe(cause)
    })
  })

  describe('toJSON', () => {
    it('serializes error to JSON object', () => {
      const error = new EIMZOError(
        ERROR_CODES.CERTIFICATE_EXPIRED,
        'Certificate expired',
        {
          context: { operation: 'validateCert', certificateSerialNumber: '123' },
          correlationId: 'test-correlation-id',
        },
      )

      const json = error.toJSON()

      expect(json.name).toBe('EIMZOError')
      expect(json.code).toBe(ERROR_CODES.CERTIFICATE_EXPIRED)
      expect(json.message).toBe('Certificate expired')
      expect(json.description).toBe('Certificate has expired')
      expect(json.context).toEqual({
        operation: 'validateCert',
        certificateSerialNumber: '123',
      })
      expect(json.correlationId).toBe('test-correlation-id')
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(json.stack).toBeDefined()
    })

    it('includes cause in JSON when present', () => {
      const cause = new Error('Root cause')
      cause.stack = 'Error: Root cause\n    at test.js:1:1'

      const error = new EIMZOError(
        ERROR_CODES.UNKNOWN_ERROR,
        'Wrapped error',
        { cause, context: { operation: 'test' } },
      )

      const json = error.toJSON()

      expect(json.cause).toEqual({
        name: 'Error',
        message: 'Root cause',
        stack: 'Error: Root cause\n    at test.js:1:1',
      })
    })

    it('excludes cause from JSON when not present', () => {
      const error = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Timed out',
        { context: { operation: 'connect' } },
      )

      const json = error.toJSON()

      expect(json.cause).toBeUndefined()
    })

    it('produces valid JSON', () => {
      const error = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Signing failed',
        {
          context: {
            operation: 'signData',
            params: { data: 'test' },
            metadata: { nested: { value: 123 } },
          },
        },
      )

      const json = error.toJSON()
      const stringified = JSON.stringify(json)
      const parsed = JSON.parse(stringified)

      expect(parsed.code).toBe(ERROR_CODES.SIGNING_ERROR)
      expect(parsed.context.params.data).toBe('test')
    })
  })

  describe('from', () => {
    it('returns the same EIMZOError if passed without context', () => {
      const original = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Timed out',
        { context: { operation: 'connect' } },
      )

      const result = EIMZOError.from(original)

      expect(result).toBe(original)
    })

    it('adds context to existing EIMZOError', () => {
      const original = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Timed out',
        { context: { operation: 'connect' } },
      )

      const result = EIMZOError.from(original, { retryAttempt: 1 })

      expect(result).not.toBe(original)
      expect(result.context.retryAttempt).toBe(1)
      expect(result.correlationId).toBe(original.correlationId)
    })

    it('wraps standard Error', () => {
      const stdError = new Error('Standard error')

      const result = EIMZOError.from(stdError, { operation: 'test' })

      expect(result).toBeInstanceOf(EIMZOError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('Standard error')
      expect(result.cause).toBe(stdError)
      expect(result.context.operation).toBe('test')
    })

    it('wraps string error', () => {
      const result = EIMZOError.from('Something went wrong', { operation: 'test' })

      expect(result).toBeInstanceOf(EIMZOError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('Something went wrong')
      expect(result.cause).toBeUndefined()
    })

    it('wraps error-like object with code', () => {
      const errorLike = {
        code: ERROR_CODES.CONNECTION_FAILED,
        message: 'Connection failed',
      }

      const result = EIMZOError.from(errorLike, { operation: 'connect' })

      expect(result).toBeInstanceOf(EIMZOError)
      expect(result.code).toBe(ERROR_CODES.CONNECTION_FAILED)
      expect(result.message).toBe('Connection failed')
    })

    it('uses UNKNOWN_ERROR for invalid code', () => {
      const errorLike = {
        code: 'INVALID_CODE',
        message: 'Some message',
      }

      const result = EIMZOError.from(errorLike, { operation: 'test' })

      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
    })

    it('handles null', () => {
      const result = EIMZOError.from(null, { operation: 'test' })

      expect(result).toBeInstanceOf(EIMZOError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('An unknown error occurred')
    })

    it('handles undefined', () => {
      const result = EIMZOError.from(undefined, { operation: 'test' })

      expect(result).toBeInstanceOf(EIMZOError)
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('An unknown error occurred')
    })

    it('handles number', () => {
      const result = EIMZOError.from(42, { operation: 'test' })

      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR)
      expect(result.message).toBe('An unknown error occurred')
    })

    it('works without context parameter', () => {
      const stdError = new Error('Test error')
      const result = EIMZOError.from(stdError)

      expect(result.context.operation).toBe('unknown')
      expect(result.cause).toBe(stdError)
    })
  })

  describe('isEIMZOError', () => {
    it('returns true for EIMZOError', () => {
      const error = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Timed out',
        { context: { operation: 'test' } },
      )

      expect(EIMZOError.isEIMZOError(error)).toBe(true)
    })

    it('returns false for standard Error', () => {
      const error = new Error('Standard error')

      expect(EIMZOError.isEIMZOError(error)).toBe(false)
    })

    it('returns false for error-like object', () => {
      const errorLike = {
        code: ERROR_CODES.TIMEOUT,
        message: 'Timed out',
        timestamp: new Date(),
        correlationId: 'test',
        context: { operation: 'test' },
      }

      expect(EIMZOError.isEIMZOError(errorLike)).toBe(false)
    })

    it('returns false for null', () => {
      expect(EIMZOError.isEIMZOError(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(EIMZOError.isEIMZOError(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(EIMZOError.isEIMZOError('error')).toBe(false)
    })
  })

  describe('instanceof checks', () => {
    it('works correctly after serialization through throw/catch', () => {
      let caught: unknown
      try {
        throw new EIMZOError(
          ERROR_CODES.TIMEOUT,
          'Timed out',
          { context: { operation: 'test' } },
        )
      }
      catch (e) {
        caught = e
      }

      expect(caught).toBeInstanceOf(EIMZOError)
      expect(caught).toBeInstanceOf(Error)
      expect(EIMZOError.isEIMZOError(caught)).toBe(true)
    })
  })

  describe('error codes coverage', () => {
    it('works with all error codes', () => {
      const errorCodes = Object.values(ERROR_CODES)

      for (const code of errorCodes) {
        const error = new EIMZOError(code, `Test message for ${code}`, {
          context: { operation: 'test' },
        })

        expect(error.code).toBe(code)
        expect(error.toJSON().description).toBeDefined()
      }
    })
  })

  describe('correlation ID uniqueness', () => {
    it('generates unique correlation IDs', () => {
      const ids = new Set<string>()
      const count = 100

      for (let i = 0; i < count; i++) {
        const error = new EIMZOError(
          ERROR_CODES.UNKNOWN_ERROR,
          'Test',
          { context: { operation: 'test' } },
        )
        ids.add(error.correlationId)
      }

      expect(ids.size).toBe(count)
    })
  })
})
