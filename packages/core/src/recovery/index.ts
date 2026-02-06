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

export { RecoveryExecutor, type RecoveryExecutorOptions } from './executor'

export {
  certificateRefreshStrategy,
  createStrategy,
  DEFAULT_RECOVERY_STRATEGIES,
  reconnectStrategy,
  versionCheckStrategy,
} from './strategies'

export type {
  RecoveryClient,
  RecoveryContext,
  RecoveryResult,
  RecoveryStrategy,
} from './types'
