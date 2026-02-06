import type {
  CAPIWSFunctionDef,
  CAPIWSBaseResponse,
  CAPIWSVersionResponse,
  CAPIWSLoadKeyResponse,
  CAPIWSPkcs7Response,
  CAPIWSListCertificatesResponse,
} from '@eimzo/core'

/**
 * Mock response configuration
 */
export interface MockResponseConfig {
  /** Delay in ms before responding (default: 0) */
  delay?: number
  /** Whether the response should indicate failure */
  fail?: boolean
  /** Error reason for failed responses */
  reason?: string
  /** Custom response data */
  data?: Partial<CAPIWSBaseResponse>
}

/**
 * Message with optional plugin field
 */
interface MessageWithPlugin {
  name: string
  plugin?: string
  arguments?: unknown[]
}

/**
 * Message handler type
 */
type MessageHandler = (message: MessageWithPlugin) => CAPIWSBaseResponse

/**
 * Simple Event implementation for Node.js environment
 */
class MockEvent {
  readonly type: string
  constructor(type: string) {
    this.type = type
  }
}

/**
 * Simple CloseEvent implementation for Node.js environment
 */
class MockCloseEvent extends MockEvent {
  readonly code: number
  readonly reason: string
  constructor(type: string, init?: { code?: number; reason?: string }) {
    super(type)
    this.code = init?.code ?? 1000
    this.reason = init?.reason ?? ''
  }
}

/**
 * Simple MessageEvent implementation for Node.js environment
 */
class MockMessageEvent extends MockEvent {
  readonly data: string
  constructor(type: string, init?: { data?: string }) {
    super(type)
    this.data = init?.data ?? ''
  }
}

/**
 * MockWebSocket simulates WebSocket behavior for testing
 */
export class MockWebSocket {
  readonly url: string
  readyState: number = 0 // CONNECTING

  onopen: ((event: MockEvent) => void) | null = null
  onclose: ((event: MockCloseEvent) => void) | null = null
  onmessage: ((event: MockMessageEvent) => void) | null = null
  onerror: ((event: MockEvent) => void) | null = null

  private messageHandler: MessageHandler
  private config: MockResponseConfig

  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  constructor(url: string, messageHandler: MessageHandler, config: MockResponseConfig = {}) {
    this.url = url
    this.messageHandler = messageHandler
    this.config = config

    // Simulate async connection
    globalThis.setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new MockEvent('open'))
      }
    }, 0)
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }

    const message = JSON.parse(data) as CAPIWSFunctionDef
    const response = this.messageHandler(message)

    const delay = this.config.delay ?? 0

    globalThis.setTimeout(() => {
      if (this.onmessage) {
        const messageEvent = new MockMessageEvent('message', {
          data: JSON.stringify(response),
        })
        this.onmessage(messageEvent)
      }
    }, delay)
  }

  close(code: number = 1000, reason: string = ''): void {
    this.readyState = MockWebSocket.CLOSING
    globalThis.setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      if (this.onclose) {
        const closeEvent = new MockCloseEvent('close', { code, reason })
        this.onclose(closeEvent)
      }
    }, 0)
  }
}

/**
 * Default responses for common CAPIWS operations
 */
