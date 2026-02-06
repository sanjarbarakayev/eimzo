import type { PfxCertificate, FtjcCertificate } from '@eimzo/core'

/**
 * Mock PFX certificate for testing
 */
export const mockPfxCertificate: PfxCertificate = {
  type: 'pfx',
  serialNumber: '1234567890',
  validFrom: new Date('2024-01-01T00:00:00.000Z'),
  validTo: new Date('2025-12-31T23:59:59.999Z'),
  CN: 'Test User',
  TIN: '123456789',
  PINFL: '12345678901234',
  UID: 'test-uid-123',
  O: 'Test Organization',
  T: 'Developer',
  disk: 'C',
  path: '/certs',
  name: 'test-cert.pfx',
  alias: 'CN=Test User,O=Test Organization',
}

/**
 * Mock expired PFX certificate for testing
 */
export const mockExpiredPfxCertificate: PfxCertificate = {
  ...mockPfxCertificate,
  serialNumber: '9876543210',
  validFrom: new Date('2020-01-01T00:00:00.000Z'),
  validTo: new Date('2021-12-31T23:59:59.999Z'),
  name: 'expired-cert.pfx',
}

/**
 * Mock FTJC (hardware token) certificate for testing
 */
export const mockFtjcCertificate: FtjcCertificate = {
  type: 'ftjc',
  serialNumber: 'FTJC1234567890',
  validFrom: new Date('2024-01-01T00:00:00.000Z'),
  validTo: new Date('2025-12-31T23:59:59.999Z'),
  CN: 'Token User',
  TIN: '987654321',
  PINFL: '98765432109876',
  UID: 'ftjc-uid-456',
  O: 'Token Organization',
  T: 'Manager',
  cardUID: 'CARD-UID-12345',
  statusInfo: 'Active',
  ownerName: 'Token User',
  info: 'FTJC Smart Card Certificate',
}

/**
 * Mock PKCS7 signature result
 */
export const mockPkcs7Signature = {
  pkcs7_64:
    'MIIGSAYJKoZIhvcNAQcCoIIGOTCCBjUCAQExDjAMBggqgzOCAQEDAgUAMAsGCSqGSIb3DQEHAaCCBDkwggQ1MIIDnaADAgECAhQ=',
  signature_hex: 'abc123def456',
  signer_serial_number: '1234567890',
}

/**
 * Mock version info
 */
export const mockVersionInfo = {
  major: 3,
  minor: 37,
}

/**
 * Create a mock PFX certificate with custom properties
 */
export function createMockPfxCertificate(overrides: Partial<PfxCertificate> = {}): PfxCertificate {
  return {
    ...mockPfxCertificate,
    ...overrides,
  }
}

/**
 * Create a mock FTJC certificate with custom properties
 */
export function createMockFtjcCertificate(
  overrides: Partial<FtjcCertificate> = {}
): FtjcCertificate {
  return {
    ...mockFtjcCertificate,
    ...overrides,
  }
}

/**
 * Create multiple mock certificates for testing list operations
 */
export function createMockCertificateList(count: number = 3): PfxCertificate[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPfxCertificate({
      serialNumber: `CERT-${i + 1}`,
      CN: `Test User ${i + 1}`,
      name: `cert-${i + 1}.pfx`,
    })
  )
}
