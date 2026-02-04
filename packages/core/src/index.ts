/**
 * @eimzo/core - E-IMZO Digital Signature SDK Core Library
 *
 * Framework-agnostic core functionality for E-IMZO integration.
 *
 * @packageDocumentation
 */

// WebSocket client
export {
  CAPIWS,
  callFunctionAsync,
  versionAsync,
  apidocAsync,
  apikeyAsync,
} from "./capiws";
export type { WebSocketOperationOptions } from "./capiws";

// E-IMZO client
export { EIMZOClient } from "./client";

// Types
export * from "./types";

// i18n
export {
  i18n,
  setLocale,
  getLocale,
  getErrorMessage,
  getSupportedLocales,
  isLocaleSupported,
  detectAndSetBrowserLocale,
} from "./i18n";

// Utilities
export {
  detectEIMZO,
  getEIMZODownloadUrl,
  isEIMZOAvailable,
  getEIMZOWebSocketUrl,
} from "./utils/eimzo-detector";
export type { EIMZOStatus } from "./utils/eimzo-detector";

export {
  withTimeout,
  withRetry,
  withResilience,
  classifyError,
  isTransientError,
  calculateBackoffDelay,
  createCancellableDelay,
  isTimeoutError,
  isRetryExhaustedError,
  TimeoutError,
  RetryExhaustedError,
  DEFAULT_RESILIENCE_OPTIONS,
} from "./utils/resilience";
export type { ErrorType } from "./utils/resilience";
