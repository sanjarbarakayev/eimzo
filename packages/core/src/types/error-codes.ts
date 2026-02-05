/**
 * Type-safe Error Codes for E-IMZO SDK
 *
 * Uses const assertions to provide compile-time type safety for error handling.
 * Error codes are categorized for easy classification and retry logic.
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, isRetryableCode } from '@eimzo/core';
 *
 * if (isRetryableCode(error.code)) {
 *   // Retry the operation
 * }
 * ```
 */

// ============================================================================
// Error Code Constants
// ============================================================================

/**
 * All error codes used in the E-IMZO SDK
 * Using const assertion for literal types
 */
export const ERROR_CODES = {
  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_LOST: 'CONNECTION_LOST',
  TIMEOUT: 'TIMEOUT',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',

  // Authentication errors
  WRONG_PASSWORD: 'WRONG_PASSWORD',

  // Certificate errors
  CERTIFICATE_NOT_FOUND: 'CERTIFICATE_NOT_FOUND',
  CERTIFICATE_EXPIRED: 'CERTIFICATE_EXPIRED',
  CERTIFICATE_NOT_YET_VALID: 'CERTIFICATE_NOT_YET_VALID',
  KEY_LOAD_ERROR: 'KEY_LOAD_ERROR',

  // Device errors
  NO_READER: 'NO_READER',
  CARD_NOT_FOUND: 'CARD_NOT_FOUND',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',

  // Application errors
  EIMZO_NOT_INSTALLED: 'EIMZO_NOT_INSTALLED',
  VERSION_OUTDATED: 'VERSION_OUTDATED',
  VERSION_UNDEFINED: 'VERSION_UNDEFINED',
  CRYPTO_API_ERROR: 'CRYPTO_API_ERROR',

  // Signing errors
  SIGNING_ERROR: 'SIGNING_ERROR',

  // Browser errors
  WEBSOCKET_NOT_SUPPORTED: 'WEBSOCKET_NOT_SUPPORTED',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Union type of all error codes
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// Error Code Categories
// ============================================================================

/**
 * Errors that may resolve on retry
 */
export const RETRYABLE_ERROR_CODES = [
  ERROR_CODES.CONNECTION_FAILED,
  ERROR_CODES.CONNECTION_LOST,
  ERROR_CODES.TIMEOUT,
] as const;

/**
 * Connection-related errors
 */
export const CONNECTION_ERROR_CODES = [
  ERROR_CODES.CONNECTION_FAILED,
  ERROR_CODES.CONNECTION_LOST,
  ERROR_CODES.TIMEOUT,
  ERROR_CODES.RETRY_EXHAUSTED,
  ERROR_CODES.WEBSOCKET_NOT_SUPPORTED,
] as const;

/**
 * Certificate-related errors
 */
export const CERTIFICATE_ERROR_CODES = [
  ERROR_CODES.CERTIFICATE_NOT_FOUND,
  ERROR_CODES.CERTIFICATE_EXPIRED,
  ERROR_CODES.CERTIFICATE_NOT_YET_VALID,
  ERROR_CODES.KEY_LOAD_ERROR,
] as const;

/**
 * Device-related errors (hardware tokens, readers)
 */
export const DEVICE_ERROR_CODES = [
  ERROR_CODES.NO_READER,
  ERROR_CODES.CARD_NOT_FOUND,
  ERROR_CODES.DEVICE_NOT_FOUND,
] as const;

/**
 * Application-level errors (E-IMZO installation, version)
 */
export const APPLICATION_ERROR_CODES = [
  ERROR_CODES.EIMZO_NOT_INSTALLED,
  ERROR_CODES.VERSION_OUTDATED,
  ERROR_CODES.VERSION_UNDEFINED,
  ERROR_CODES.CRYPTO_API_ERROR,
] as const;

// ============================================================================
// Category Type Guards
// ============================================================================

type RetryableErrorCode = typeof RETRYABLE_ERROR_CODES[number];
type ConnectionErrorCode = typeof CONNECTION_ERROR_CODES[number];
type CertificateErrorCode = typeof CERTIFICATE_ERROR_CODES[number];
type DeviceErrorCode = typeof DEVICE_ERROR_CODES[number];
type ApplicationErrorCode = typeof APPLICATION_ERROR_CODES[number];

/**
 * Checks if an error code is retryable
 *
 * @param code - Error code to check
 * @returns True if the error may resolve on retry
 *
 * @example
 * ```typescript
 * if (isRetryableCode(error.code)) {
 *   await sleep(1000);
 *   return retry();
 * }
 * ```
 */
export function isRetryableCode(code: ErrorCode): code is RetryableErrorCode {
  return (RETRYABLE_ERROR_CODES as readonly ErrorCode[]).includes(code);
}

/**
 * Checks if an error code is connection-related
 *
 * @param code - Error code to check
 * @returns True if the error is connection-related
 */
export function isConnectionErrorCode(code: ErrorCode): code is ConnectionErrorCode {
  return (CONNECTION_ERROR_CODES as readonly ErrorCode[]).includes(code);
}

/**
 * Checks if an error code is certificate-related
 *
 * @param code - Error code to check
 * @returns True if the error is certificate-related
 */
export function isCertificateErrorCode(code: ErrorCode): code is CertificateErrorCode {
  return (CERTIFICATE_ERROR_CODES as readonly ErrorCode[]).includes(code);
}

/**
 * Checks if an error code is device-related
 *
 * @param code - Error code to check
 * @returns True if the error is device-related
 */
export function isDeviceErrorCode(code: ErrorCode): code is DeviceErrorCode {
  return (DEVICE_ERROR_CODES as readonly ErrorCode[]).includes(code);
}

/**
 * Checks if an error code is application-related
 *
 * @param code - Error code to check
 * @returns True if the error is application-related
 */
export function isApplicationErrorCode(code: ErrorCode): code is ApplicationErrorCode {
  return (APPLICATION_ERROR_CODES as readonly ErrorCode[]).includes(code);
}

// ============================================================================
// Error Code Metadata
// ============================================================================

/**
 * Human-readable descriptions for error codes
 * Useful for logging and debugging
 */
export const ERROR_CODE_DESCRIPTIONS: Record<ErrorCode, string> = {
  [ERROR_CODES.CONNECTION_FAILED]: 'Failed to establish WebSocket connection',
  [ERROR_CODES.CONNECTION_LOST]: 'WebSocket connection was lost',
  [ERROR_CODES.TIMEOUT]: 'Operation timed out',
  [ERROR_CODES.RETRY_EXHAUSTED]: 'All retry attempts exhausted',
  [ERROR_CODES.WRONG_PASSWORD]: 'Incorrect password provided',
  [ERROR_CODES.CERTIFICATE_NOT_FOUND]: 'Certificate not found',
  [ERROR_CODES.CERTIFICATE_EXPIRED]: 'Certificate has expired',
  [ERROR_CODES.CERTIFICATE_NOT_YET_VALID]: 'Certificate is not yet valid',
  [ERROR_CODES.KEY_LOAD_ERROR]: 'Failed to load key',
  [ERROR_CODES.NO_READER]: 'No card reader detected',
  [ERROR_CODES.CARD_NOT_FOUND]: 'Smart card not found in reader',
  [ERROR_CODES.DEVICE_NOT_FOUND]: 'Device not found',
  [ERROR_CODES.EIMZO_NOT_INSTALLED]: 'E-IMZO application is not installed',
  [ERROR_CODES.VERSION_OUTDATED]: 'E-IMZO version is outdated',
  [ERROR_CODES.VERSION_UNDEFINED]: 'E-IMZO version could not be determined',
  [ERROR_CODES.CRYPTO_API_ERROR]: 'Crypto API error occurred',
  [ERROR_CODES.SIGNING_ERROR]: 'Signing operation failed',
  [ERROR_CODES.WEBSOCKET_NOT_SUPPORTED]: 'WebSocket not supported in browser',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred',
};

/**
 * Gets a human-readable description for an error code
 *
 * @param code - Error code
 * @returns Human-readable description
 */
export function getErrorDescription(code: ErrorCode): string {
  return ERROR_CODE_DESCRIPTIONS[code];
}
