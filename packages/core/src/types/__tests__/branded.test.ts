import { describe, expect, it } from 'vitest'
import {
  BrandedTypeError,
  CertificateId,
  createCertificateId,
  createKeyId,
  isValidCertificateId,
  isValidKeyId,
  KeyId,
  parseCertificateId,
  unwrapBrand,
} from '../branded'

describe('keyId', () => {
  describe('keyId.create', () => {
    it('should create a KeyId from a valid string', () => {
      const keyId = KeyId.create('key-123')
      expect(keyId.toString()).toBe('key-123')
    })

    it('should throw BrandedTypeError for empty string', () => {
      expect(() => KeyId.create('')).toThrow(BrandedTypeError)
      expect(() => KeyId.create('')).toThrow('KeyId must be a non-empty string')
    })

    it('should preserve the string value', () => {
      const rawId = 'abc-def-ghi'
      const keyId = KeyId.create(rawId)
      expect(keyId.toString()).toBe(rawId)
    })
  })

  describe('keyId.tryCreate', () => {
    it('should return KeyId for valid string', () => {
      const keyId = KeyId.tryCreate('key-123')
      expect(keyId).not.toBeNull()
      expect(keyId?.toString()).toBe('key-123')
    })

    it('should return null for empty string', () => {
      expect(KeyId.tryCreate('')).toBeNull()
    })

    it('should return null for non-string', () => {
      expect(KeyId.tryCreate(123 as unknown as string)).toBeNull()
      expect(KeyId.tryCreate(null as unknown as string)).toBeNull()
    })
  })

  describe('keyId.isValid', () => {
    it('should return true for non-empty strings', () => {
      expect(KeyId.isValid('key-123')).toBe(true)
      expect(KeyId.isValid('a')).toBe(true)
      expect(KeyId.isValid('12345')).toBe(true)
    })

    it('should return false for empty strings', () => {
      expect(KeyId.isValid('')).toBe(false)
    })

    it('should return false for non-strings', () => {
      expect(KeyId.isValid(123)).toBe(false)
      expect(KeyId.isValid(null)).toBe(false)
      expect(KeyId.isValid(undefined)).toBe(false)
      expect(KeyId.isValid({})).toBe(false)
      expect(KeyId.isValid([])).toBe(false)
    })
  })

  describe('keyId.isKeyId', () => {
    it('should return true for KeyId instances', () => {
      const keyId = KeyId.create('test')
      expect(KeyId.isKeyId(keyId)).toBe(true)
    })

    it('should return false for non-KeyId values', () => {
      expect(KeyId.isKeyId('test')).toBe(false)
      expect(KeyId.isKeyId(123)).toBe(false)
      expect(KeyId.isKeyId(null)).toBe(false)
      expect(KeyId.isKeyId({})).toBe(false)
    })
  })

  describe('keyId methods', () => {
    it('toString should return the value', () => {
      const keyId = KeyId.create('key-456')
      expect(keyId.toString()).toBe('key-456')
    })

    it('valueOf should return the value', () => {
      const keyId = KeyId.create('key-456')
      expect(keyId.valueOf()).toBe('key-456')
    })

    it('toJSON should return the value', () => {
      const keyId = KeyId.create('key-456')
      expect(keyId.toJSON()).toBe('key-456')
      expect(JSON.stringify({ id: keyId })).toBe('{"id":"key-456"}')
    })

    it('equals should compare values', () => {
      const keyId1 = KeyId.create('key-123')
      const keyId2 = KeyId.create('key-123')
      const keyId3 = KeyId.create('key-456')
      expect(keyId1.equals(keyId2)).toBe(true)
      expect(keyId1.equals(keyId3)).toBe(false)
    })
  })
})

