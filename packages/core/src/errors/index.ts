/**
 * Error Types Module
 *
 * Re-exports all error-related types and classes for E-IMZO SDK.
 *
 * @example
 * ```typescript
 * import { EIMZOError, AggregateSignError, executeBatch } from '@eimzo/core';
 * ```
 */

export {
  AggregateSignError,
  type BatchFailure,
  type BatchResult,
  executeBatch,
  type ExecuteBatchOptions,
} from './aggregate-error'
export { EIMZOError, type EIMZOErrorOptions, type ErrorContext } from './eimzo-error'
