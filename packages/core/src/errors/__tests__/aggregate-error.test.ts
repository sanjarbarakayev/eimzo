import { describe, it, expect, vi } from 'vitest';
import {
  AggregateSignError,
  executeBatch,
  type BatchFailure,
  type BatchResult,
} from '../aggregate-error';
import { EIMZOError } from '../eimzo-error';
import { ERROR_CODES } from '../../types/error-codes';

describe('AggregateSignError', () => {
  const createFailure = (
    index: number,
    item: string,
    code: typeof ERROR_CODES[keyof typeof ERROR_CODES] = ERROR_CODES.SIGNING_ERROR
  ): BatchFailure<string> => ({
    index,
    item,
    error: new EIMZOError(code, `Failed to sign item ${index}`, {
      context: { operation: 'sign' },
    }),
  });

  describe('constructor', () => {
    it('creates an aggregate error with failures and successes', () => {
      const failures = [createFailure(1, 'doc1')];
      const successes = ['sig0', 'sig2'];

      const error = new AggregateSignError(
        'Batch signing failed',
        failures,
        successes
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EIMZOError);
      expect(error).toBeInstanceOf(AggregateSignError);
      expect(error.name).toBe('AggregateSignError');
      expect(error.code).toBe(ERROR_CODES.SIGNING_ERROR);
      expect(error.message).toBe('Batch signing failed');
      expect(error.failures).toBe(failures);
      expect(error.successfulSignatures).toBe(successes);
    });

    it('sets operation to batchSign by default', () => {
      const error = new AggregateSignError('Failed', [], []);

      expect(error.context.operation).toBe('batchSign');
    });

    it('includes counts in metadata', () => {
      const failures = [createFailure(0, 'doc0'), createFailure(2, 'doc2')];
      const successes = ['sig1'];

      const error = new AggregateSignError('Failed', failures, successes);

      expect(error.context.metadata).toEqual({
        failureCount: 2,
        successCount: 1,
        totalCount: 3,
      });
    });

    it('accepts custom context', () => {
      const error = new AggregateSignError('Failed', [], [], {
        context: {
          keyId: 'key-123',
          metadata: { requestId: 'req-1' },
        },
      });

      expect(error.context.keyId).toBe('key-123');
      expect(error.context.metadata?.requestId).toBe('req-1');
    });

    it('accepts custom correlation ID', () => {
      const error = new AggregateSignError('Failed', [], [], {
        correlationId: 'custom-batch-123',
      });

      expect(error.correlationId).toBe('custom-batch-123');
    });
  });

  describe('toBatchResult', () => {
    it('converts to BatchResult correctly', () => {
      const failures = [createFailure(1, 'doc1')];
      const successes = ['sig0', 'sig2'];

      const error = new AggregateSignError('Failed', failures, successes);
      const result = error.toBatchResult();

      expect(result.successes).toEqual(successes);
      expect(result.failures).toEqual(failures);
      expect(result.allSucceeded).toBe(false);
      expect(result.allFailed).toBe(false);
      expect(result.total).toBe(3);
    });

    it('marks allSucceeded true when no failures', () => {
      const error = new AggregateSignError('Misleading message', [], ['sig1']);
      const result = error.toBatchResult();

      expect(result.allSucceeded).toBe(true);
      expect(result.allFailed).toBe(false);
    });

    it('marks allFailed true when no successes', () => {
      const failures = [createFailure(0, 'doc0')];
      const error = new AggregateSignError('All failed', failures, []);
      const result = error.toBatchResult();

      expect(result.allSucceeded).toBe(false);
      expect(result.allFailed).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('returns a human-readable summary', () => {
      const failures = [createFailure(1, 'doc1')];
      const successes = ['sig0', 'sig2'];

      const error = new AggregateSignError('Failed', failures, successes);
      const summary = error.getSummary();

      expect(summary).toBe(
        'Batch signing partially failed: 2/3 succeeded, 1/3 failed'
      );
    });

    it('handles all succeeded case', () => {
      const error = new AggregateSignError('Weird', [], ['sig0', 'sig1']);
      const summary = error.getSummary();

      expect(summary).toBe(
        'Batch signing partially failed: 2/2 succeeded, 0/2 failed'
      );
    });

    it('handles all failed case', () => {
      const failures = [createFailure(0, 'doc0'), createFailure(1, 'doc1')];
      const error = new AggregateSignError('All failed', failures, []);
      const summary = error.getSummary();

      expect(summary).toBe(
        'Batch signing partially failed: 0/2 succeeded, 2/2 failed'
      );
    });
  });

  describe('getFailedIndices', () => {
    it('returns indices of failed items', () => {
      const failures = [
        createFailure(1, 'doc1'),
        createFailure(3, 'doc3'),
        createFailure(5, 'doc5'),
      ];

      const error = new AggregateSignError('Failed', failures, []);
      const indices = error.getFailedIndices();

      expect(indices).toEqual([1, 3, 5]);
    });

    it('returns empty array when no failures', () => {
      const error = new AggregateSignError('No failures', [], ['sig1']);
      const indices = error.getFailedIndices();

      expect(indices).toEqual([]);
    });
  });

  describe('toJSON', () => {
    it('includes aggregate-specific data', () => {
      const failures = [createFailure(1, 'doc1')];
      const successes = ['sig0'];

      const error = new AggregateSignError('Failed', failures, successes, {
        correlationId: 'test-correlation',
      });

      const json = error.toJSON();

      expect(json.name).toBe('AggregateSignError');
      expect(json.successfulSignatures).toEqual(['sig0']);
      expect(json.summary).toContain('1/2 succeeded');
      expect(json.failures).toHaveLength(1);
      expect((json.failures as unknown[])[0]).toMatchObject({
        index: 1,
        item: 'doc1',
      });
    });

    it('serializes nested errors correctly', () => {
      const failures = [createFailure(0, 'doc0', ERROR_CODES.CERTIFICATE_EXPIRED)];
      const error = new AggregateSignError('Failed', failures, []);

      const json = error.toJSON();
      const failureJson = (json.failures as { error: { code: string } }[])[0];

      expect(failureJson.error.code).toBe(ERROR_CODES.CERTIFICATE_EXPIRED);
    });
  });

  describe('isAggregateSignError', () => {
    it('returns true for AggregateSignError', () => {
      const error = new AggregateSignError('Failed', [], []);

      expect(AggregateSignError.isAggregateSignError(error)).toBe(true);
    });

    it('returns false for EIMZOError', () => {
      const error = new EIMZOError(
        ERROR_CODES.SIGNING_ERROR,
        'Single error',
        { context: { operation: 'sign' } }
      );

      expect(AggregateSignError.isAggregateSignError(error)).toBe(false);
    });

    it('returns false for standard Error', () => {
      const error = new Error('Standard error');

      expect(AggregateSignError.isAggregateSignError(error)).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(AggregateSignError.isAggregateSignError(null)).toBe(false);
      expect(AggregateSignError.isAggregateSignError(undefined)).toBe(false);
    });
  });
});

describe('executeBatch', () => {
  describe('successful batch', () => {
    it('processes all items successfully', async () => {
      const items = ['a', 'b', 'c'];
      const operation = vi.fn(async (item: string) => item.toUpperCase());

      const result = await executeBatch(items, operation);

      expect(result.successes).toEqual(['A', 'B', 'C']);
      expect(result.failures).toEqual([]);
      expect(result.allSucceeded).toBe(true);
      expect(result.allFailed).toBe(false);
      expect(result.total).toBe(3);
    });

    it('passes item and index to operation', async () => {
      const items = ['a', 'b'];
      const operation = vi.fn(async (item: string, index: number) => ({
        item,
        index,
      }));

      await executeBatch(items, operation);

      expect(operation).toHaveBeenCalledWith('a', 0);
      expect(operation).toHaveBeenCalledWith('b', 1);
    });

    it('handles empty array', async () => {
      const result = await executeBatch([], async () => 'result');

      expect(result.successes).toEqual([]);
      expect(result.failures).toEqual([]);
      expect(result.allSucceeded).toBe(true);
      expect(result.allFailed).toBe(false);
      expect(result.total).toBe(0);
    });
  });

  describe('partial failure', () => {
    it('collects both successes and failures', async () => {
      const items = ['ok1', 'fail', 'ok2', 'error', 'ok3'];
      const operation = vi.fn(async (item: string) => {
        if (item.startsWith('ok')) {
          return item.toUpperCase();
        }
        throw new Error(`Failed: ${item}`);
      });

      const result = await executeBatch(items, operation);

      expect(result.successes).toEqual(['OK1', 'OK2', 'OK3']);
      expect(result.failures).toHaveLength(2);
      expect(result.failures[0].index).toBe(1);
      expect(result.failures[0].item).toBe('fail');
      expect(result.failures[1].index).toBe(3);
      expect(result.failures[1].item).toBe('error');
      expect(result.allSucceeded).toBe(false);
      expect(result.allFailed).toBe(false);
      expect(result.total).toBe(5);
    });

    it('wraps errors as EIMZOError', async () => {
      const items = ['item'];
      const operation = vi.fn(async () => {
        throw new Error('Test error');
      });

      const result = await executeBatch(items, operation);

      expect(result.failures[0].error).toBeInstanceOf(EIMZOError);
      expect(result.failures[0].error.message).toBe('Test error');
      expect(result.failures[0].error.context.operation).toBe('batchItem');
    });

    it('includes batch metadata in error context', async () => {
      const items = ['item'];
      const operation = vi.fn(async () => {
        throw new Error('Test error');
      });

      const result = await executeBatch(items, operation, {
        correlationId: 'batch-123',
      });

      const errorMetadata = result.failures[0].error.context.metadata;
      expect(errorMetadata).toEqual({
        batchIndex: 0,
        batchCorrelationId: 'batch-123',
      });
    });

    it('preserves EIMZOError when thrown', async () => {
      const items = ['item'];
      const originalError = new EIMZOError(
        ERROR_CODES.CERTIFICATE_EXPIRED,
        'Cert expired',
        { context: { operation: 'sign' } }
      );

      const operation = vi.fn(async () => {
        throw originalError;
      });

      const result = await executeBatch(items, operation);

      // EIMZOError.from adds context, so it's a new error but with same code
      expect(result.failures[0].error.code).toBe(ERROR_CODES.CERTIFICATE_EXPIRED);
    });
  });

  describe('complete failure', () => {
    it('handles all items failing', async () => {
      const items = ['a', 'b', 'c'];
      const operation = vi.fn(async (item: string) => {
        throw new Error(`Failed: ${item}`);
      });

      const result = await executeBatch(items, operation);

      expect(result.successes).toEqual([]);
      expect(result.failures).toHaveLength(3);
      expect(result.allSucceeded).toBe(false);
      expect(result.allFailed).toBe(true);
      expect(result.total).toBe(3);
    });
  });

  describe('stopOnFirstError option', () => {
    it('stops processing after first error', async () => {
      const items = ['ok1', 'fail', 'ok2', 'ok3'];
      const operation = vi.fn(async (item: string) => {
        if (item === 'fail') {
          throw new Error('Failed');
        }
        return item.toUpperCase();
      });

      const result = await executeBatch(items, operation, {
        stopOnFirstError: true,
      });

      expect(operation).toHaveBeenCalledTimes(2);
      expect(result.successes).toEqual(['OK1']);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].index).toBe(1);
      expect(result.total).toBe(4);
    });

    it('processes all items when no errors', async () => {
      const items = ['a', 'b', 'c'];
      const operation = vi.fn(async (item: string) => item.toUpperCase());

      const result = await executeBatch(items, operation, {
        stopOnFirstError: true,
      });

      expect(operation).toHaveBeenCalledTimes(3);
      expect(result.successes).toEqual(['A', 'B', 'C']);
    });

    it('stops on first item if it fails', async () => {
      const items = ['fail', 'ok1', 'ok2'];
      const operation = vi.fn(async (item: string) => {
        if (item === 'fail') {
          throw new Error('First failed');
        }
        return item;
      });

      const result = await executeBatch(items, operation, {
        stopOnFirstError: true,
      });

      expect(operation).toHaveBeenCalledTimes(1);
      expect(result.successes).toEqual([]);
      expect(result.failures).toHaveLength(1);
    });
  });

  describe('correlationId option', () => {
    it('uses provided correlation ID', async () => {
      const items = ['fail'];
      const operation = vi.fn(async () => {
        throw new Error('Failed');
      });

      const result = await executeBatch(items, operation, {
        correlationId: 'my-batch-123',
      });

      const metadata = result.failures[0].error.context.metadata as Record<string, unknown>;
      expect(metadata.batchCorrelationId).toBe('my-batch-123');
    });

    it('generates correlation ID when not provided', async () => {
      const items = ['fail'];
      const operation = vi.fn(async () => {
        throw new Error('Failed');
      });

      const result = await executeBatch(items, operation);

      const metadata = result.failures[0].error.context.metadata as Record<string, unknown>;
      expect(metadata.batchCorrelationId).toMatch(/^batch-[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('async behavior', () => {
    it('processes items sequentially', async () => {
      const order: number[] = [];
      const items = [1, 2, 3];

      const operation = vi.fn(async (item: number) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push(item);
        return item;
      });

      await executeBatch(items, operation);

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('type safety', () => {
    it('infers correct result types', async () => {
      interface Doc {
        id: number;
        content: string;
      }
      interface Signature {
        docId: number;
        sig: string;
      }

      const docs: readonly Doc[] = [
        { id: 1, content: 'Hello' },
        { id: 2, content: 'World' },
      ];

      const result = await executeBatch<Doc, Signature>(
        docs,
        async (doc) => ({ docId: doc.id, sig: `signed-${doc.id}` })
      );

      // Type assertions - these would fail at compile time if types are wrong
      const success: Signature = result.successes[0];
      expect(success.docId).toBe(1);
      expect(success.sig).toBe('signed-1');
    });
  });
});
