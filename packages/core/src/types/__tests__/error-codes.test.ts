import type { ErrorCode } from '../error-codes'
import { describe, expect, it } from 'vitest'
import {
  APPLICATION_ERROR_CODES,
  CERTIFICATE_ERROR_CODES,
  CONNECTION_ERROR_CODES,
  DEVICE_ERROR_CODES,
  ERROR_CODE_DESCRIPTIONS,
  ERROR_CODES,

  getErrorDescription,
  isApplicationErrorCode,
  isCertificateErrorCode,
  isConnectionErrorCode,
  isDeviceErrorCode,
  isRetryableCode,
  RETRYABLE_ERROR_CODES,
} from '../error-codes'

describe('error-codes', () => {
  describe('eRROR_CODES', () => {
    it('should have all expected error codes', () => {
      expect(ERROR_CODES.CONNECTION_FAILED).toBe('CONNECTION_FAILED')
      expect(ERROR_CODES.CONNECTION_LOST).toBe('CONNECTION_LOST')
      expect(ERROR_CODES.TIMEOUT).toBe('TIMEOUT')
      expect(ERROR_CODES.RETRY_EXHAUSTED).toBe('RETRY_EXHAUSTED')
      expect(ERROR_CODES.WRONG_PASSWORD).toBe('WRONG_PASSWORD')
      expect(ERROR_CODES.CERTIFICATE_NOT_FOUND).toBe('CERTIFICATE_NOT_FOUND')
      expect(ERROR_CODES.CERTIFICATE_EXPIRED).toBe('CERTIFICATE_EXPIRED')
      expect(ERROR_CODES.CERTIFICATE_NOT_YET_VALID).toBe('CERTIFICATE_NOT_YET_VALID')
      expect(ERROR_CODES.KEY_LOAD_ERROR).toBe('KEY_LOAD_ERROR')
      expect(ERROR_CODES.NO_READER).toBe('NO_READER')
      expect(ERROR_CODES.CARD_NOT_FOUND).toBe('CARD_NOT_FOUND')
      expect(ERROR_CODES.DEVICE_NOT_FOUND).toBe('DEVICE_NOT_FOUND')
      expect(ERROR_CODES.EIMZO_NOT_INSTALLED).toBe('EIMZO_NOT_INSTALLED')
      expect(ERROR_CODES.VERSION_OUTDATED).toBe('VERSION_OUTDATED')
      expect(ERROR_CODES.VERSION_UNDEFINED).toBe('VERSION_UNDEFINED')
      expect(ERROR_CODES.CRYPTO_API_ERROR).toBe('CRYPTO_API_ERROR')
      expect(ERROR_CODES.SIGNING_ERROR).toBe('SIGNING_ERROR')
      expect(ERROR_CODES.WEBSOCKET_NOT_SUPPORTED).toBe('WEBSOCKET_NOT_SUPPORTED')
      expect(ERROR_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR')
    })

    it('should be immutable (const assertion)', () => {
      // ERROR_CODES values should be literal types, not just strings
      const code: 'CONNECTION_FAILED' = ERROR_CODES.CONNECTION_FAILED
      expect(code).toBe('CONNECTION_FAILED')
    })
  })

  describe('error code categories', () => {
    it('rETRYABLE_ERROR_CODES should include transient errors', () => {
      expect(RETRYABLE_ERROR_CODES).toContain('CONNECTION_FAILED')
      expect(RETRYABLE_ERROR_CODES).toContain('CONNECTION_LOST')
      expect(RETRYABLE_ERROR_CODES).toContain('TIMEOUT')
    })

    it('cONNECTION_ERROR_CODES should include all connection-related errors', () => {
      expect(CONNECTION_ERROR_CODES).toContain('CONNECTION_FAILED')
      expect(CONNECTION_ERROR_CODES).toContain('CONNECTION_LOST')
      expect(CONNECTION_ERROR_CODES).toContain('TIMEOUT')
      expect(CONNECTION_ERROR_CODES).toContain('RETRY_EXHAUSTED')
      expect(CONNECTION_ERROR_CODES).toContain('WEBSOCKET_NOT_SUPPORTED')
    })

    it('cERTIFICATE_ERROR_CODES should include all certificate-related errors', () => {
      expect(CERTIFICATE_ERROR_CODES).toContain('CERTIFICATE_NOT_FOUND')
      expect(CERTIFICATE_ERROR_CODES).toContain('CERTIFICATE_EXPIRED')
      expect(CERTIFICATE_ERROR_CODES).toContain('CERTIFICATE_NOT_YET_VALID')
      expect(CERTIFICATE_ERROR_CODES).toContain('KEY_LOAD_ERROR')
    })

    it('dEVICE_ERROR_CODES should include all device-related errors', () => {
      expect(DEVICE_ERROR_CODES).toContain('NO_READER')
      expect(DEVICE_ERROR_CODES).toContain('CARD_NOT_FOUND')
      expect(DEVICE_ERROR_CODES).toContain('DEVICE_NOT_FOUND')
    })

    it('aPPLICATION_ERROR_CODES should include all application-related errors', () => {
      expect(APPLICATION_ERROR_CODES).toContain('EIMZO_NOT_INSTALLED')
      expect(APPLICATION_ERROR_CODES).toContain('VERSION_OUTDATED')
      expect(APPLICATION_ERROR_CODES).toContain('VERSION_UNDEFINED')
      expect(APPLICATION_ERROR_CODES).toContain('CRYPTO_API_ERROR')
    })
  })

  describe('isRetryableCode', () => {
    it('should return true for retryable codes', () => {
      expect(isRetryableCode(ERROR_CODES.CONNECTION_FAILED)).toBe(true)
      expect(isRetryableCode(ERROR_CODES.CONNECTION_LOST)).toBe(true)
      expect(isRetryableCode(ERROR_CODES.TIMEOUT)).toBe(true)
    })

    it('should return false for non-retryable codes', () => {
      expect(isRetryableCode(ERROR_CODES.WRONG_PASSWORD)).toBe(false)
      expect(isRetryableCode(ERROR_CODES.CERTIFICATE_EXPIRED)).toBe(false)
      expect(isRetryableCode(ERROR_CODES.EIMZO_NOT_INSTALLED)).toBe(false)
      expect(isRetryableCode(ERROR_CODES.UNKNOWN_ERROR)).toBe(false)
    })
  })

  describe('isConnectionErrorCode', () => {
    it('should return true for connection error codes', () => {
      expect(isConnectionErrorCode(ERROR_CODES.CONNECTION_FAILED)).toBe(true)
      expect(isConnectionErrorCode(ERROR_CODES.CONNECTION_LOST)).toBe(true)
      expect(isConnectionErrorCode(ERROR_CODES.TIMEOUT)).toBe(true)
      expect(isConnectionErrorCode(ERROR_CODES.RETRY_EXHAUSTED)).toBe(true)
      expect(isConnectionErrorCode(ERROR_CODES.WEBSOCKET_NOT_SUPPORTED)).toBe(true)
    })

    it('should return false for non-connection error codes', () => {
      expect(isConnectionErrorCode(ERROR_CODES.WRONG_PASSWORD)).toBe(false)
      expect(isConnectionErrorCode(ERROR_CODES.CERTIFICATE_EXPIRED)).toBe(false)
    })
  })

  describe('isCertificateErrorCode', () => {
    it('should return true for certificate error codes', () => {
      expect(isCertificateErrorCode(ERROR_CODES.CERTIFICATE_NOT_FOUND)).toBe(true)
      expect(isCertificateErrorCode(ERROR_CODES.CERTIFICATE_EXPIRED)).toBe(true)
      expect(isCertificateErrorCode(ERROR_CODES.CERTIFICATE_NOT_YET_VALID)).toBe(true)
      expect(isCertificateErrorCode(ERROR_CODES.KEY_LOAD_ERROR)).toBe(true)
    })

    it('should return false for non-certificate error codes', () => {
      expect(isCertificateErrorCode(ERROR_CODES.CONNECTION_FAILED)).toBe(false)
      expect(isCertificateErrorCode(ERROR_CODES.NO_READER)).toBe(false)
    })
  })

  describe('isDeviceErrorCode', () => {
    it('should return true for device error codes', () => {
      expect(isDeviceErrorCode(ERROR_CODES.NO_READER)).toBe(true)
      expect(isDeviceErrorCode(ERROR_CODES.CARD_NOT_FOUND)).toBe(true)
      expect(isDeviceErrorCode(ERROR_CODES.DEVICE_NOT_FOUND)).toBe(true)
    })

    it('should return false for non-device error codes', () => {
      expect(isDeviceErrorCode(ERROR_CODES.CONNECTION_FAILED)).toBe(false)
      expect(isDeviceErrorCode(ERROR_CODES.CERTIFICATE_EXPIRED)).toBe(false)
    })
  })

  describe('isApplicationErrorCode', () => {
    it('should return true for application error codes', () => {
      expect(isApplicationErrorCode(ERROR_CODES.EIMZO_NOT_INSTALLED)).toBe(true)
      expect(isApplicationErrorCode(ERROR_CODES.VERSION_OUTDATED)).toBe(true)
      expect(isApplicationErrorCode(ERROR_CODES.VERSION_UNDEFINED)).toBe(true)
      expect(isApplicationErrorCode(ERROR_CODES.CRYPTO_API_ERROR)).toBe(true)
    })

    it('should return false for non-application error codes', () => {
      expect(isApplicationErrorCode(ERROR_CODES.CONNECTION_FAILED)).toBe(false)
      expect(isApplicationErrorCode(ERROR_CODES.WRONG_PASSWORD)).toBe(false)
    })
  })

  describe('eRROR_CODE_DESCRIPTIONS', () => {
    it('should have descriptions for all error codes', () => {
      const allCodes = Object.values(ERROR_CODES)
      for (const code of allCodes) {
        expect(ERROR_CODE_DESCRIPTIONS[code]).toBeDefined()
        expect(typeof ERROR_CODE_DESCRIPTIONS[code]).toBe('string')
        expect(ERROR_CODE_DESCRIPTIONS[code].length).toBeGreaterThan(0)
      }
    })

    it('should have meaningful descriptions', () => {
      expect(ERROR_CODE_DESCRIPTIONS.CONNECTION_FAILED).toContain('WebSocket')
      expect(ERROR_CODE_DESCRIPTIONS.CERTIFICATE_EXPIRED).toContain('expired')
      expect(ERROR_CODE_DESCRIPTIONS.WRONG_PASSWORD).toContain('password')
    })
  })

  describe('getErrorDescription', () => {
    it('should return description for error code', () => {
      expect(getErrorDescription(ERROR_CODES.CONNECTION_FAILED))
        .toBe(ERROR_CODE_DESCRIPTIONS.CONNECTION_FAILED)
      expect(getErrorDescription(ERROR_CODES.TIMEOUT))
        .toBe(ERROR_CODE_DESCRIPTIONS.TIMEOUT)
    })

    it('should work with all error codes', () => {
      const allCodes = Object.values(ERROR_CODES) as ErrorCode[]
      for (const code of allCodes) {
        const description = getErrorDescription(code)
        expect(typeof description).toBe('string')
        expect(description.length).toBeGreaterThan(0)
      }
    })
  })
})
