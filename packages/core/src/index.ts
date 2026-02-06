/**
 * @eimzo/core - E-IMZO Digital Signature SDK Core Library
 *
 * Framework-agnostic core functionality for E-IMZO integration.
 *
 * @packageDocumentation
 */

// Adapters
export {
  BrowserWebSocketAdapter,
  MockWebSocketAdapter,
} from './adapters'
export type { WebSocketAdapter } from './adapters'

// WebSocket client
export {
  apidocAsync,
  apikeyAsync,
  callFunctionAsync,
  CAPIWS,
  versionAsync,
} from './capiws'

export type { WebSocketOperationOptions } from './capiws'

// E-IMZO client
export { EIMZOClient } from './client'

// Client Factory
export { createEIMZOClient, hasAdapter, hasEventEmitter } from './create-client'
export type { EIMZOClientConfig, EnhancedClient } from './create-client'

// Errors
export { AggregateSignError, EIMZOError, executeBatch } from './errors'
export type {
  BatchFailure,
  BatchResult,
  ErrorContext as EIMZOErrorContext,
  EIMZOErrorOptions,
  ExecuteBatchOptions,
} from './errors'

// Events
export { EIMZOEventEmitter } from './events'
export type { EIMZOEvents, ErrorContext } from './events'

// i18n
export {
  detectAndSetBrowserLocale,
  getErrorMessage,
  getLocale,
  getSupportedLocales,
  i18n,
  isLocaleSupported,
  setLocale,
} from './i18n'
// Middleware
export {
  analyticsMiddleware,
  cachingMiddleware,
  errorHandlingMiddleware,
  loggingMiddleware,
  MiddlewareExecutor,
  performanceMiddleware,
  transformMiddleware,
} from './middleware'

export type { Middleware, MiddlewareContext } from './middleware'
// Recovery
export {
  certificateRefreshStrategy,
  createStrategy,
  DEFAULT_RECOVERY_STRATEGIES,
  reconnectStrategy,
  RecoveryExecutor,
  versionCheckStrategy,
} from './recovery'

export type {
  RecoveryClient,
  RecoveryContext,
  RecoveryExecutorOptions,
  RecoveryResult,
  RecoveryStrategy,
} from './recovery'
// Types
export * from './types'

// Utilities
export {
  detectEIMZO,
  getEIMZODownloadUrl,
  getEIMZOWebSocketUrl,
  isEIMZOAvailable,
} from './utils/eimzo-detector'
export type { EIMZOStatus } from './utils/eimzo-detector'

export {
  calculateBackoffDelay,
  classifyError,
  createCancellableDelay,
  DEFAULT_RESILIENCE_OPTIONS,
  isRetryExhaustedError,
  isTimeoutError,
  isTransientError,
  RetryExhaustedError,
  TimeoutError,
  withResilience,
  withRetry,
  withTimeout,
} from './utils/resilience'
export type { ErrorType } from './utils/resilience'
