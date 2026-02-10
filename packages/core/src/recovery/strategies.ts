/**
 * Built-in Recovery Strategies
 *
 * Provides default recovery strategies for common E-IMZO errors.
 *
 * @example
 * ```typescript
 * import { RecoveryExecutor, DEFAULT_RECOVERY_STRATEGIES } from '@eimzo/core';
 *
 * const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES);
 * const result = await executor.attemptRecovery(error, client, 'signData');
 * ```
 */

import type { EIMZOError } from '../errors/eimzo-error'
import type { ErrorCode } from '../types/error-codes'
import type { RecoveryContext, RecoveryResult, RecoveryStrategy } from './types'
import { ERROR_CODES, isApplicationErrorCode, isCertificateErrorCode, isConnectionErrorCode } from '../types/error-codes'

// ============================================================================
// Reconnect Strategy
// ============================================================================

/**
 * Strategy for recovering from connection errors by reconnecting
 */
export const reconnectStrategy: RecoveryStrategy = {
  name: 'reconnect',
  handles: [ERROR_CODES.CONNECTION_LOST, ERROR_CODES.CONNECTION_FAILED],
  priority: 100,

  canRecover(error: EIMZOError): boolean {
    return isConnectionErrorCode(error.code) && error.code !== ERROR_CODES.WEBSOCKET_NOT_SUPPORTED
  },

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const { client, attempt, maxAttempts } = context

    if (!client.reconnect) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: 'Client does not support reconnection',
      }
    }

    // Check if already connected
    if (client.isConnected?.()) {
      return {
        recovered: true,
        shouldRetryOperation: true,
        message: 'Already connected',
      }
    }

    try {
      await client.reconnect()

      return {
        recovered: true,
        shouldRetryOperation: true,
        message: `Reconnected successfully on attempt ${attempt}/${maxAttempts}`,
      }
    }
    catch (reconnectError) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: `Reconnection failed: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`,
      }
    }
  },
}

// ============================================================================
// Certificate Refresh Strategy
// ============================================================================

/**
 * Strategy for recovering from certificate errors by refreshing certificates
 */
export const certificateRefreshStrategy: RecoveryStrategy = {
  name: 'certificateRefresh',
  handles: [ERROR_CODES.CERTIFICATE_EXPIRED, ERROR_CODES.CERTIFICATE_NOT_FOUND],
  priority: 90,

  canRecover(error: EIMZOError): boolean {
    return isCertificateErrorCode(error.code)
  },

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const { client, error } = context

    if (!client.refreshCertificates) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: 'Client does not support certificate refresh',
      }
    }

    // Certificate expired is not recoverable by refresh alone
    // User needs to renew their certificate
    if (error.code === ERROR_CODES.CERTIFICATE_EXPIRED) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: 'Certificate has expired. User must renew their certificate.',
      }
    }

    // Certificate not yet valid - wait and retry
    if (error.code === ERROR_CODES.CERTIFICATE_NOT_YET_VALID) {
      return {
        recovered: false,
        shouldRetryOperation: true,
        message: 'Certificate is not yet valid. Retry later.',
      }
    }

    try {
      await client.refreshCertificates()

      return {
        recovered: true,
        shouldRetryOperation: true,
        message: 'Certificates refreshed successfully',
      }
    }
    catch (refreshError) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: `Certificate refresh failed: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`,
      }
    }
  },
}

// ============================================================================
// Version Check Strategy
// ============================================================================

/**
 * Strategy for recovering from version-related errors
 */
export const versionCheckStrategy: RecoveryStrategy = {
  name: 'versionCheck',
  handles: [ERROR_CODES.VERSION_UNDEFINED, ERROR_CODES.CRYPTO_API_ERROR],
  priority: 80,

  canRecover(error: EIMZOError): boolean {
    return isApplicationErrorCode(error.code)
  },

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const { client, error } = context

    // These errors are not recoverable - user action required
    if (error.code === ERROR_CODES.EIMZO_NOT_INSTALLED) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: 'E-IMZO application is not installed. User must install E-IMZO.',
      }
    }

    if (error.code === ERROR_CODES.VERSION_OUTDATED) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: 'E-IMZO version is outdated. User must update E-IMZO.',
      }
    }

    if (!client.checkVersion) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: 'Client does not support version check',
      }
    }

    try {
      const version = await client.checkVersion()

      // Version was retrieved, retry the operation
      return {
        recovered: true,
        shouldRetryOperation: true,
        message: `E-IMZO version detected: ${version}`,
      }
    }
    catch (versionError) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: `Version check failed: ${versionError instanceof Error ? versionError.message : String(versionError)}`,
      }
    }
  },
}

// ============================================================================
// Default Strategies Collection
// ============================================================================

/**
 * Default collection of recovery strategies sorted by priority
 */
export const DEFAULT_RECOVERY_STRATEGIES: readonly RecoveryStrategy[] = [
  reconnectStrategy,
  certificateRefreshStrategy,
  versionCheckStrategy,
].sort((a, b) => b.priority - a.priority)

// ============================================================================
// Strategy Creation Helper
// ============================================================================

/**
 * Creates a custom recovery strategy
 *
 * @param config - Strategy configuration
 * @returns RecoveryStrategy implementation
 *
 * @example
 * ```typescript
 * const customStrategy = createStrategy({
 *   name: 'customRetry',
 *   handles: [ERROR_CODES.SIGNING_ERROR],
 *   priority: 50,
 *   recover: async (context) => {
 *     // Custom recovery logic
 *     return { recovered: true, shouldRetryOperation: true };
 *   },
 * });
 * ```
 */
export function createStrategy(config: {
  name: string
  handles: readonly ErrorCode[]
  priority?: number
  canRecover?: (error: EIMZOError) => boolean
  recover: (context: RecoveryContext) => Promise<RecoveryResult>
}): RecoveryStrategy {
  const handles = config.handles

  return {
    name: config.name,
    handles,
    priority: config.priority ?? 50,
    canRecover:
      config.canRecover
      ?? ((error: EIMZOError) => (handles as readonly ErrorCode[]).includes(error.code)),
    recover: config.recover,
  }
}