const defaultResponses: Record<string, () => CAPIWSBaseResponse> = {
  version: (): CAPIWSVersionResponse => ({
    success: true,
    major: '3',
    minor: '37',
  }),

  apidoc: (): CAPIWSBaseResponse => ({
    success: true,
  }),

  apikey: (): CAPIWSBaseResponse => ({
    success: true,
  }),

  'pfx.list_all_certificates': (): CAPIWSListCertificatesResponse => ({
    success: true,
    certificates: [
      {
        disk: 'C',
        path: '/certs',
        name: 'test-cert.pfx',
        alias: 'CN=Test User,O=Test Organization',
      },
    ],
  }),

  'pfx.load_key': (): CAPIWSLoadKeyResponse => ({
    success: true,
    keyId: 'mock-key-id-123',
  }),

  'pfx.create_pkcs7': (): CAPIWSPkcs7Response => ({
    success: true,
    pkcs7_64:
      'MIIGSAYJKoZIhvcNAQcCoIIGOTCCBjUCAQExDjAMBggqgzOCAQEDAgUAMAsGCSqGSIb3DQEHAaCCBDkwggQ1MIIDnaADAgECAhQ=',
  }),

  'ftjc.list_tokens': () => ({
    success: true,
    tokens: [
      {
        cardUID: 'CARD-UID-12345',
        statusInfo: 'Active',
        ownerName: 'Token User',
        info: 'FTJC Smart Card Certificate',
      },
    ],
  }),

  'ftjc.load_key': (): CAPIWSLoadKeyResponse => ({
    success: true,
    keyId: 'mock-ftjc-key-id-456',
  }),

  'ftjc.create_pkcs7': (): CAPIWSPkcs7Response => ({
    success: true,
    pkcs7_64:
      'MIIGSAYJKoZIhvcNAQcCoIIGOTCCBjUCAQExDjAMBggqgzOCAQEDAgUAMAsGCSqGSIb3DQEHAaCCBDkwggQ1MIIDnaADAgECAhQ=',
  }),
}

/**
 * Create a default message handler for CAPIWS operations
 */
function createDefaultMessageHandler(
  customResponses: Record<string, () => CAPIWSBaseResponse> = {},
  config: MockResponseConfig = {}
): MessageHandler {
  const responses = { ...defaultResponses, ...customResponses }

  return (message) => {
    if (config.fail === true) {
      return {
        success: false,
        reason: config.reason ?? 'Mock error',
      }
    }

    const key = message.plugin !== undefined ? `${message.plugin}.${message.name}` : message.name

    const handler = responses[key]
    if (handler !== undefined) {
      return { ...handler(), ...config.data }
    }

    return {
      success: false,
      reason: `Unknown operation: ${key}`,
    }
  }
}

/**
 * MockCAPIWSServer simulates the E-IMZO WebSocket server for testing
 */
export class MockCAPIWSServer {
  private customResponses: Record<string, () => CAPIWSBaseResponse> = {}
  private config: MockResponseConfig = {}
  private originalWebSocket: unknown

  /**
   * Start the mock server (replaces global WebSocket)
   */
  start(): void {
    if (typeof globalThis !== 'undefined' && 'WebSocket' in globalThis) {
      this.originalWebSocket = (globalThis as Record<string, unknown>).WebSocket
      ;(globalThis as Record<string, unknown>).WebSocket = this.createMockWebSocketClass()
    }
  }

  /**
   * Stop the mock server (restores global WebSocket)
   */
  stop(): void {
    if (typeof globalThis !== 'undefined' && this.originalWebSocket !== undefined) {
      ;(globalThis as Record<string, unknown>).WebSocket = this.originalWebSocket
      this.originalWebSocket = undefined
    }
  }

  /**
   * Configure response for a specific operation
   */
  setResponse(operation: string, response: () => CAPIWSBaseResponse): MockCAPIWSServer {
    this.customResponses[operation] = response
    return this
  }

  /**
   * Configure all responses to fail
   */
  setFail(fail: boolean, reason?: string): MockCAPIWSServer {
    this.config = { ...this.config, fail, reason }
    return this
  }

  /**
   * Configure response delay
   */
  setDelay(delay: number): MockCAPIWSServer {
    this.config = { ...this.config, delay }
    return this
  }

  /**
   * Reset all custom configurations
   */
  reset(): MockCAPIWSServer {
    this.customResponses = {}
    this.config = {}
    return this
  }

  private createMockWebSocketClass(): typeof MockWebSocket {
    const customResponses = this.customResponses
    const config = this.config

    return class extends MockWebSocket {
      constructor(url: string) {
        super(url, createDefaultMessageHandler(customResponses, config), config)
      }
    } as unknown as typeof MockWebSocket
  }
}

/**
 * Create a pre-configured mock server instance
 */
export function createMockServer(): MockCAPIWSServer {
  return new MockCAPIWSServer()
}
