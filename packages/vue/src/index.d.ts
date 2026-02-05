/**
 * @eimzo/vue - E-IMZO Digital Signature SDK for Vue 3
 */

import type { Component, InjectionKey } from 'vue';
import type { EIMZOError } from '@eimzo/core';

// Vue Plugin
export { VueESignature, ESIGNATURE_INJECTION_KEY } from "./plugin";
export { default } from "./plugin";

// Composable
export { useESignature } from "./composable";
export type { UseESignatureReturn, UseESignatureOptions } from "./composable";

// ESignature class
export { ESignature } from "./eimzo";

// Client Factory
export { createEIMZOClient } from "./create-client";
export type { EnhancedEIMZOClient } from "./create-client";

// Error Boundary Types
export interface ErrorBoundarySlotProps {
  error: EIMZOError;
  retry: () => void;
  reset: () => void;
  retryCount: number;
}

export interface ErrorBoundaryContext {
  hasError: boolean;
  triggerRetry: () => void;
  triggerReset: () => void;
}

export interface ESignatureErrorBoundaryProps {
  maxRetries?: number;
  autoResetMs?: number;
  shouldCatch?: (error: unknown) => boolean;
}

export declare const ERROR_BOUNDARY_KEY: InjectionKey<ErrorBoundaryContext>;

// Error Boundary Component
export declare const ESignatureErrorBoundary: Component<ESignatureErrorBoundaryProps>;

// Error Boundary Composable
export declare function useErrorBoundary(): ErrorBoundaryContext | null;

// Re-export everything from core
export * from "@eimzo/core";
