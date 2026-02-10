/**
 * Type Safety Module Index
 *
 * Re-exports all type safety primitives for E-IMZO SDK.
 *
 * @example
 * ```typescript
 * import {
 *   KeyId,
 *   CertificateId,
 *   createKeyId,
 *   Result,
 *   ok,
 *   err,
 *   ERROR_CODES,
 * } from '@eimzo/core';
 * ```
 */

// Branded types (class-based nominal types)
export {
  BrandedTypeError,
  CertificateId,
  createCertificateId,
  createKeyId,
  isValidCertificateId,
  isValidKeyId,
  KeyId,
  parseCertificateId,
  unwrapBrand,
} from './branded'

// Error codes
export {
  APPLICATION_ERROR_CODES,
  CERTIFICATE_ERROR_CODES,
  CONNECTION_ERROR_CODES,
  DEVICE_ERROR_CODES,
  ERROR_CODE_DESCRIPTIONS,
  ERROR_CODES,
  type ErrorCode,
  getErrorDescription,
  isApplicationErrorCode,
  isCertificateErrorCode,
  isConnectionErrorCode,
  isDeviceErrorCode,
  isRetryableCode,
  RETRYABLE_ERROR_CODES,
} from './error-codes'

// Result type
export {
  andThen,
  collect,
  createEIMZOError,
  type CreateErrorOptions,
  type EIMZOError,
  err,
  type FailureResult,
  fromPromise,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  orElse,
  partition,
  type Result,
  type ResultErrorContext,
  type SuccessResult,
  toPromise,
  unwrap,
  unwrapErr,
  unwrapOr,
  unwrapOrElse,
} from './result'
