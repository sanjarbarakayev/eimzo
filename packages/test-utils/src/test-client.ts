import type { Certificate, FtjcCertificate, PfxCertificate } from '@eimzo/core'
import { mockFtjcCertificate, mockPfxCertificate } from '../fixtures/certificates'

/**
 * Test client configuration
 */
export interface TestClientConfig {
  /** Simulated delay for operations (ms) */
  delay?: number
  /** Whether operations should fail */
  shouldFail?: boolean
  /** Error message for failed operations */
  errorMessage?: string
}

/**
 * Simple base64 encoder for Node.js
 */
function toBase64(str: string): string {
  if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
    return (globalThis as { Buffer: typeof Buffer }).Buffer.from(str).toString('base64')
  }
  // Browser fallback
  return btoa(str)
}

/**
 * TestEIMZOClient provides a mock implementation of EIMZOClient for testing
 * without requiring actual E-IMZO installation
 */
export class TestEIMZOClient {
  private config: TestClientConfig
  private loadedKeys: Map<string, Certificate> = new Map()
  private certificates: Certificate[] = []

  constructor(config: TestClientConfig = {}) {
    this.config = config
    this.certificates = [mockPfxCertificate, mockFtjcCertificate]
  }

  /**
   * Add a certificate to the mock certificate list
   */
  addCertificate(cert: Certificate): TestEIMZOClient {
    this.certificates = [...this.certificates, cert]
    return this
  }

  /**
   * Set certificates list
   */
  setCertificates(certs: Certificate[]): TestEIMZOClient {
    this.certificates = [...certs]
    return this
  }

  /**
   * Configure the test client
   */
  configure(config: Partial<TestClientConfig>): TestEIMZOClient {
    this.config = { ...this.config, ...config }
    return this
  }

  /**
   * Simulate checking E-IMZO version
   */
  async checkVersion(): Promise<{ major: number, minor: number }> {
    await this.simulateDelay()
    this.checkFailure()
    return { major: 3, minor: 37 }
  }

  /**
   * Simulate listing all certificates
   */
  async listAllCertificates(): Promise<Certificate[]> {
    await this.simulateDelay()
    this.checkFailure()
    return [...this.certificates]
  }

  /**
   * Simulate listing PFX certificates
   */
  async listPfxCertificates(): Promise<PfxCertificate[]> {
    await this.simulateDelay()
    this.checkFailure()
    return this.certificates.filter((c): c is PfxCertificate => c.type === 'pfx')
  }

  /**
   * Simulate listing FTJC certificates
   */
  async listFtjcCertificates(): Promise<FtjcCertificate[]> {
    await this.simulateDelay()
    this.checkFailure()
    return this.certificates.filter((c): c is FtjcCertificate => c.type === 'ftjc')
  }

  /**
   * Simulate loading a key
   */
  async loadKey(cert: Certificate, _password?: string): Promise<string> {
    await this.simulateDelay()
    this.checkFailure()

    const keyId = `mock-key-${cert.serialNumber}`
    this.loadedKeys.set(keyId, cert)
    return keyId
  }

  /**
   * Simulate creating a PKCS7 signature
   */
  async createPkcs7(keyId: string, data: string): Promise<string> {
    await this.simulateDelay()
    this.checkFailure()

    if (!this.loadedKeys.has(keyId)) {
      throw new Error(`Key not found: ${keyId}`)
    }

    // Return a mock PKCS7 signature (base64 encoded)
    const mockSignature = toBase64(
      JSON.stringify({
        keyId,
        data: data.slice(0, 20),
        timestamp: new Date().toISOString(),
      }),
    )

    return mockSignature
  }

  /**
   * Check if a hardware token is plugged in
   */
  async isTokenPluggedIn(): Promise<boolean> {
    await this.simulateDelay()
    this.checkFailure()
    return this.certificates.some(c => c.type === 'ftjc')
  }

  /**
   * Reset the test client state
   */
  reset(): TestEIMZOClient {
    this.loadedKeys.clear()
    this.certificates = [mockPfxCertificate, mockFtjcCertificate]
    this.config = {}
    return this
  }

  private async simulateDelay(): Promise<void> {
    const delay = this.config.delay ?? 0
    if (delay > 0) {
      await new Promise(resolve => globalThis.setTimeout(resolve, delay))
    }
  }

  private checkFailure(): void {
    if (this.config.shouldFail === true) {
      throw new Error(this.config.errorMessage ?? 'Mock operation failed')
    }
  }
}

/**
 * Create a pre-configured test client
 */
export function createTestClient(config: TestClientConfig = {}): TestEIMZOClient {
  return new TestEIMZOClient(config)
}
