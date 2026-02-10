import type { EIMZOError, Result } from '../result'
import { describe, expect, it, vi } from 'vitest'
import { ERROR_CODES } from '../error-codes'
import {
  andThen,
  collect,
  createEIMZOError,

  err,
  fromPromise,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  orElse,
  partition,

  toPromise,
  unwrap,
  unwrapErr,
  unwrapOr,
  unwrapOrElse,
} from '../result'

describe('result', () => {
  describe('ok', () => {
    it('should create a success result', () => {
      const result = ok(42)
      expect(result.success).toBe(true)
      expect(result.data).toBe(42)
    })

    it('should work with objects', () => {
      const data = { name: 'test', value: 123 }
      const result = ok(data)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
    })

    it('should work with null', () => {
      const result = ok(null)
      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
    })
  })

  describe('err', () => {
    it('should create a failure result', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Operation timed out')
      const result = err(error)
      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
    })

    it('should work with any error type', () => {
      const result = err('simple error')
      expect(result.success).toBe(false)
      expect(result.error).toBe('simple error')
    })
  })

  describe('createEIMZOError', () => {
    it('should create an EIMZOError with required fields', () => {
      const error = createEIMZOError(ERROR_CODES.CONNECTION_FAILED, 'Connection failed')
      expect(error.code).toBe('CONNECTION_FAILED')
      expect(error.message).toBe('Connection failed')
      expect(error.timestamp).toBeGreaterThan(0)
    })

    it('should include context when provided', () => {
      const error = createEIMZOError(ERROR_CODES.KEY_LOAD_ERROR, 'Failed to load key', {
        context: { operation: 'loadKey', params: { certId: 'abc' } },
      })
      expect(error.context?.operation).toBe('loadKey')
      expect(error.context?.params).toEqual({ certId: 'abc' })
    })

    it('should include cause when provided', () => {
      const cause = new Error('Original error')
      const error = createEIMZOError(ERROR_CODES.UNKNOWN_ERROR, 'Wrapped error', {
        cause,
      })
      expect(error.cause).toBe(cause)
    })
  })

  describe('isOk', () => {
    it('should return true for success results', () => {
      const result = ok(42)
      expect(isOk(result)).toBe(true)
    })

    it('should return false for failure results', () => {
      const result = err(createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout'))
      expect(isOk(result)).toBe(false)
    })

    it('should narrow the type', () => {
      const result: Result<number> = ok(42)
      if (isOk(result)) {
        // TypeScript should know result.data is number
        const n: number = result.data
        expect(n).toBe(42)
      }
    })
  })

  describe('isErr', () => {
    it('should return false for success results', () => {
      const result = ok(42)
      expect(isErr(result)).toBe(false)
    })

    it('should return true for failure results', () => {
      const result = err(createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout'))
      expect(isErr(result)).toBe(true)
    })

    it('should narrow the type', () => {
      const result: Result<number> = err(createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout'))
      if (isErr(result)) {
        // TypeScript should know result.error is EIMZOError
        const code = result.error.code
        expect(code).toBe('TIMEOUT')
      }
    })
  })

  describe('unwrap', () => {
    it('should return value for success results', () => {
      const result = ok(42)
      expect(unwrap(result)).toBe(42)
    })

    it('should throw for failure results with Error', () => {
      const error = new Error('Test error')
      const result = err(error)
      expect(() => unwrap(result)).toThrow('Test error')
    })

    it('should throw for failure results with EIMZOError', () => {
      const result = err(createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout error'))
      expect(() => unwrap(result)).toThrow('Timeout error')
    })

    it('should throw for failure results with string', () => {
      const result = err('Simple error')
      expect(() => unwrap(result)).toThrow('Simple error')
    })
  })

  describe('unwrapOr', () => {
    it('should return value for success results', () => {
      const result = ok(42)
      expect(unwrapOr(result, 0)).toBe(42)
    })

    it('should return default for failure results', () => {
      const result = err(createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout'))
      expect(unwrapOr(result, 0)).toBe(0)
    })
  })

  describe('unwrapOrElse', () => {
    it('should return value for success results', () => {
      const result = ok(42)
      const fn = vi.fn(() => 0)
      expect(unwrapOrElse(result, fn)).toBe(42)
      expect(fn).not.toHaveBeenCalled()
    })

    it('should call function for failure results', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const result = err(error)
      const fn = vi.fn((e: EIMZOError) => e.code.length)
      expect(unwrapOrElse(result, fn)).toBe(7) // 'TIMEOUT'.length
      expect(fn).toHaveBeenCalledWith(error)
    })
  })

  describe('unwrapErr', () => {
    it('should return error for failure results', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const result = err(error)
      expect(unwrapErr(result)).toBe(error)
    })

    it('should throw for success results', () => {
      const result = ok(42)
      expect(() => unwrapErr(result)).toThrow('Called unwrapErr on a success result')
    })
  })

  describe('map', () => {
    it('should transform success value', () => {
      const result = ok(21)
      const mapped = map(result, x => x * 2)
      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe(42)
    })

    it('should pass through failure', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const result = err(error)
      const mapped = map(result, (x: number) => x * 2)
      expect(isErr(mapped)).toBe(true)
      expect(unwrapErr(mapped)).toBe(error)
    })
  })

  describe('mapErr', () => {
    it('should pass through success', () => {
      const result = ok(42)
      const mapped = mapErr(result, () => 'new error')
      expect(isOk(mapped)).toBe(true)
      expect(unwrap(mapped)).toBe(42)
    })

    it('should transform failure error', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const result = err(error)
      const mapped = mapErr(result, e => ({ ...e, message: `Modified: ${e.message}` }))
      expect(isErr(mapped)).toBe(true)
      expect(unwrapErr(mapped).message).toBe('Modified: Timeout')
    })
  })

  describe('andThen', () => {
    it('should chain success results', () => {
      const result = ok(21)
      const chained = andThen(result, x => ok(x * 2))
      expect(isOk(chained)).toBe(true)
      expect(unwrap(chained)).toBe(42)
    })

    it('should pass through failure', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const result = err(error)
      const chained = andThen(result, (x: number) => ok(x * 2))
      expect(isErr(chained)).toBe(true)
      expect(unwrapErr(chained)).toBe(error)
    })

    it('should propagate error from chained function', () => {
      const result = ok(42)
      const newError = createEIMZOError(ERROR_CODES.SIGNING_ERROR, 'Signing failed')
      const chained = andThen(result, () => err(newError))
      expect(isErr(chained)).toBe(true)
      expect(unwrapErr(chained)).toBe(newError)
    })
  })

  describe('orElse', () => {
    it('should pass through success', () => {
      const result = ok(42)
      const recovered = orElse(result, () => ok(0))
      expect(isOk(recovered)).toBe(true)
      expect(unwrap(recovered)).toBe(42)
    })

    it('should recover from failure', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const result = err(error)
      const recovered = orElse(result, () => ok(0))
      expect(isOk(recovered)).toBe(true)
      expect(unwrap(recovered)).toBe(0)
    })

    it('should allow transforming error type', () => {
      const result: Result<number, string> = err('original error')
      const recovered = orElse(result, e => err({ wrapped: e }))
      expect(isErr(recovered)).toBe(true)
      expect(unwrapErr(recovered)).toEqual({ wrapped: 'original error' })
    })
  })

  describe('fromPromise', () => {
    it('should convert resolved promise to success', async () => {
      const promise = Promise.resolve(42)
      const result = await fromPromise(promise)
      expect(isOk(result)).toBe(true)
      expect(unwrap(result)).toBe(42)
    })

    it('should convert rejected promise to failure', async () => {
      const promise = Promise.reject(new Error('Failed'))
      const result = await fromPromise(promise)
      expect(isErr(result)).toBe(true)
      expect(unwrapErr(result).message).toBe('Failed')
      expect(unwrapErr(result).code).toBe('UNKNOWN_ERROR')
    })

    it('should use custom error mapper', async () => {
      const promise = Promise.reject(new Error('Original error'))
      const result = await fromPromise(promise, e =>
        createEIMZOError(ERROR_CODES.CONNECTION_FAILED, `Custom: ${(e as Error).message}`))
      expect(isErr(result)).toBe(true)
      expect(unwrapErr(result).code).toBe('CONNECTION_FAILED')
      expect(unwrapErr(result).message).toBe('Custom: Original error')
    })

    it('should handle non-Error rejections', async () => {
      const promise = Promise.reject('string error')
      const result = await fromPromise(promise)
      expect(isErr(result)).toBe(true)
      expect(unwrapErr(result).message).toBe('string error')
    })
  })

  describe('toPromise', () => {
    it('should convert success to resolved promise', async () => {
      const result = ok(42)
      const value = await toPromise(result)
      expect(value).toBe(42)
    })

    it('should convert failure with Error to rejected promise', async () => {
      const error = new Error('Test error')
      const result = err(error)
      await expect(toPromise(result)).rejects.toThrow('Test error')
    })

    it('should convert failure with EIMZOError to rejected promise', async () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout error')
      const result = err(error)
      await expect(toPromise(result)).rejects.toThrow('Timeout error')
    })
  })

  describe('collect', () => {
    it('should combine all successes into array', () => {
      const results = [ok(1), ok(2), ok(3)]
      const combined = collect(results)
      expect(isOk(combined)).toBe(true)
      expect(unwrap(combined)).toEqual([1, 2, 3])
    })

    it('should return first error on failure', () => {
      const error1 = createEIMZOError(ERROR_CODES.TIMEOUT, 'First error')
      const error2 = createEIMZOError(ERROR_CODES.SIGNING_ERROR, 'Second error')
      const results = [ok(1), err(error1), err(error2)]
      const combined = collect(results)
      expect(isErr(combined)).toBe(true)
      expect(unwrapErr(combined)).toBe(error1)
    })

    it('should handle empty array', () => {
      const results: Result<number>[] = []
      const combined = collect(results)
      expect(isOk(combined)).toBe(true)
      expect(unwrap(combined)).toEqual([])
    })
  })

  describe('partition', () => {
    it('should separate successes and failures', () => {
      const error = createEIMZOError(ERROR_CODES.TIMEOUT, 'Timeout')
      const results = [ok(1), err(error), ok(2), ok(3)]
      const { ok: successes, err: failures } = partition(results)
      expect(successes).toEqual([1, 2, 3])
      expect(failures).toEqual([error])
    })

    it('should handle all successes', () => {
      const results = [ok(1), ok(2)]
      const { ok: successes, err: failures } = partition(results)
      expect(successes).toEqual([1, 2])
      expect(failures).toEqual([])
    })

    it('should handle all failures', () => {
      const error1 = createEIMZOError(ERROR_CODES.TIMEOUT, 'E1')
      const error2 = createEIMZOError(ERROR_CODES.SIGNING_ERROR, 'E2')
      const results = [err(error1), err(error2)]
      const { ok: successes, err: failures } = partition(results)
      expect(successes).toEqual([])
      expect(failures).toEqual([error1, error2])
    })

    it('should handle empty array', () => {
      const results: Result<number>[] = []
      const { ok: successes, err: failures } = partition(results)
      expect(successes).toEqual([])
      expect(failures).toEqual([])
    })
  })
})
