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

export { EIMZOError, type ErrorContext, type EIMZOErrorOptions } from './eimzo-error';
export {
  AggregateSignError,
  executeBatch,
  type BatchFailure,
  type BatchResult,
  type ExecuteBatchOptions,
} from './aggregate-error';
