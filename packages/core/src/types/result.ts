/**
 * Result Type for Non-Throwing API
 *
 * Provides a type-safe alternative to try/catch for error handling.
 * Inspired by Rust's Result type and functional programming patterns.
 *
 * @example
 * ```typescript
 * import { Result, ok, err, isOk, map } from '@eimzo/core';
 *
 * async function loadKey(cert: Certificate): Promise<Result<KeyId>> {
 *   try {
 *     const keyId = await client.loadKey(cert, password);
 *     return ok(keyId);
 *   } catch (e) {
 *     return err(createEIMZOError(ERROR_CODES.KEY_LOAD_ERROR, e.message));
 *   }
 * }
 *
 * const result = await loadKey(cert);
 * if (isOk(result)) {
 *   console.log('Key loaded:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */

import type { ErrorCode } from './error-codes';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Success result containing data
 */
export interface SuccessResult<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Failure result containing error
 */
export interface FailureResult<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Result type: either success with data or failure with error
 */
export type Result<T, E = EIMZOError> = SuccessResult<T> | FailureResult<E>;

/**
 * Error context information
 */
export interface ResultErrorContext {
  /** Operation that failed */
  operation?: string;
  /** Additional parameters */
  params?: Record<string, unknown>;
  /** Stack trace from original error */
  stack?: string;
}

/**
 * Structured error type for E-IMZO operations
 */
export interface EIMZOError {
  /** Error code for programmatic handling */
  readonly code: ErrorCode;
  /** Human-readable error message */
  readonly message: string;
  /** Additional context about the error */
  readonly context?: ResultErrorContext;
  /** Timestamp when error occurred */
  readonly timestamp: number;
  /** Original error if wrapping another error */
  readonly cause?: Error;
}

// ============================================================================
// Constructors
// ============================================================================

/**
 * Creates a success result
 *
 * @param data - Success value
 * @returns Success result
 *
 * @example
 * ```typescript
 * return ok({ keyId, certificate });
 * ```
 */
export function ok<T>(data: T): SuccessResult<T> {
  return { success: true, data };
}

/**
 * Creates a failure result
 *
 * @param error - Error value
 * @returns Failure result
 *
 * @example
 * ```typescript
 * return err(createEIMZOError(ERROR_CODES.TIMEOUT, 'Operation timed out'));
 * ```
 */
export function err<E>(error: E): FailureResult<E> {
  return { success: false, error };
}

/**
 * Options for creating an EIMZOError
 */
export interface CreateErrorOptions {
  /** Additional context */
  context?: ResultErrorContext;
  /** Original error that caused this error */
  cause?: Error;
}

/**
 * Creates a structured EIMZOError
 *
 * @param code - Error code
 * @param message - Human-readable message
 * @param options - Additional error options
 * @returns EIMZOError instance
 *
 * @example
 * ```typescript
 * const error = createEIMZOError(
 *   ERROR_CODES.CERTIFICATE_EXPIRED,
 *   'Certificate expired on 2024-01-01',
 *   { context: { operation: 'loadKey' } }
 * );
 * ```
 */
