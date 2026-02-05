/**
 * Types for ESignatureErrorBoundary component
 */

import type { InjectionKey } from 'vue';
import type { EIMZOError } from '@eimzo/core';

/**
 * Props for error slot
 */
export interface ErrorBoundarySlotProps {
  /** The caught error */
  error: EIMZOError;
  /** Retry the operation that failed */
  retry: () => void;
  /** Reset the error boundary without retrying */
  reset: () => void;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Context provided to descendant components
 */
export interface ErrorBoundaryContext {
  /** Whether an error is currently being displayed */
  hasError: boolean;
  /** Trigger retry from a descendant */
  triggerRetry: () => void;
  /** Reset error state from a descendant */
  triggerReset: () => void;
}

/**
 * Component props
 */
export interface ESignatureErrorBoundaryProps {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Auto-reset error state after this many milliseconds (0 = disabled) */
  autoResetMs?: number;
  /** Custom filter to determine if an error should be caught */
  shouldCatch?: (error: unknown) => boolean;
}

/**
 * Injection key for error boundary context
 */
export const ERROR_BOUNDARY_KEY: InjectionKey<ErrorBoundaryContext> = Symbol(
  'ESignatureErrorBoundary'
);
