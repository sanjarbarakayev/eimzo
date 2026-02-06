/**
 * Type-safe Event Emitter for E-IMZO operations
 * Provides a foundation for event-driven architecture with full TypeScript support
 */

import type { KeyId } from './types/branded'

/**
 * Error context information for error events
 */
export interface ErrorContext {
  operation: string
  params?: unknown
  timestamp: number
}

/**
 * Type-safe event map for E-IMZO operations
 * Each key represents an event name and its corresponding data payload
 */
export interface EIMZOEvents {
  // Connection events
  'connect': { url: string, timestamp: number }
  'disconnect': { reason: string, code?: number }

  // Operation lifecycle events
  'operation:start': { operation: string, params: unknown }
  'operation:complete': { operation: string, result: unknown, duration: number }
  'operation:error': { operation: string, error: Error }

  // Specific operations
  'certificate:loaded': { certificate: unknown, keyId: KeyId }
  'sign:start': { data: string }
  'sign:complete': { signature: string }
  'version:checked': { major: number, minor: number }

  // Error events
  'error': { error: Error, context: ErrorContext }
  'retry': { operation: string, attempt: number, error: Error }
}

/**
 * Event handler function type
 */
type EventHandler<T> = (data: T) => void

/**
 * Type-safe event emitter for E-IMZO operations
 *
 * @example
 * ```typescript
 * const emitter = new EIMZOEventEmitter();
 *
 * // Type-safe event listening
 * emitter.on('sign:complete', ({ signature }) => {
 *   console.log('Signature:', signature);
 * });
 *
 * // Emit events
 * emitter.emit('sign:complete', { signature: 'abc123' });
 * ```
 */
export class EIMZOEventEmitter {
  // eslint-disable-next-line ts/no-explicit-any -- internal storage for heterogeneous handlers
  private listeners: Map<keyof EIMZOEvents, Set<EventHandler<any>>> = new Map()

  /**
   * Register an event listener
   *
   * @param event - Event name to listen to
   * @param handler - Callback function to invoke when event is emitted
   *
   * @example
   * ```typescript
   * emitter.on('connect', ({ url }) => {
   *   console.log('Connected to:', url);
   * });
   * ```
   */
  on<K extends keyof EIMZOEvents>(
    event: K,
    handler: EventHandler<EIMZOEvents[K]>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  /**
   * Register a one-time event listener
   * The listener will be automatically removed after first invocation
   *
   * @param event - Event name to listen to
   * @param handler - Callback function to invoke once when event is emitted
   *
   * @example
   * ```typescript
   * emitter.once('version:checked', ({ major, minor }) => {
   *   console.log(`Version: ${major}.${minor}`);
   * });
   * ```
   */
  once<K extends keyof EIMZOEvents>(
    event: K,
    handler: EventHandler<EIMZOEvents[K]>,
  ): void {
    const wrappedHandler: EventHandler<EIMZOEvents[K]> = (data) => {
      handler(data)
      this.off(event, wrappedHandler)
    }
    this.on(event, wrappedHandler)
  }

  /**
   * Remove an event listener
   *
   * @param event - Event name
   * @param handler - Handler function to remove
   *
   * @example
   * ```typescript
   * const handler = ({ signature }) => console.log(signature);
   * emitter.on('sign:complete', handler);
   * emitter.off('sign:complete', handler);
   * ```
   */
  off<K extends keyof EIMZOEvents>(
    event: K,
    handler: EventHandler<EIMZOEvents[K]>,
  ): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   *
   * @param event - Event name to emit
   * @param data - Event data payload
   *
   * @example
   * ```typescript
   * emitter.emit('sign:start', { data: 'test data' });
   * ```
   */
  emit<K extends keyof EIMZOEvents>(event: K, data: EIMZOEvents[K]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        }
        catch (error) {
          // Prevent handler errors from breaking the emit chain
          console.error(`Error in event handler for '${String(event)}':`, error)
        }
      })
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   *
   * @param event - Optional event name. If not provided, removes all listeners
   *
   * @example
   * ```typescript
   * // Remove all listeners for 'connect'
   * emitter.removeAllListeners('connect');
   *
   * // Remove all listeners for all events
   * emitter.removeAllListeners();
   * ```
   */
  removeAllListeners<K extends keyof EIMZOEvents>(event?: K): void {
    if (event) {
      this.listeners.delete(event)
    }
    else {
      this.listeners.clear()
    }
  }

  /**
   * Get the number of listeners for a specific event
   *
   * @param event - Event name
   * @returns Number of listeners registered for the event
   */
  listenerCount<K extends keyof EIMZOEvents>(event: K): number {
    return this.listeners.get(event)?.size ?? 0
  }

  /**
   * Get all event names that have listeners
   *
   * @returns Array of event names
   */
  eventNames(): Array<keyof EIMZOEvents> {
    return Array.from(this.listeners.keys())
  }
}