export function createEIMZOError(
  code: ErrorCode,
  message: string,
  options?: CreateErrorOptions
): EIMZOError {
  return {
    code,
    message,
    context: options?.context,
    timestamp: Date.now(),
    cause: options?.cause,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a result is a success
 *
 * @param result - Result to check
 * @returns True if result is success
 *
 * @example
 * ```typescript
 * if (isOk(result)) {
 *   // TypeScript knows result.data is available
 *   console.log(result.data);
 * }
 * ```
 */
export function isOk<T, E>(result: Result<T, E>): result is SuccessResult<T> {
  return result.success === true;
}

/**
 * Checks if a result is a failure
 *
 * @param result - Result to check
 * @returns True if result is failure
 *
 * @example
 * ```typescript
 * if (isErr(result)) {
 *   // TypeScript knows result.error is available
 *   console.error(result.error);
 * }
 * ```
 */
export function isErr<T, E>(result: Result<T, E>): result is FailureResult<E> {
  return result.success === false;
}

// ============================================================================
// Unwrap Functions
// ============================================================================

/**
 * Extracts the value from a success result or throws on failure
 *
 * @param result - Result to unwrap
 * @returns Success value
 * @throws Error if result is a failure
 *
 * @example
 * ```typescript
 * const keyId = unwrap(loadKeyResult); // throws if error
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data;
  }
  const error = result.error;
  if (error instanceof Error) {
    throw error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    throw new Error((error as { message: string }).message);
  }
  throw new Error(String(error));
}

/**
 * Extracts the value or returns a default on failure
 *
 * @param result - Result to unwrap
 * @param defaultValue - Value to return on failure
 * @returns Success value or default
 *
 * @example
 * ```typescript
 * const keyId = unwrapOr(loadKeyResult, null);
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue;
}

/**
 * Extracts the value or computes a default on failure
 *
 * @param result - Result to unwrap
 * @param fn - Function to compute default value from error
 * @returns Success value or computed default
 *
 * @example
 * ```typescript
 * const keyId = unwrapOrElse(result, (error) => {
 *   console.error('Error:', error);
 *   return fallbackKeyId;
 * });
 * ```
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  return isOk(result) ? result.data : fn(result.error);
}

/**
 * Extracts the error from a failure result or throws on success
 *
 * @param result - Result to unwrap
 * @returns Error value
 * @throws Error if result is a success
 *
 * @example
 * ```typescript
 * const error = unwrapErr(failedResult); // throws if success
 * ```
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (isErr(result)) {
    return result.error;
  }
  throw new Error('Called unwrapErr on a success result');
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transforms the success value if present
 *
 * @param result - Result to transform
 * @param fn - Transformation function
 * @returns New result with transformed value
 *
 * @example
 * ```typescript
 * const keyIdResult = map(loadKeyResult, (data) => data.keyId);
 * ```
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? ok(fn(result.data)) : result;
}

/**
 * Transforms the error value if present
 *
 * @param result - Result to transform
 * @param fn - Error transformation function
 * @returns New result with transformed error
 *
 * @example
 * ```typescript
 * const result = mapErr(loadKeyResult, (error) => ({
 *   ...error,
 *   context: { ...error.context, retryCount: 3 }
 * }));
 * ```
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/**
 * Chains operations that return Results
 *
 * @param result - Result to chain from
 * @param fn - Function returning a new Result
 * @returns Chained result
 *
 * @example
 * ```typescript
 * const signatureResult = andThen(loadKeyResult, async (keyId) => {
 *   return await signData(keyId, data);
 * });
 * ```
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.data) : result;
}

/**
 * Provides a fallback result on failure
 *
 * @param result - Result to check
 * @param fn - Function returning fallback result
 * @returns Original result if success, fallback otherwise
 *
 * @example
 * ```typescript
 * const result = orElse(primaryResult, () => {
 *   return loadFromCache();
 * });
 * ```
 */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  return isOk(result) ? result : fn(result.error);
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Converts a Promise to a Result
 *
 * @param promise - Promise to convert
 * @param errorMapper - Optional function to map errors to EIMZOError
 * @returns Promise of Result
 *
 * @example
 * ```typescript
 * const result = await fromPromise(
 *   client.loadKey(cert, password),
 *   (e) => createEIMZOError(ERROR_CODES.KEY_LOAD_ERROR, e.message, { cause: e })
 * );
 * ```
 */
export async function fromPromise<T>(
  promise: Promise<T>,
  errorMapper?: (error: unknown) => EIMZOError
): Promise<Result<T, EIMZOError>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error) {
    if (errorMapper) {
      return err(errorMapper(error));
    }
    const message = error instanceof Error ? error.message : String(error);
    return err(
      createEIMZOError('UNKNOWN_ERROR' as ErrorCode, message, {
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Converts a Result back to a Promise (throws on error)
 *
 * @param result - Result to convert
 * @returns Promise that resolves with data or rejects with error
 *
 * @example
 * ```typescript
 * try {
 *   const data = await toPromise(result);
 * } catch (error) {
 *   console.error(error);
 * }
 * ```
 */
export function toPromise<T, E extends Error | EIMZOError>(
  result: Result<T, E>
): Promise<T> {
  if (isOk(result)) {
    return Promise.resolve(result.data);
  }
  const error = result.error;
  if (error instanceof Error) {
    return Promise.reject(error);
  }
  return Promise.reject(new Error(error.message));
}

// ============================================================================
// Collection Utilities
// ============================================================================

/**
 * Combines multiple Results into a single Result
 *
 * @param results - Array of Results
 * @returns Single Result containing array of values, or first error
 *
 * @example
 * ```typescript
 * const results = await Promise.all([loadKey1(), loadKey2()]);
 * const combined = collect(results);
 * if (isOk(combined)) {
 *   const [key1, key2] = combined.data;
 * }
 * ```
 */
export function collect<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.data);
  }
  return ok(values);
}

/**
 * Partitions Results into successes and failures
 *
 * @param results - Array of Results
 * @returns Object with ok and err arrays
 *
 * @example
 * ```typescript
 * const { ok: successes, err: failures } = partition(results);
 * console.log(`${successes.length} succeeded, ${failures.length} failed`);
 * ```
 */
export function partition<T, E>(
  results: Result<T, E>[]
): { ok: T[]; err: E[] } {
  const okValues: T[] = [];
  const errValues: E[] = [];
  for (const result of results) {
    if (isOk(result)) {
      okValues.push(result.data);
    } else {
      errValues.push(result.error);
    }
  }
  return { ok: okValues, err: errValues };
}
