/**
 * Composable for accessing Error Boundary context
 *
 * Use this to programmatically interact with the nearest error boundary.
 *
 * @example
 * ```typescript
 * import { useErrorBoundary } from '@eimzo/vue';
 *
 * const errorBoundary = useErrorBoundary();
 *
 * if (errorBoundary) {
 *   errorBoundary.triggerReset();
 * }
 * ```
 */

import { inject } from 'vue';
import {
  ERROR_BOUNDARY_KEY,
  type ErrorBoundaryContext,
} from '../components/error-boundary-types';

/**
 * Injects the nearest error boundary context
 *
 * @returns ErrorBoundaryContext if inside an ESignatureErrorBoundary, null otherwise
 */
export function useErrorBoundary(): ErrorBoundaryContext | null {
  return inject(ERROR_BOUNDARY_KEY, null);
}
