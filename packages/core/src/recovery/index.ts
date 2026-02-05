/**
 * Error Recovery Module
 *
 * Provides error recovery strategies and execution for E-IMZO SDK.
 *
 * @example
 * ```typescript
 * import {
 *   RecoveryExecutor,
 *   DEFAULT_RECOVERY_STRATEGIES,
 *   reconnectStrategy,
 * } from '@eimzo/core';
 *
 * // Use default strategies
 * const executor = new RecoveryExecutor(DEFAULT_RECOVERY_STRATEGIES);
 *
 * // Or customize
 * const customExecutor = new RecoveryExecutor([
 *   reconnectStrategy,
 *   myCustomStrategy,
 * ]);
 * ```
 */

export type {
  RecoveryStrategy,
  RecoveryContext,
  RecoveryResult,
  RecoveryClient,
} from './types';

export { RecoveryExecutor, type RecoveryExecutorOptions } from './executor';

export {
  reconnectStrategy,
  certificateRefreshStrategy,
  versionCheckStrategy,
  DEFAULT_RECOVERY_STRATEGIES,
  createStrategy,
} from './strategies';
