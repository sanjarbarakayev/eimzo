/**
 * Recovery Executor
 *
 * Orchestrates error recovery by trying applicable strategies in priority order.
 *
 * @example
 * ```typescript
 * import { RecoveryExecutor, DEFAULT_RECOVERY_STRATEGIES } from '@eimzo/core';
 *
 * const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES);
 *
 * try {
 *   await client.signData(keyId, data);
 * } catch (error) {
 *   const eimzoError = EIMZOError.from(error, { operation: 'signData' });
 *   const result = await executor.attemptRecovery(eimzoError, client, 'signData');
 *
 *   if (result.shouldRetryOperation) {
 *     // Retry the operation
 *     await client.signData(keyId, data);
 *   }
 * }
 * ```
 */

import type { EIMZOError } from '../errors/eimzo-error';
import type {
  RecoveryStrategy,
  RecoveryContext,
  RecoveryResult,
  RecoveryClient,
} from './types';

/**
 * Options for recovery executor
 */
export interface RecoveryExecutorOptions {
  /** Maximum recovery attempts per error (default: 3) */
  readonly maxAttempts?: number;
}

/**
 * Orchestrates error recovery using registered strategies
 */
export class RecoveryExecutor {
  private readonly strategies: readonly RecoveryStrategy[];
  private readonly maxAttempts: number;

  constructor(
    strategies: readonly RecoveryStrategy[],
    options?: RecoveryExecutorOptions
  ) {
    // Sort by priority (highest first) and freeze
    this.strategies = [...strategies].sort((a, b) => b.priority - a.priority);
    this.maxAttempts = options?.maxAttempts ?? 3;
  }

  /**
   * Finds strategies that can handle the given error
   *
   * @param error - The error to find strategies for
   * @returns Applicable strategies sorted by priority
   */
  findApplicableStrategies(error: EIMZOError): readonly RecoveryStrategy[] {
    return this.strategies.filter((strategy) => strategy.canRecover(error));
  }

  /**
   * Attempts to recover from an error using registered strategies
   *
   * Tries each applicable strategy in priority order until one succeeds
   * or all strategies are exhausted.
   *
   * @param error - The error to recover from
   * @param client - Client instance for recovery operations
   * @param operation - Name of the operation that failed
   * @returns Recovery result
   */
  async attemptRecovery(
    error: EIMZOError,
    client: RecoveryClient,
    operation: string
  ): Promise<RecoveryResult> {
    const applicableStrategies = this.findApplicableStrategies(error);

    if (applicableStrategies.length === 0) {
      return {
        recovered: false,
        shouldRetryOperation: false,
        message: `No recovery strategy found for error code: ${error.code}`,
      };
    }

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      for (const strategy of applicableStrategies) {
        const context: RecoveryContext = {
          error,
          client,
          operation,
          attempt,
          maxAttempts: this.maxAttempts,
        };

        try {
          const result = await strategy.recover(context);

          if (result.recovered || result.shouldRetryOperation) {
            return {
              ...result,
              message: `[${strategy.name}] ${result.message ?? 'Recovery succeeded'}`,
            };
          }

          // Strategy indicated recovery is not possible for this error
          if (!result.recovered && !result.shouldRetryOperation) {
            // Continue to next strategy
            continue;
          }
        } catch (strategyError) {
          // Strategy threw an error, try next strategy
          continue;
        }
      }
    }

    return {
      recovered: false,
      shouldRetryOperation: false,
      message: `All recovery attempts exhausted after ${this.maxAttempts} attempts`,
    };
  }

  /**
   * Checks if any strategy can potentially recover from the error
   *
   * @param error - The error to check
   * @returns True if at least one strategy can handle the error
   */
  canAttemptRecovery(error: EIMZOError): boolean {
    return this.findApplicableStrategies(error).length > 0;
  }

  /**
   * Gets strategy names that can handle the given error
   *
   * @param error - The error to check
   * @returns Array of strategy names
   */
  getApplicableStrategyNames(error: EIMZOError): readonly string[] {
    return this.findApplicableStrategies(error).map((s) => s.name);
  }
}
