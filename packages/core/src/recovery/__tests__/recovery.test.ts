import type { RecoveryClient } from '../types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EIMZOError } from '../../errors/eimzo-error'
import { ERROR_CODES } from '../../types/error-codes'
import {
  certificateRefreshStrategy,
  createStrategy,
  DEFAULT_RECOVERY_STRATEGIES,
  reconnectStrategy,
  RecoveryExecutor,
  versionCheckStrategy,
} from '../index'

describe('recovery Strategies', () => {
  describe('reconnectStrategy', () => {
    it('has correct configuration', () => {
      expect(reconnectStrategy.name).toBe('reconnect')
      expect(reconnectStrategy.handles).toContain(ERROR_CODES.CONNECTION_LOST)
      expect(reconnectStrategy.handles).toContain(ERROR_CODES.CONNECTION_FAILED)
      expect(reconnectStrategy.priority).toBe(100)
    })

    it('can recover from CONNECTION_LOST', () => {
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Connection lost',
        { context: { operation: 'test' } },
      )

      expect(reconnectStrategy.canRecover(error)).toBe(true)
    })

    it('can recover from CONNECTION_FAILED', () => {
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_FAILED,
        'Connection failed',
        { context: { operation: 'test' } },
      )

      expect(reconnectStrategy.canRecover(error)).toBe(true)
    })

    it('cannot recover from WEBSOCKET_NOT_SUPPORTED', () => {
      const error = new EIMZOError(
        ERROR_CODES.WEBSOCKET_NOT_SUPPORTED,
        'Not supported',
        { context: { operation: 'test' } },
      )

      expect(reconnectStrategy.canRecover(error)).toBe(false)
    })

    it('cannot recover from non-connection errors', () => {
      const error = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Signing failed',
        { context: { operation: 'test' } },
      )

      expect(reconnectStrategy.canRecover(error)).toBe(false)
    })

    describe('recover', () => {
      it('returns failure when client has no reconnect method', async () => {
        const client: RecoveryClient = {}
        const error = new EIMZOError(
          ERROR_CODES.CONNECTION_LOST,
          'Lost',
          { context: { operation: 'test' } },
        )

        const result = await reconnectStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(false)
        expect(result.shouldRetryOperation).toBe(false)
        expect(result.message).toContain('does not support reconnection')
      })

      it('returns success when already connected', async () => {
        const client: RecoveryClient = {
          reconnect: vi.fn(),
          isConnected: vi.fn().mockReturnValue(true),
        }
        const error = new EIMZOError(
          ERROR_CODES.CONNECTION_LOST,
          'Lost',
          { context: { operation: 'test' } },
        )

        const result = await reconnectStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(true)
        expect(result.shouldRetryOperation).toBe(true)
        expect(client.reconnect).not.toHaveBeenCalled()
      })

      it('reconnects successfully', async () => {
        const client: RecoveryClient = {
          reconnect: vi.fn().mockResolvedValue(undefined),
          isConnected: vi.fn().mockReturnValue(false),
        }
        const error = new EIMZOError(
          ERROR_CODES.CONNECTION_LOST,
          'Lost',
          { context: { operation: 'test' } },
        )

        const result = await reconnectStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 2,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(true)
        expect(result.shouldRetryOperation).toBe(true)
        expect(result.message).toContain('attempt 2/3')
        expect(client.reconnect).toHaveBeenCalledTimes(1)
      })

      it('handles reconnection failure', async () => {
        const client: RecoveryClient = {
          reconnect: vi.fn().mockRejectedValue(new Error('Network error')),
          isConnected: vi.fn().mockReturnValue(false),
        }
        const error = new EIMZOError(
          ERROR_CODES.CONNECTION_LOST,
          'Lost',
          { context: { operation: 'test' } },
        )

        const result = await reconnectStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(false)
        expect(result.shouldRetryOperation).toBe(false)
        expect(result.message).toContain('Network error')
      })
    })
  })

  describe('certificateRefreshStrategy', () => {
    it('has correct configuration', () => {
      expect(certificateRefreshStrategy.name).toBe('certificateRefresh')
      expect(certificateRefreshStrategy.handles).toContain(ERROR_CODES.CERTIFICATE_EXPIRED)
      expect(certificateRefreshStrategy.handles).toContain(ERROR_CODES.CERTIFICATE_NOT_FOUND)
      expect(certificateRefreshStrategy.priority).toBe(90)
    })

    it('can recover from certificate errors', () => {
      const error = new EIMZOError(
        ERROR_CODES.CERTIFICATE_NOT_FOUND,
        'Not found',
        { context: { operation: 'test' } },
      )

      expect(certificateRefreshStrategy.canRecover(error)).toBe(true)
    })

    it('cannot recover from non-certificate errors', () => {
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      expect(certificateRefreshStrategy.canRecover(error)).toBe(false)
    })

    describe('recover', () => {
      it('returns failure for CERTIFICATE_EXPIRED (not recoverable)', async () => {
        const client: RecoveryClient = {
          refreshCertificates: vi.fn(),
        }
        const error = new EIMZOError(
          ERROR_CODES.CERTIFICATE_EXPIRED,
          'Expired',
          { context: { operation: 'test' } },
        )

        const result = await certificateRefreshStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(false)
        expect(result.shouldRetryOperation).toBe(false)
        expect(result.message).toContain('renew their certificate')
        expect(client.refreshCertificates).not.toHaveBeenCalled()
      })

      it('returns retry for CERTIFICATE_NOT_YET_VALID', async () => {
        const client: RecoveryClient = {
          refreshCertificates: vi.fn(),
        }
        const error = new EIMZOError(
          ERROR_CODES.CERTIFICATE_NOT_YET_VALID,
          'Not yet valid',
          { context: { operation: 'test' } },
        )

        const result = await certificateRefreshStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(false)
        expect(result.shouldRetryOperation).toBe(true)
        expect(result.message).toContain('not yet valid')
      })

      it('refreshes certificates for CERTIFICATE_NOT_FOUND', async () => {
        const client: RecoveryClient = {
          refreshCertificates: vi.fn().mockResolvedValue(undefined),
        }
        const error = new EIMZOError(
          ERROR_CODES.CERTIFICATE_NOT_FOUND,
          'Not found',
          { context: { operation: 'test' } },
        )

        const result = await certificateRefreshStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(true)
        expect(result.shouldRetryOperation).toBe(true)
        expect(client.refreshCertificates).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('versionCheckStrategy', () => {
    it('has correct configuration', () => {
      expect(versionCheckStrategy.name).toBe('versionCheck')
      expect(versionCheckStrategy.handles).toContain(ERROR_CODES.VERSION_UNDEFINED)
      expect(versionCheckStrategy.handles).toContain(ERROR_CODES.CRYPTO_API_ERROR)
      expect(versionCheckStrategy.priority).toBe(80)
    })

    describe('recover', () => {
      it('returns failure for EIMZO_NOT_INSTALLED (not recoverable)', async () => {
        const client: RecoveryClient = {}
        const error = new EIMZOError(
          ERROR_CODES.EIMZO_NOT_INSTALLED,
          'Not installed',
          { context: { operation: 'test' } },
        )

        const result = await versionCheckStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(false)
        expect(result.shouldRetryOperation).toBe(false)
        expect(result.message).toContain('install E-IMZO')
      })

      it('returns failure for VERSION_OUTDATED (not recoverable)', async () => {
        const client: RecoveryClient = {}
        const error = new EIMZOError(
          ERROR_CODES.VERSION_OUTDATED,
          'Outdated',
          { context: { operation: 'test' } },
        )

        const result = await versionCheckStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(false)
        expect(result.shouldRetryOperation).toBe(false)
        expect(result.message).toContain('update E-IMZO')
      })

      it('checks version for VERSION_UNDEFINED', async () => {
        const client: RecoveryClient = {
          checkVersion: vi.fn().mockResolvedValue('1.0.0'),
        }
        const error = new EIMZOError(
          ERROR_CODES.VERSION_UNDEFINED,
          'Undefined',
          { context: { operation: 'test' } },
        )

        const result = await versionCheckStrategy.recover({
          error,
          client,
          operation: 'test',
          attempt: 1,
          maxAttempts: 3,
        })

        expect(result.recovered).toBe(true)
        expect(result.shouldRetryOperation).toBe(true)
        expect(result.message).toContain('1.0.0')
      })
    })
  })

  describe('dEFAULT_RECOVERY_STRATEGIES', () => {
    it('includes all built-in strategies', () => {
      expect(DEFAULT_RECOVERY_STRATEGIES).toContain(reconnectStrategy)
      expect(DEFAULT_RECOVERY_STRATEGIES).toContain(certificateRefreshStrategy)
      expect(DEFAULT_RECOVERY_STRATEGIES).toContain(versionCheckStrategy)
    })

    it('is sorted by priority (highest first)', () => {
      for (let i = 0; i < DEFAULT_RECOVERY_STRATEGIES.length - 1; i++) {
        expect(DEFAULT_RECOVERY_STRATEGIES[i].priority).toBeGreaterThanOrEqual(
          DEFAULT_RECOVERY_STRATEGIES[i + 1].priority,
        )
      }
    })
  })

  describe('createStrategy', () => {
    it('creates a strategy with required fields', () => {
      const strategy = createStrategy({
        name: 'custom',
        handles: [ERROR_CODES.SIGNING_ERROR],
        recover: async () => ({
          recovered: true,
          shouldRetryOperation: true,
        }),
      })

      expect(strategy.name).toBe('custom')
      expect(strategy.handles).toEqual([ERROR_CODES.SIGNING_ERROR])
      expect(strategy.priority).toBe(50) // default
    })

    it('uses provided priority', () => {
      const strategy = createStrategy({
        name: 'custom',
        handles: [ERROR_CODES.SIGNING_ERROR],
        priority: 75,
        recover: async () => ({ recovered: true, shouldRetryOperation: true }),
      })

      expect(strategy.priority).toBe(75)
    })

    it('provides default canRecover implementation', () => {
      const strategy = createStrategy({
        name: 'custom',
        handles: [ERROR_CODES.SIGNING_ERROR, ERROR_CODES.TIMEOUT],
        recover: async () => ({ recovered: true, shouldRetryOperation: true }),
      })

      const signingError = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Failed',
        { context: { operation: 'test' } },
      )
      const timeoutError = new EIMZOError(
        ERROR_CODES.TIMEOUT,
        'Timed out',
        { context: { operation: 'test' } },
      )
      const otherError = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      expect(strategy.canRecover(signingError)).toBe(true)
      expect(strategy.canRecover(timeoutError)).toBe(true)
      expect(strategy.canRecover(otherError)).toBe(false)
    })

    it('uses custom canRecover when provided', () => {
      const strategy = createStrategy({
        name: 'custom',
        handles: [ERROR_CODES.SIGNING_ERROR],
        canRecover: error =>
          error.code === ERROR_CODES.SIGNING_ERROR
          && error.context.retryAttempt !== undefined
          && error.context.retryAttempt < 3,
        recover: async () => ({ recovered: true, shouldRetryOperation: true }),
      })

      const retriableError = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Failed',
        { context: { operation: 'test', retryAttempt: 1 } },
      )
      const maxedOutError = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Failed',
        { context: { operation: 'test', retryAttempt: 3 } },
      )

      expect(strategy.canRecover(retriableError)).toBe(true)
      expect(strategy.canRecover(maxedOutError)).toBe(false)
    })
  })
})

describe('recoveryExecutor', () => {
  let mockClient: RecoveryClient

  beforeEach(() => {
    mockClient = {
      reconnect: vi.fn().mockResolvedValue(undefined),
      refreshCertificates: vi.fn().mockResolvedValue(undefined),
      checkVersion: vi.fn().mockResolvedValue('1.0.0'),
      isConnected: vi.fn().mockReturnValue(false),
    }
  })

  describe('constructor', () => {
    it('sorts strategies by priority', () => {
      const lowPriority = createStrategy({
        name: 'low',
        handles: [ERROR_CODES.UNKNOWN_ERROR],
        priority: 10,
        recover: async () => ({ recovered: true, shouldRetryOperation: true }),
      })
      const highPriority = createStrategy({
        name: 'high',
        handles: [ERROR_CODES.UNKNOWN_ERROR],
        priority: 90,
        recover: async () => ({ recovered: true, shouldRetryOperation: true }),
      })

      const executor = new RecoveryExecutor([lowPriority, highPriority])
      const applicable = executor.findApplicableStrategies(
        new EIMZOError(ERROR_CODES.UNKNOWN_ERROR, 'Error', {
          context: { operation: 'test' },
        }),
      )

      expect(applicable[0].name).toBe('high')
      expect(applicable[1].name).toBe('low')
    })

    it('uses default maxAttempts', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)

      // Private property, test through behavior
      expect(executor).toBeDefined()
    })

    it('accepts custom maxAttempts', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES, {
        maxAttempts: 5,
      })

      expect(executor).toBeDefined()
    })
  })

  describe('findApplicableStrategies', () => {
    it('returns strategies that can handle the error', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      const applicable = executor.findApplicableStrategies(error)

      expect(applicable.length).toBeGreaterThan(0)
      expect(applicable.some(s => s.name === 'reconnect')).toBe(true)
    })

    it('returns empty array when no strategy can handle error', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.WRONG_PASSWORD,
        'Wrong password',
        { context: { operation: 'test' } },
      )

      const applicable = executor.findApplicableStrategies(error)

      expect(applicable).toEqual([])
    })
  })

  describe('canAttemptRecovery', () => {
    it('returns true when strategies exist', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      expect(executor.canAttemptRecovery(error)).toBe(true)
    })

    it('returns false when no strategies exist', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.WRONG_PASSWORD,
        'Wrong',
        { context: { operation: 'test' } },
      )

      expect(executor.canAttemptRecovery(error)).toBe(false)
    })
  })

  describe('getApplicableStrategyNames', () => {
    it('returns strategy names', () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      const names = executor.getApplicableStrategyNames(error)

      expect(names).toContain('reconnect')
    })
  })

  describe('attemptRecovery', () => {
    it('returns failure when no strategies exist', async () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.WRONG_PASSWORD,
        'Wrong',
        { context: { operation: 'test' } },
      )

      const result = await executor.attemptRecovery(
        error,
        mockClient,
        'loadKey',
      )

      expect(result.recovered).toBe(false)
      expect(result.shouldRetryOperation).toBe(false)
      expect(result.message).toContain('No recovery strategy found')
    })

    it('recovers using the first successful strategy', async () => {
      const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES)
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      const result = await executor.attemptRecovery(
        error,
        mockClient,
        'signData',
      )

      expect(result.recovered).toBe(true)
      expect(result.shouldRetryOperation).toBe(true)
      expect(result.message).toContain('[reconnect]')
    })

    it('tries next strategy when one fails', async () => {
      const failingStrategy = createStrategy({
        name: 'failing',
        handles: [ERROR_CODES.CERTIFICATE_NOT_FOUND],
        priority: 100,
        recover: async () => ({
          recovered: false,
          shouldRetryOperation: false,
          message: 'Failed',
        }),
      })

      const succeedingStrategy = createStrategy({
        name: 'succeeding',
        handles: [ERROR_CODES.CERTIFICATE_NOT_FOUND],
        priority: 50,
        recover: async () => ({
          recovered: true,
          shouldRetryOperation: true,
          message: 'Succeeded',
        }),
      })

      const executor = new RecoveryExecutor([
        failingStrategy,
        succeedingStrategy,
      ])
      const error = new EIMZOError(
        ERROR_CODES.CERTIFICATE_NOT_FOUND,
        'Not found',
        { context: { operation: 'test' } },
      )

      const result = await executor.attemptRecovery(
        error,
        mockClient,
        'signData',
      )

      expect(result.recovered).toBe(true)
      expect(result.message).toContain('[succeeding]')
    })

    it('handles strategy that throws an error', async () => {
      const throwingStrategy = createStrategy({
        name: 'throwing',
        handles: [ERROR_CODES.SIGNING_ERROR],
        priority: 100,
        recover: async () => {
          throw new Error('Strategy crashed')
        },
      })

      const fallbackStrategy = createStrategy({
        name: 'fallback',
        handles: [ERROR_CODES.SIGNING_ERROR],
        priority: 50,
        recover: async () => ({
          recovered: true,
          shouldRetryOperation: true,
        }),
      })

      const executor = new RecoveryExecutor([
        throwingStrategy,
        fallbackStrategy,
      ])
      const error = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Failed',
        { context: { operation: 'test' } },
      )

      const result = await executor.attemptRecovery(
        error,
        mockClient,
        'signData',
      )

      expect(result.recovered).toBe(true)
      expect(result.message).toContain('[fallback]')
    })

    it('exhausts all attempts', async () => {
      const alwaysFailStrategy = createStrategy({
        name: 'alwaysFail',
        handles: [ERROR_CODES.SIGNING_ERROR],
        priority: 100,
        recover: async () => ({
          recovered: false,
          shouldRetryOperation: false,
          message: 'Always fails',
        }),
      })

      const executor = new RecoveryExecutor([alwaysFailStrategy], {
        maxAttempts: 3,
      })
      const error = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Failed',
        { context: { operation: 'test' } },
      )

      const result = await executor.attemptRecovery(
        error,
        mockClient,
        'signData',
      )

      expect(result.recovered).toBe(false)
      expect(result.message).toContain('exhausted')
    })

    it('includes strategy name in result message', async () => {
      const executor = new RecoveryExecutor([reconnectStrategy])
      const error = new EIMZOError(
        ERROR_CODES.CONNECTION_LOST,
        'Lost',
        { context: { operation: 'test' } },
      )

      const result = await executor.attemptRecovery(
        error,
        mockClient,
        'signData',
      )

      expect(result.message).toMatch(/\[reconnect\]/)
    })
  })
})
