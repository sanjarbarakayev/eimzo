/**
 * Vue E-IMZO Client Factory
 * Creates a fully configured E-IMZO client with middleware, adapters, and events
 */

import type { EIMZOClientConfig } from '@eimzo/core'
import { ESignature } from './eimzo'

/**
 * Create a configured E-IMZO client for Vue applications
 *
 * This factory function provides a modern, composable way to create E-IMZO clients
 * with middleware, custom adapters, and event emitters.
 *
 * @param config - Client configuration
 * @returns Configured E-IMZO client with event emitter methods
 *
 * @example
 * ```typescript
 * // Basic usage
 * import { createEIMZOClient } from '@eimzo/vue';
 *
 * const client = createEIMZOClient();
 * await client.checkVersion();
 * ```
 *
 * @example
 * ```typescript
 * // With middleware and events
 * import { createEIMZOClient, loggingMiddleware } from '@eimzo/vue';
 *
 * const client = createEIMZOClient({
 *   enableEvents: true,
 *   middleware: [
 *     loggingMiddleware,
 *     async (ctx, next) => {
 *       console.log(`Starting ${ctx.operation}`);
 *       return next();
 *     }
 *   ]
 * });
 *
 * // Listen to events
 * client.on('sign:complete', ({ signature }) => {
 *   console.log('Document signed!', signature);
 * });
 *
 * // Use as normal
 * await client.checkVersion();
 * const certs = await client.listAllUserKeys();
 * ```
 *
 * @example
 * ```typescript
 * // With mock adapter for testing
 * import { createEIMZOClient, MockWebSocketAdapter } from '@eimzo/vue';
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
 */
export function createEIMZOClient(config: EIMZOClientConfig = {}) {
  // Create ESignature instance with configuration
  const client = new ESignature({
    timeout: config.timeout,
    enableRetry: config.enableRetry,
    maxRetries: config.maxRetries,
    middleware: config.middleware,
    enableEvents: config.enableEvents,
    onRetry: config.onRetry,
  })

  // Set custom API keys if provided
  if (config.apiKeys) {
    client.apiKeys = config.apiKeys
  }

  // Create a proxy that exposes event emitter methods if events are enabled
  const enhancedClient = {
    // Spread all ESignature methods and properties
    ...client,

    // Expose event emitter methods if available
    on: client.eventEmitter?.on.bind(client.eventEmitter),
    once: client.eventEmitter?.once.bind(client.eventEmitter),
    off: client.eventEmitter?.off.bind(client.eventEmitter),

    // Expose adapter (for advanced use cases)
    adapter: config.adapter,

    // Expose the underlying ESignature instance
    _instance: client,
  }

  return enhancedClient
}

/**
 * Type for the enhanced client returned by createEIMZOClient
 */
export type EnhancedEIMZOClient = ReturnType<typeof createEIMZOClient>
