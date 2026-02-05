/**
 * Aggregate Error Types for Batch Operations
 *
 * Provides structured error handling for batch signing and bulk operations.
 *
 * @example
 * ```typescript
 * import { executeBatch, AggregateSignError } from '@eimzo/core';
 *
 * const result = await executeBatch(documents, async (doc, index) => {
 *   return client.signData(keyId, doc.data);
 * });
 *
 * if (!result.allSucceeded) {
 *   console.log(`${result.failures.length} documents failed to sign`);
 * }
 * ```
 */

import { ERROR_CODES, type ErrorCode } from '../types/error-codes';
import { EIMZOError, type ErrorContext } from './eimzo-error';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a single failure in a batch operation
 */
export interface BatchFailure<TItem = unknown> {
  /** Index of the failed item in the original array */
  readonly index: number;
  /** The item that failed */
  readonly item: TItem;
  /** The error that occurred */
  readonly error: EIMZOError;
}

/**
 * Result of a batch operation containing successes and failures
 */
export interface BatchResult<TSuccess, TItem = unknown> {
  /** Successful results in order of completion */
  readonly successes: readonly TSuccess[];
  /** Failed items with their errors */
  readonly failures: readonly BatchFailure<TItem>[];
  /** True if all items succeeded */
  readonly allSucceeded: boolean;
  /** True if all items failed */
  readonly allFailed: boolean;
  /** Total number of items processed */
  readonly total: number;
}

/**
 * Options for executeBatch function
 */
export interface ExecuteBatchOptions {
  /** Stop on first error instead of collecting all errors */
  readonly stopOnFirstError?: boolean;
  /** Correlation ID for tracing the entire batch operation */
  readonly correlationId?: string;
}

// ============================================================================
// AggregateSignError Class
// ============================================================================

/**
 * Aggregate error for batch signing operations
 *
 * Collects multiple signing failures while preserving successful signatures.
 * Useful for partial failure scenarios where some documents sign successfully.
 *
 * @example
 * ```typescript
 * try {
 *   await signAllDocuments(docs);
 * } catch (e) {
 *   if (e instanceof AggregateSignError) {
 *     console.log(`${e.successfulSignatures.length} succeeded`);
 *     console.log(`${e.failures.length} failed`);
 *   }
 * }
 * ```
 */
export class AggregateSignError extends EIMZOError {
  /** Individual signing failures */
  readonly failures: readonly BatchFailure<string>[];

  /** Signatures that were successfully created */
  readonly successfulSignatures: readonly string[];

  constructor(
    message: string,
    failures: readonly BatchFailure<string>[],
    successfulSignatures: readonly string[],
    options?: {
      readonly context?: Partial<ErrorContext>;
      readonly correlationId?: string;
    }
  ) {
    super(ERROR_CODES.SIGNING_ERROR, message, {
      context: {
        operation: 'batchSign',
        ...options?.context,
        metadata: {
          ...options?.context?.metadata,
          failureCount: failures.length,
          successCount: successfulSignatures.length,
          totalCount: failures.length + successfulSignatures.length,
        },
      },
      correlationId: options?.correlationId,
    });

    // Set prototype for proper instanceof checks
    Object.setPrototypeOf(this, AggregateSignError.prototype);

    this.name = 'AggregateSignError';
    this.failures = failures;
    this.successfulSignatures = successfulSignatures;
  }

  /**
   * Converts the aggregate error to a BatchResult
   *
   * @returns BatchResult representing the partial failure
   */
  toBatchResult(): BatchResult<string, string> {
    const total = this.failures.length + this.successfulSignatures.length;
    return {
      successes: this.successfulSignatures,
      failures: this.failures,
      allSucceeded: this.failures.length === 0,
      allFailed: this.successfulSignatures.length === 0,
      total,
    };
  }

  /**
   * Creates a user-friendly summary message
   */
  getSummary(): string {
    const total = this.failures.length + this.successfulSignatures.length;
    return `Batch signing partially failed: ${this.successfulSignatures.length}/${total} succeeded, ${this.failures.length}/${total} failed`;
  }

  /**
   * Gets failure indices for debugging
   */
  getFailedIndices(): readonly number[] {
    return this.failures.map((f) => f.index);
  }

  /**
   * Overrides toJSON to include aggregate-specific data
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      failures: this.failures.map((f) => ({
        index: f.index,
        item: f.item,
        error: f.error.toJSON(),
      })),
      successfulSignatures: this.successfulSignatures,
      summary: this.getSummary(),
    };
  }

  /**
   * Type guard for AggregateSignError
   */
  static isAggregateSignError(error: unknown): error is AggregateSignError {
    return error instanceof AggregateSignError;
  }
}

// ============================================================================
// Batch Execution Utility
// ============================================================================

/**
 * Generates a unique batch correlation ID
 */
function generateBatchCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `batch-${timestamp}-${random}`;
}

/**
 * Executes a batch operation, collecting successes and failures
 *
 * @param items - Items to process
 * @param operation - Async operation to perform on each item
 * @param options - Batch execution options
 * @returns BatchResult with successes and failures
 *
 * @example
 * ```typescript
 * // Process all items, collecting failures
 * const result = await executeBatch(
 *   documents,
 *   async (doc, index) => {
 *     return await signDocument(doc);
 *   }
 * );
 *
 * // Stop on first error
 * const result = await executeBatch(
 *   documents,
 *   async (doc) => signDocument(doc),
 *   { stopOnFirstError: true }
 * );
 * ```
 */
export async function executeBatch<TItem, TResult>(
  items: readonly TItem[],
  operation: (item: TItem, index: number) => Promise<TResult>,
  options?: ExecuteBatchOptions
): Promise<BatchResult<TResult, TItem>> {
  const correlationId = options?.correlationId ?? generateBatchCorrelationId();
  const successes: TResult[] = [];
  const failures: BatchFailure<TItem>[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    try {
      const result = await operation(item, index);
      successes.push(result);
    } catch (error) {
      const eimzoError = EIMZOError.from(error, {
        operation: 'batchItem',
        metadata: {
          batchIndex: index,
          batchCorrelationId: correlationId,
        },
      });

      failures.push({
        index,
        item,
        error: eimzoError,
      });

      if (options?.stopOnFirstError) {
        break;
      }
    }
  }

  return {
    successes,
    failures,
    allSucceeded: failures.length === 0,
    allFailed: successes.length === 0 && items.length > 0,
    total: items.length,
  };
}
