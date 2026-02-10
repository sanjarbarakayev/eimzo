/**
 * WebSocket Adapter Pattern
 * Abstracts WebSocket transport layer for flexibility and testability
 */

/**
 * Abstract WebSocket adapter interface
 * Allows different implementations (browser, Node.js, mock) without changing business logic
 */
export interface WebSocketAdapter {
  /**
   * Connect to WebSocket server
   * @param url - WebSocket URL to connect to
   * @returns Promise that resolves when connection is established
   */
  connect: (url: string) => Promise<void>

  /**
   * Send data through WebSocket
   * @param data - String data to send
   */
  send: (data: string) => void

  /**
   * Register message handler
   * @param handler - Callback to invoke when message is received
   */
  onMessage: (handler: (data: string) => void) => void

  /**
   * Register close handler
   * @param handler - Callback to invoke when connection closes
   */
  onClose: (handler: (code: number, reason: string) => void) => void

  /**
   * Register error handler
   * @param handler - Callback to invoke when error occurs
   */
  onError: (handler: (error: Error) => void) => void

  /**
   * Close the WebSocket connection
   */
  close: () => void

  /**
   * Get current connection state
   * Uses standard WebSocket readyState values:
   * - 0: CONNECTING
   * - 1: OPEN
   * - 2: CLOSING
   * - 3: CLOSED
   */
  readonly readyState: number
}

/**
 * Browser WebSocket adapter
 * Uses native browser WebSocket API
 */
export class BrowserWebSocketAdapter implements WebSocketAdapter {
  private ws?: WebSocket
  private messageHandler?: (data: string) => void
  private closeHandler?: (code: number, reason: string) => void
  private errorHandler?: (error: Error) => void

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.WebSocket) {
        reject(new Error('WebSocket not supported in this environment'))
        return
      }

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          resolve()
        }

        this.ws.onerror = (event: Event) => {
          const error = new Error(`WebSocket connection failed: ${event.type}`)
          if (this.errorHandler) {
            this.errorHandler(error)
          }
          reject(error)
        }

        // Set up handlers if they were registered before connection
        if (this.messageHandler) {
          this.ws.onmessage = (event: MessageEvent) => {
            this.messageHandler!(event.data)
          }
        }

        if (this.closeHandler) {
          this.ws.onclose = (event: CloseEvent) => {
            this.closeHandler!(event.code, event.reason)
          }
        }
      }
      catch (error) {
        reject(error)
      }
    })
  }

  send(data: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    this.ws.send(data)
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler
    if (this.ws) {
      this.ws.onmessage = (event: MessageEvent) => {
        handler(event.data)
      }
    }
  }

  onClose(handler: (code: number, reason: string) => void): void {
    this.closeHandler = handler
    if (this.ws) {
      this.ws.onclose = (event: CloseEvent) => {
        handler(event.code, event.reason)
      }
    }
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler
    if (this.ws) {
      this.ws.onerror = (event: Event) => {
        handler(new Error(`WebSocket error: ${event.type}`))
      }
    }
  }

  close(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close()
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? 3 // 3 = CLOSED
  }
}

/**
 * Mock WebSocket adapter for testing
 * Simulates WebSocket behavior without actual network connection
 *
 * @example
 * ```typescript
 * const mockAdapter = new MockWebSocketAdapter();
 * mockAdapter.mockResponses.set('version', {
 *   success: true,
 *   major: '3',
 *   minor: '37'
 * });
 *
 * // Use in tests
 * const client = createEIMZOClient({ adapter: mockAdapter });
 * await client.checkVersion(); // Returns mocked response
 * ```
 */
export class MockWebSocketAdapter implements WebSocketAdapter {
  private _readyState: number = 3 // Start as CLOSED
  private messageHandler?: (data: string) => void
  private closeHandler?: (code: number, reason: string) => void
  private errorHandler?: (error: Error) => void

  /**
   * Map of operation names to mock responses
   * Set this to provide mock data for testing
   */
  public mockResponses: Map<string, unknown> = new Map()

  /**
   * Delay in milliseconds before sending mock response
   * Useful for simulating network latency
   */
  public responseDelay: number = 10

  /**
   * If true, simulate a connection error
   */
  public shouldFail: boolean = false

  /**
   * Error message to use when shouldFail is true
   */
  public failureMessage: string = 'Mock connection failed'

  async connect(_url: string): Promise<void> {
    if (this.shouldFail) {
      this._readyState = 3 // CLOSED
      throw new Error(this.failureMessage)
    }

    return new Promise((resolve) => {
      this._readyState = 0 // CONNECTING
      setTimeout(() => {
        this._readyState = 1 // OPEN
        resolve()
      }, this.responseDelay)
    })
  }

  send(data: string): void {
    if (this._readyState !== 1) {
      throw new Error('WebSocket is not connected')
    }

    // Parse request and return mock response
    try {
      const request = JSON.parse(data)
      const operationName = request.name

      setTimeout(() => {
        if (this.messageHandler) {
          const mockResponse = this.mockResponses.get(operationName) || {
            success: true,
          }
          this.messageHandler(JSON.stringify(mockResponse))
        }
      }, this.responseDelay)
    }
    catch (error) {
      if (this.errorHandler) {
        this.errorHandler(new Error(`Failed to parse request: ${error}`))
      }
    }
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler
  }

  onClose(handler: (code: number, reason: string) => void): void {
    this.closeHandler = handler
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler
  }

  close(): void {
    if (this._readyState !== 3) {
      this._readyState = 3 // CLOSED
      if (this.closeHandler) {
        this.closeHandler(1000, 'Normal closure')
      }
    }
  }

  get readyState(): number {
    return this._readyState
  }

  /**
   * Simulate receiving a message (for testing)
   */
  simulateMessage(data: string): void {
    if (this.messageHandler) {
      this.messageHandler(data)
    }
  }

  /**
   * Simulate an error (for testing)
   */
  simulateError(error: Error): void {
    if (this.errorHandler) {
      this.errorHandler(error)
    }
  }

  /**
   * Simulate connection close (for testing)
   */
  simulateClose(code: number = 1000, reason: string = 'Normal closure'): void {
    this._readyState = 3 // CLOSED
    if (this.closeHandler) {
      this.closeHandler(code, reason)
    }
  }

  /**
   * Reset the mock adapter to initial state
   */
  reset(): void {
    this._readyState = 3
    this.mockResponses.clear()
    this.responseDelay = 10
    this.shouldFail = false
    this.failureMessage = 'Mock connection failed'
    this.messageHandler = undefined
    this.closeHandler = undefined
    this.errorHandler = undefined
  }
}