describe('certificateId', () => {
  describe('certificateId.create', () => {
    it('should create CertificateId from serial number and numeric index', () => {
      const certId = CertificateId.create('SN123456', 0)
      expect(certId.toString()).toBe('SN123456:0')
    })

    it('should create CertificateId from serial number and string index', () => {
      const certId = CertificateId.create('SN789', '5')
      expect(certId.toString()).toBe('SN789:5')
    })

    it('should handle complex serial numbers', () => {
      const certId = CertificateId.create('ABC-123-XYZ', 10)
      expect(certId.toString()).toBe('ABC-123-XYZ:10')
    })

    it('should throw for empty serial number', () => {
      expect(() => CertificateId.create('', 0)).toThrow(BrandedTypeError)
    })

    it('should throw for negative index', () => {
      expect(() => CertificateId.create('SN123', -1)).toThrow(BrandedTypeError)
    })

    it('should throw for non-integer index', () => {
      expect(() => CertificateId.create('SN123', 1.5)).toThrow(BrandedTypeError)
    })
  })

  describe('certificateId.tryCreate', () => {
    it('should return CertificateId for valid inputs', () => {
      const certId = CertificateId.tryCreate('SN123', 5)
      expect(certId).not.toBeNull()
      expect(certId?.toString()).toBe('SN123:5')
    })

    it('should return null for invalid inputs', () => {
      expect(CertificateId.tryCreate('', 0)).toBeNull()
      expect(CertificateId.tryCreate('SN123', -1)).toBeNull()
    })
  })

  describe('certificateId.fromString', () => {
    it('should parse valid string format', () => {
      const certId = CertificateId.fromString('SN123:5')
      expect(certId.toString()).toBe('SN123:5')
      expect(certId.serialNumber).toBe('SN123')
      expect(certId.index).toBe(5)
    })

    it('should throw for invalid format', () => {
      expect(() => CertificateId.fromString('invalid')).toThrow(BrandedTypeError)
      expect(() => CertificateId.fromString('SN123')).toThrow(BrandedTypeError)
      expect(() => CertificateId.fromString(':0')).toThrow(BrandedTypeError)
    })
  })

  describe('certificateId.tryFromString', () => {
    it('should return CertificateId for valid format', () => {
      const certId = CertificateId.tryFromString('SN123:0')
      expect(certId).not.toBeNull()
      expect(certId?.toString()).toBe('SN123:0')
    })

    it('should return null for missing colon', () => {
      expect(CertificateId.tryFromString('SN123')).toBeNull()
    })

    it('should return null for non-numeric index', () => {
      expect(CertificateId.tryFromString('SN123:abc')).toBeNull()
    })

    it('should return null for empty serial number', () => {
      expect(CertificateId.tryFromString(':0')).toBeNull()
    })

    it('should return null for multiple colons', () => {
      expect(CertificateId.tryFromString('SN:123:456')).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(CertificateId.tryFromString('')).toBeNull()
    })
  })

  describe('certificateId.isCertificateId', () => {
    it('should return true for CertificateId instances', () => {
      const certId = CertificateId.create('SN123', 0)
      expect(CertificateId.isCertificateId(certId)).toBe(true)
    })

    it('should return false for non-CertificateId values', () => {
      expect(CertificateId.isCertificateId('SN123:0')).toBe(false)
      expect(CertificateId.isCertificateId(123)).toBe(false)
      expect(CertificateId.isCertificateId(null)).toBe(false)
    })
  })

  describe('certificateId methods', () => {
    it('toString should return the formatted value', () => {
      const certId = CertificateId.create('SN999', 7)
      expect(certId.toString()).toBe('SN999:7')
    })

    it('valueOf should return the formatted value', () => {
      const certId = CertificateId.create('SN999', 7)
      expect(certId.valueOf()).toBe('SN999:7')
    })

    it('toJSON should return the formatted value', () => {
      const certId = CertificateId.create('SN999', 7)
      expect(JSON.stringify({ id: certId })).toBe('{"id":"SN999:7"}')
    })

    it('parse should return components', () => {
      const certId = CertificateId.create('ABC-DEF', 100)
      const parsed = certId.parse()
      expect(parsed).toEqual({ serialNumber: 'ABC-DEF', index: 100 })
    })

    it('serialNumber getter should return serial number', () => {
      const certId = CertificateId.create('SN123', 5)
      expect(certId.serialNumber).toBe('SN123')
    })

    it('index getter should return index', () => {
      const certId = CertificateId.create('SN123', 5)
      expect(certId.index).toBe(5)
    })

    it('equals should compare values', () => {
      const certId1 = CertificateId.create('SN123', 0)
      const certId2 = CertificateId.create('SN123', 0)
      const certId3 = CertificateId.create('SN123', 1)
      expect(certId1.equals(certId2)).toBe(true)
      expect(certId1.equals(certId3)).toBe(false)
    })
  })
})

describe('legacy compatibility functions', () => {
  describe('createKeyId', () => {
    it('should create KeyId using legacy function', () => {
      const keyId = createKeyId('key-123')
      expect(keyId.toString()).toBe('key-123')
      expect(KeyId.isKeyId(keyId)).toBe(true)
    })
  })

  describe('createCertificateId', () => {
    it('should create CertificateId using legacy function', () => {
      const certId = createCertificateId('SN123', 0)
      expect(certId.toString()).toBe('SN123:0')
      expect(CertificateId.isCertificateId(certId)).toBe(true)
    })
  })

  describe('isValidKeyId', () => {
    it('should return true for KeyId instances', () => {
      const keyId = KeyId.create('test')
      expect(isValidKeyId(keyId)).toBe(true)
    })

    it('should return false for non-KeyId values', () => {
      expect(isValidKeyId('test')).toBe(false)
      expect(isValidKeyId(null)).toBe(false)
    })
  })

  describe('isValidCertificateId', () => {
    it('should return true for CertificateId instances', () => {
      const certId = CertificateId.create('SN123', 0)
      expect(isValidCertificateId(certId)).toBe(true)
    })

    it('should return false for non-CertificateId values', () => {
      expect(isValidCertificateId('SN123:0')).toBe(false)
      expect(isValidCertificateId(null)).toBe(false)
    })
  })

  describe('unwrapBrand', () => {
    it('should extract string from KeyId', () => {
      const keyId = KeyId.create('key-456')
      expect(unwrapBrand(keyId)).toBe('key-456')
    })

    it('should extract string from CertificateId', () => {
      const certId = CertificateId.create('SN999', 7)
      expect(unwrapBrand(certId)).toBe('SN999:7')
    })
  })

  describe('parseCertificateId', () => {
    it('should parse CertificateId components', () => {
      const certId = CertificateId.create('SN123', 5)
      const result = parseCertificateId(certId)
      expect(result).toEqual({ serialNumber: 'SN123', index: 5 })
    })
  })
})

describe('type safety', () => {
  it('keyId and CertificateId should be different types', () => {
    const keyId = KeyId.create('test')
    const certId = CertificateId.create('test', 0)

    // These are different types at compile time
    expect(KeyId.isKeyId(keyId)).toBe(true)
    expect(KeyId.isKeyId(certId)).toBe(false)
    expect(CertificateId.isCertificateId(certId)).toBe(true)
    expect(CertificateId.isCertificateId(keyId)).toBe(false)
  })

  it('should serialize correctly with JSON', () => {
    const keyId = KeyId.create('key-123')
    const certId = CertificateId.create('SN456', 2)

    const obj = { keyId, certId }
    const json = JSON.stringify(obj)

    expect(json).toBe('{"keyId":"key-123","certId":"SN456:2"}')
  })

  it('should work with string concatenation', () => {
    const keyId = KeyId.create('key-123')
    expect(`Key: ${keyId}`).toBe('Key: key-123')
  })
})
