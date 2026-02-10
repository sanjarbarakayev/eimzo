/**
 * Client Factory for E-IMZO
 * Creates a fully configured E-IMZO client with middleware, adapters, and events
 */

import type { WebSocketAdapter } from './adapters/websocket-adapter'
import type { ESignatureOptions } from './types'

/**
 * Configuration for creating an E-IMZO client
 */
export interface EIMZOClientConfig extends ESignatureOptions {
  /**
   * WebSocket adapter for connection management
   * Defaults to BrowserWebSocketAdapter
   *
   * @example
   * ```typescript
   * // Use mock adapter for testing
   * const mockAdapter = new MockWebSocketAdapter();
   * const client = createEIMZOClient({ adapter: mockAdapter });
   * ```
   */
  adapter?: WebSocketAdapter

  /**
   * API keys for domain authorization
   * Will be installed automatically when client is created
   *
   * @example
   * ```typescript
   * const client = createEIMZOClient({
   *   apiKeys: ['localhost', 'your-api-key', '127.0.0.1', 'another-key']
   * });
   * ```
   */
  apiKeys?: string[]
}

/**
 * Enhanced E-IMZO Client interface returned by factory
 * Combines ESignature methods with event emitter access
 */
export interface EnhancedClient {
  // Event emitter methods (if events enabled)
  on?: <K extends string>(event: K, handler: (data: unknown) => void) => void
  once?: <K extends string>(event: K, handler: (data: unknown) => void) => void
  off?: <K extends string>(event: K, handler: (data: unknown) => void) => void

  // Adapter access (for advanced use)
  adapter?: WebSocketAdapter

  // ESignature methods will be spread here
  [key: string]: unknown
}

/**
 * Create a configured E-IMZO client
 *
 * This factory function provides a modern, composable way to create E-IMZO clients
 * with middleware, custom adapters, and event emitters.
 *
 * @param config - Client configuration
 * @throws Always throws - this is a placeholder. Use framework-specific implementations.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const client = createEIMZOClient();
 * await client.checkVersion();
 * ```
 *
 * @example
 * ```typescript
 * // With middleware
 * import { createEIMZOClient, loggingMiddleware } from '@eimzo/core';
 *
 * const client = createEIMZOClient({
 *   middleware: [
 *     loggingMiddleware,
 *     async (ctx, next) => {
 *       console.log(`Operation: ${ctx.operation}`);
 *       return next();
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With events
 * const client = createEIMZOClient({
 *   enableEvents: true
 * });
 *
 * client.on('sign:complete', ({ signature }) => {
 *   console.log('Signed!', signature);
 * });
 *
 * await client.createPkcs7(keyId, data);
 * ```
 *
 * @example
 * ```typescript
 * // With mock adapter for testing
 * import { createEIMZOClient, MockWebSocketAdapter } from '@eimzo/core';
 *
 * const mockAdapter = new MockWebSocketAdapter();
 * mockAdapter.mockResponses.set('version', {
 *   success: true,
 *   major: '3',
 *   minor: '37'
 * });
 *
 * const client = createEIMZOClient({
 *   adapter: mockAdapter
 * });
 *
 * await client.checkVersion(); // Uses mock response
 * ```
 *
 * @example
 * ```typescript
 * // Complete configuration
 * const client = createEIMZOClient({
 *   timeout: 15000,
 *   enableRetry: true,
 *   maxRetries: 3,
 *   enableEvents: true,
 *   middleware: [
 *     loggingMiddleware,
 *     performanceMiddleware(3000)
 *   ],
 *   adapter: new BrowserWebSocketAdapter(),
 *   apiKeys: ['localhost', 'your-key'],
 *   onRetry: (operation, attempt, error) => {
 *     console.log(`Retry ${operation}: attempt ${attempt}`);
 *   }
 * });
 * ```
 */
export function createEIMZOClient(_config: EIMZOClientConfig = {}): never {
  // NOTE: We can't import ESignature here due to circular dependency
  // The actual implementation will be in a separate file or users should use
  // the integration in @eimzo/vue or other framework packages

  // This is a placeholder that demonstrates the intended API
  // The actual implementation will be in framework-specific packages
  throw new Error(
    'createEIMZOClient is a placeholder. Use framework-specific implementations like @eimzo/vue',
  )
}

/**
 * Type guard to check if client has event emitter
 */
export function hasEventEmitter(
  client: unknown,
): client is EnhancedClient & {
  on: NonNullable<EnhancedClient['on']>
  once: NonNullable<EnhancedClient['once']>
  off: NonNullable<EnhancedClient['off']>
} {
  return typeof client === 'object' && client !== null && 'on' in client && typeof (client as Record<string, unknown>).on === 'function'
}

/**
 * Type guard to check if client has adapter
 */
export function hasAdapter(
  client: unknown,
): client is EnhancedClient & { adapter: WebSocketAdapter } {
  return typeof client === 'object' && client !== null && 'adapter' in client && (client as Record<string, unknown>).adapter !== undefined
}
