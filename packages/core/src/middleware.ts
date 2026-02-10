/**
 * Middleware System for E-IMZO operations
 * Provides interceptor pattern for operation lifecycle management
 */

/**
 * Middleware context - contains operation metadata
 */
export interface MiddlewareContext {
  /** Name of the operation being executed */
  operation: string
  /** Parameters passed to the operation */
  params: unknown[]
  /** Additional metadata (extensible for custom data) */
  metadata: Record<string, unknown>
  /** Timestamp when operation started */
  startTime: number
}

/**
 * Middleware function type
 * Receives context and next function to call downstream middleware/operation
 *
 * @example
 * ```typescript
 * const loggingMiddleware: Middleware = async (ctx, next) => {
 *   console.log(`Starting ${ctx.operation}`);
 *   const result = await next();
 *   console.log(`Completed ${ctx.operation}`);
 *   return result;
 * };
 * ```
 */
export type Middleware = (
  ctx: MiddlewareContext,
  next: () => Promise<unknown>,
) => Promise<unknown>

/**
 * Middleware executor - composes and executes middleware chain
 * Uses the "onion model" where middleware wraps around each other
 *
 * @example
 * ```typescript
 * const executor = new MiddlewareExecutor([mw1, mw2, mw3]);
 * const result = await executor.execute(ctx, operation);
 * ```
 */
export class MiddlewareExecutor {
  constructor(private middleware: Middleware[]) {}

  /**
   * Execute middleware chain with final operation handler
   *
   * @param ctx - Middleware context
   * @param finalHandler - Final operation to execute after all middleware
   * @returns Promise with operation result
   */
  async execute(
    ctx: MiddlewareContext,
    finalHandler: () => Promise<unknown>,
  ): Promise<unknown> {
    let index = 0

    const dispatch = async (): Promise<unknown> => {
      // If we've exhausted all middleware, call the final handler
      if (index >= this.middleware.length) {
        return finalHandler()
      }

      // Get current middleware and increment index
      const mw = this.middleware[index++]

      // Execute middleware with next dispatch function
      return mw(ctx, dispatch)
    }

    return dispatch()
  }
}

// ============================================================================
// Built-in Middleware
// ============================================================================

/**
 * Logging middleware - logs operation start, completion, and duration
 *
 * @example
 * ```typescript
 * const client = createEIMZOClient({
 *   middleware: [loggingMiddleware]
 * });
 * ```
 */
export const loggingMiddleware: Middleware = async (ctx, next) => {
  console.warn(`[EIMZO] ${ctx.operation} - Starting...`)
  const start = Date.now()

  try {
    const result = await next()
    const duration = Date.now() - start
    console.warn(`[EIMZO] ${ctx.operation} - Completed in ${duration}ms`)
    return result
  }
  catch (error) {
    const duration = Date.now() - start
    console.error(
      `[EIMZO] ${ctx.operation} - Failed after ${duration}ms:`,
      error,
    )
    throw error
  }
}

/**
 * Analytics middleware - tracks operations and errors
 * Customize this to integrate with your analytics service
 *
 * @example
 * ```typescript
 * const client = createEIMZOClient({
 *   middleware: [analyticsMiddleware]
 * });
 * ```
 */
export const analyticsMiddleware: Middleware = async (ctx, next) => {
  const start = Date.now()

  try {
    const result = await next()
    const duration = Date.now() - start

    // Track successful operation
    // Replace with your analytics service
    const win = window as Window & { analytics?: { track: (event: string, data: Record<string, unknown>) => void } }
    if (typeof window !== 'undefined' && win.analytics) {
      win.analytics.track('eimzo_operation_success', {
        operation: ctx.operation,
        duration,
        timestamp: new Date().toISOString(),
      })
    }

    return result
  }
  catch (error) {
    const duration = Date.now() - start

    // Track error
    // Replace with your analytics service
    const winErr = window as Window & { analytics?: { track: (event: string, data: Record<string, unknown>) => void } }
    if (typeof window !== 'undefined' && winErr.analytics) {
      winErr.analytics.track('eimzo_operation_error', {
        operation: ctx.operation,
        duration,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    }

    throw error
  }
}

/**
 * Performance monitoring middleware - warns about slow operations
 *
 * @param thresholdMs - Threshold in milliseconds to warn about (default: 5000)
 *
 * @example
 * ```typescript
 * const client = createEIMZOClient({
 *   middleware: [performanceMiddleware(3000)] // Warn if > 3 seconds
 * });
 * ```
 */
export function performanceMiddleware(thresholdMs: number = 5000): Middleware {
  return async (ctx, next) => {
    const start = Date.now()
    const result = await next()
    const duration = Date.now() - start

    if (duration > thresholdMs) {
      console.warn(
        `[EIMZO Performance] ${ctx.operation} took ${duration}ms (threshold: ${thresholdMs}ms)`,
      )
    }

    return result
  }
}

/**
 * Caching middleware - caches operation results
 * Useful for operations like version check that rarely change
 *
 * @param cacheDurationMs - How long to cache results in milliseconds (default: 5 minutes)
 *
 * @example
 * ```typescript
 * const client = createEIMZOClient({
 *   middleware: [cachingMiddleware(300000)] // Cache for 5 minutes
 * });
 * ```
 */
export function cachingMiddleware(cacheDurationMs: number = 300000): Middleware {
  const cache = new Map<string, { result: unknown, timestamp: number }>()

  return async (ctx, next) => {
    const cacheKey = `${ctx.operation}:${JSON.stringify(ctx.params)}`
    const cached = cache.get(cacheKey)

    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < cacheDurationMs) {
      return cached.result
    }

    // Execute operation and cache result
    const result = await next()
    cache.set(cacheKey, { result, timestamp: Date.now() })

    return result
  }
}

/**
 * Transform middleware - transform operation parameters or results
 *
 * @param transform - Transform function
 *
 * @example
 * ```typescript
 * const client = createEIMZOClient({
 *   middleware: [
 *     transformMiddleware({
 *       before: (ctx) => {
 *         // Transform parameters before operation
 *         console.log('Before:', ctx.params);
 *       },
 *       after: (result) => {
 *         // Transform result after operation
 *         return { ...result, transformed: true };
 *       }
 *     })
 *   ]
 * });
 * ```
 */
export function transformMiddleware(transform: {
  before?: (ctx: MiddlewareContext) => void
  after?: (result: unknown) => unknown
}): Middleware {
  return async (ctx, next) => {
    if (transform.before) {
      transform.before(ctx)
    }

    let result = await next()

    if (transform.after) {
      result = transform.after(result)
    }

    return result
  }
}

/**
 * Error handling middleware - catch and transform errors
 *
 * @param handler - Error handler function
 *
 * @example
 * ```typescript
 * const client = createEIMZOClient({
 *   middleware: [
 *     errorHandlingMiddleware((error, ctx) => {
 *       // Log to error tracking service
 *       Sentry.captureException(error, { tags: { operation: ctx.operation } });
 *       throw error; // Re-throw or return fallback
 *     })
 *   ]
 * });
 * ```
 */
export function errorHandlingMiddleware(handler: (error: unknown, ctx: MiddlewareContext) => unknown): Middleware {
  return async (ctx, next) => {
    try {
      return await next()
    }
    catch (error) {
      return handler(error, ctx)
    }
  }
}
