// Mock server for WebSocket testing
export { MockWebSocket, MockCAPIWSServer, createMockServer } from './mock-server'
export type { MockResponseConfig } from './mock-server'

// Test client for E-IMZO operations
export { TestEIMZOClient, createTestClient } from './test-client'
export type { TestClientConfig } from './test-client'

// Certificate fixtures
export {
  mockPfxCertificate,
  mockExpiredPfxCertificate,
  mockFtjcCertificate,
  mockPkcs7Signature,
  mockVersionInfo,
  createMockPfxCertificate,
  createMockFtjcCertificate,
  createMockCertificateList,
} from '../fixtures/certificates'
