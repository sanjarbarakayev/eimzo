/**
 * Structured Error Types for E-IMZO SDK
 *
 * Provides rich error context, correlation IDs for tracing, and JSON serialization.
 *
 * @example
 * ```typescript
 * import { EIMZOError, ERROR_CODES } from '@eimzo/core';
 *
 * try {
 *   await client.signData(keyId, data);
 * } catch (e) {
 *   const error = EIMZOError.from(e, { operation: 'signData', keyId });
 *   console.error(error.toJSON());
 * }
 * ```
 */

import type { ErrorCode } from '../types/error-codes'
import { ERROR_CODES, getErrorDescription } from '../types/error-codes'

// ============================================================================
// Types
// ============================================================================

/**
 * Rich context information for error tracking and debugging
 */
export interface ErrorContext {
  /** Operation that was being performed when error occurred */
  readonly operation: string
  /** Parameters passed to the operation */
  readonly params?: Record<string, unknown>
  /** Serial number of certificate involved */
  readonly certificateSerialNumber?: string
  /** Key ID if a key was loaded */
  readonly keyId?: string
  /** Current retry attempt number */
  readonly retryAttempt?: number
  /** Additional metadata for debugging */
  readonly metadata?: Record<string, unknown>
}

/**
 * Options for creating an EIMZOError
 */
export interface EIMZOErrorOptions {
  /** Error context */
  readonly context?: Partial<ErrorContext>
  /** Original error that caused this error */
  readonly cause?: Error
  /** Correlation ID for distributed tracing (auto-generated if not provided) */
  readonly correlationId?: string
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a unique correlation ID for error tracing
 */
function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `eimzo-${timestamp}-${random}`
}

/**
 * Extracts error code from an unknown error
 */
function extractErrorCode(error: unknown): ErrorCode {
  if (error instanceof EIMZOError) {
    return error.code
  }
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    if (Object.values(ERROR_CODES).includes(code as ErrorCode)) {
      return code as ErrorCode
    }
  }
  return ERROR_CODES.UNKNOWN_ERROR
}

/**
 * Extracts error message from an unknown error
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (
    typeof error === 'object'
    && error !== null
    && 'message' in error
    && typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return 'An unknown error occurred'
}

// ============================================================================
// EIMZOError Class
// ============================================================================

/**
 * Structured error class for E-IMZO SDK operations
 *
 * Features:
 * - Type-safe error codes
 * - Rich context information
 * - Correlation IDs for distributed tracing
 * - JSON serialization for logging
 * - Immutable context extension via withContext()
 *
 * @example
 * ```typescript
 * // Create directly
 * const error = new EIMZOError(
 *   ERROR_CODES.CERTIFICATE_EXPIRED,
 *   'Certificate expired on 2024-01-01',
 *   { context: { operation: 'signData', certificateSerialNumber: '123' } }
 * );
 *
 * // Create from unknown error
 * const wrapped = EIMZOError.from(caughtError, { operation: 'loadKey' });
 *
 * // Add context immutably
 * const withRetry = error.withContext({ retryAttempt: 2 });
 * ```
 */
export class EIMZOError extends Error {
  /** Error code for programmatic handling */
  readonly code: ErrorCode

  /** Rich context about the error */
  readonly context: ErrorContext

  /** Timestamp when error was created */
  readonly timestamp: Date

  /** Unique ID for tracing this error through systems */
  readonly correlationId: string

  /** Original error that caused this error */
  readonly cause?: Error

  constructor(
    code: ErrorCode,
    message: string,
    options?: EIMZOErrorOptions,
  ) {
    super(message)

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, EIMZOError.prototype)

    this.name = 'EIMZOError'
    this.code = code
    this.timestamp = new Date()
    this.correlationId = options?.correlationId ?? generateCorrelationId()
    this.cause = options?.cause

    // Build context with default operation if not provided
    this.context = {
      operation: options?.context?.operation ?? 'unknown',
      ...options?.context,
    }

    // Capture stack trace (V8 specific feature)
    const ErrorWithCapture = Error as typeof Error & {
      captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void
    }
    if (typeof ErrorWithCapture.captureStackTrace === 'function') {
      ErrorWithCapture.captureStackTrace(this, EIMZOError)
    }
  }

  /**
   * Creates a new EIMZOError with additional context
   * Original error is not mutated
   *
   * @param ctx - Additional context to merge
   * @returns New EIMZOError with merged context
   */
  withContext(ctx: Partial<ErrorContext>): EIMZOError {
    const mergedContext: Partial<ErrorContext> = {
      ...this.context,
      ...ctx,
      // Deep merge metadata if both exist
      metadata:
        ctx.metadata || this.context.metadata
          ? { ...this.context.metadata, ...ctx.metadata }
          : undefined,
    }

    const newError = new EIMZOError(this.code, this.message, {
      context: mergedContext,
      cause: this.cause,
      correlationId: this.correlationId,
    });

    // Preserve original timestamp
    (newError as { timestamp: Date }).timestamp = this.timestamp

    return newError
  }

  /**
   * Serializes the error to a plain object for logging
   *
   * @returns JSON-serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      description: getErrorDescription(this.code),
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
      stack: this.stack,
    }
  }

  /**
   * Creates an EIMZOError from an unknown error
   *
   * @param error - Any error value
   * @param ctx - Optional context to add
   * @returns EIMZOError instance
   *
   * @example
   * ```typescript
   * try {
   *   await riskyOperation();
   * } catch (e) {
   *   throw EIMZOError.from(e, { operation: 'riskyOperation' });
   * }
   * ```
   */
  static from(error: unknown, ctx?: Partial<ErrorContext>): EIMZOError {
    // If already an EIMZOError, optionally add context
    if (error instanceof EIMZOError) {
      return ctx ? error.withContext(ctx) : error
    }

    const code = extractErrorCode(error)
    const message = extractErrorMessage(error)
    const cause = error instanceof Error ? error : undefined

    return new EIMZOError(code, message, {
      context: ctx,
      cause,
    })
  }

  /**
   * Type guard to check if a value is an EIMZOError
   *
   * @param error - Value to check
   * @returns True if the value is an EIMZOError
   */
  static isEIMZOError(error: unknown): error is EIMZOError {
    return error instanceof EIMZOError
  }
}
