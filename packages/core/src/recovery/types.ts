/**
 * Recovery Strategy Types
 *
 * Defines interfaces for error recovery strategies in E-IMZO SDK.
 */

import type { EIMZOError } from '../errors/eimzo-error'
import type { ErrorCode } from '../types/error-codes'

/**
 * Minimal client interface needed for recovery operations
 * Allows recovery strategies to work with any client implementation
 */
export interface RecoveryClient {
  /** Reconnect to the WebSocket server */
  reconnect?: () => Promise<void>
  /** Refresh/reload certificates */
  refreshCertificates?: () => Promise<void>
  /** Check E-IMZO version */
  checkVersion?: () => Promise<string>
  /** Check if connected */
  isConnected?: () => boolean
}

/**
 * Context passed to recovery strategies
 */
export interface RecoveryContext {
  /** The error to recover from */
  readonly error: EIMZOError
  /** Client instance for recovery operations */
  readonly client: RecoveryClient
  /** Operation that was being performed */
  readonly operation: string
  /** Current recovery attempt number (1-based) */
  readonly attempt: number
  /** Maximum recovery attempts allowed */
  readonly maxAttempts: number
}

/**
 * Result of a recovery attempt
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  readonly recovered: boolean
  /** Whether the original operation should be retried */
  readonly shouldRetryOperation: boolean
  /** Optional message describing recovery outcome */
  readonly message?: string
}

/**
 * Interface for error recovery strategies
 */
export interface RecoveryStrategy {
  /** Unique name for this strategy */
  readonly name: string
  /** Error codes this strategy can handle */
  readonly handles: readonly ErrorCode[]
  /** Priority (higher = tried first) */
  readonly priority: number

  /**
   * Checks if this strategy can potentially recover from the error
   *
   * @param error - The error to check
   * @returns True if this strategy might be able to recover
   */
  canRecover: (error: EIMZOError) => boolean

  /**
   * Attempts to recover from the error
   *
   * @param context - Recovery context
   * @returns Recovery result
   */
  recover: (context: RecoveryContext) => Promise<RecoveryResult>
}
