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

// Events
export { EIMZOEventEmitter } from "./events";
export type { EIMZOEvents, ErrorContext } from "./events";

// Middleware
export {
  MiddlewareExecutor,
  loggingMiddleware,
  analyticsMiddleware,
  performanceMiddleware,
  cachingMiddleware,
  transformMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
export type { Middleware, MiddlewareContext } from "./middleware";

// Adapters
export {
  BrowserWebSocketAdapter,
  MockWebSocketAdapter,
} from "./adapters";
export type { WebSocketAdapter } from "./adapters";

// Client Factory
export { createEIMZOClient, hasEventEmitter, hasAdapter } from "./create-client";
export type { EIMZOClientConfig, EnhancedClient } from "./create-client";

// Errors
export { EIMZOError, AggregateSignError, executeBatch } from "./errors";
export type {
  ErrorContext as EIMZOErrorContext,
  EIMZOErrorOptions,
  BatchFailure,
  BatchResult,
  ExecuteBatchOptions,
} from "./errors";

// Recovery
export {
  RecoveryExecutor,
  reconnectStrategy,
  certificateRefreshStrategy,
  versionCheckStrategy,
  DEFAULT_RECOVERY_STRATEGIES,
  createStrategy,
} from "./recovery";
export type {
  RecoveryStrategy,
  RecoveryContext,
  RecoveryResult,
  RecoveryClient,
  RecoveryExecutorOptions,
} from "./recovery";
