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
  KeyId,
  CertificateId,
  BrandedTypeError,
  createKeyId,
  createCertificateId,
  isValidKeyId,
  isValidCertificateId,
  unwrapBrand,
  parseCertificateId,
} from './branded';

// Error codes
export {
  ERROR_CODES,
  type ErrorCode,
  RETRYABLE_ERROR_CODES,
  CONNECTION_ERROR_CODES,
  CERTIFICATE_ERROR_CODES,
  DEVICE_ERROR_CODES,
  APPLICATION_ERROR_CODES,
  isRetryableCode,
  isConnectionErrorCode,
  isCertificateErrorCode,
  isDeviceErrorCode,
  isApplicationErrorCode,
  ERROR_CODE_DESCRIPTIONS,
  getErrorDescription,
} from './error-codes';

// Result type
export {
  type Result,
  type SuccessResult,
  type FailureResult,
  type EIMZOError,
  type ResultErrorContext,
  type CreateErrorOptions,
  ok,
  err,
  createEIMZOError,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  unwrapErr,
  map,
  mapErr,
  andThen,
  orElse,
  fromPromise,
  toPromise,
  collect,
  partition,
} from './result';
