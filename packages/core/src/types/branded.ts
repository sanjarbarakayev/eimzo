/**
 * Nominal Types for E-IMZO SDK
 *
 * Uses class-based approach with private fields for true nominal typing.
 * No `as` type assertions - TypeScript's private fields create genuine
 * type distinctions that cannot be bypassed.
 *
 * @example
 * ```typescript
 * const keyId = KeyId.create('key-123');
 * const certId = CertificateId.create('SN123', 0);
 *
 * // Type error: Cannot assign CertificateId to KeyId
 * const wrongKeyId: KeyId = certId;
 *
 * // Get string value
 * console.log(keyId.toString()); // 'key-123'
 * ```
 */

/**
 * Validation error for branded type creation
 */
export class BrandedTypeError extends Error {
  constructor(
    public readonly typeName: string,
    public readonly value: unknown,
    message: string,
  ) {
    super(message)
    this.name = 'BrandedTypeError'
  }
}

/**
 * Nominal type for key identifiers
 *
 * Returned by loadKey operations and used for signing.
 * The private field ensures true nominal typing - TypeScript
 * cannot structurally match this type.
 *
 * @example
 * ```typescript
 * const keyId = KeyId.create(response.keyId);
 * await client.createPkcs7(keyId.toString(), data);
 *
 * // Or use tryCreate for nullable result
 * const maybeKeyId = KeyId.tryCreate(untrustedInput);
 * if (maybeKeyId) {
 *   // Use maybeKeyId
 * }
 * ```
 */
export class KeyId {
  /** Private field creates true nominal typing */
  readonly #value: string

  private constructor(value: string) {
    this.#value = value
  }

  /**
   * Creates a KeyId from a string
   *
   * @param id - Raw key identifier string from CAPIWS
   * @returns KeyId instance
   * @throws BrandedTypeError if id is invalid
   */
  static create(id: string): KeyId {
    if (!KeyId.isValid(id)) {
      throw new BrandedTypeError(
        'KeyId',
        id,
        'KeyId must be a non-empty string',
      )
    }
    return new KeyId(id)
  }

  /**
   * Attempts to create a KeyId, returning null on invalid input
   *
   * @param id - Raw key identifier string
   * @returns KeyId instance or null if invalid
   */
  static tryCreate(id: string): KeyId | null {
    if (!KeyId.isValid(id)) {
      return null
    }
    return new KeyId(id)
  }

  /**
   * Validates if a value would be a valid KeyId
   *
   * @param value - Value to check
   * @returns True if value is valid for KeyId creation
   */
  static isValid(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0
  }

  /**
   * Type guard to check if a value is a KeyId instance
   *
   * @param value - Value to check
   * @returns True if value is a KeyId instance
   */
  static isKeyId(value: unknown): value is KeyId {
    return value instanceof KeyId
  }

  /**
   * Returns the underlying string value
   */
  toString(): string {
    return this.#value
  }

  /**
   * Returns the underlying string value (for implicit conversion)
   */
  valueOf(): string {
    return this.#value
  }

  /**
   * Returns the underlying string value (for JSON serialization)
   */
  toJSON(): string {
    return this.#value
  }

  /**
   * Compares equality with another KeyId
   */
  equals(other: KeyId): boolean {
    return this.#value === other.#value
  }
}

/**
 * Nominal type for certificate identifiers
 *
 * Used to uniquely identify certificates in the UI and storage.
 * Format: `{serialNumber}:{index}`
 *
 * @example
 * ```typescript
 * const certId = CertificateId.create(cert.serialNumber, 0);
 * console.log(certId.toString()); // "ABC123:0"
 *
 * // Parse components
 * const { serialNumber, index } = certId.parse();
 * ```
 */
export class CertificateId {
  /** Private field creates true nominal typing */
  readonly #value: string
  readonly #serialNumber: string
  readonly #index: number

  private constructor(serialNumber: string, index: number) {
    this.#serialNumber = serialNumber
    this.#index = index
    this.#value = `${serialNumber}:${index}`
  }

  /**
   * Creates a CertificateId from serial number and index
   *
   * @param serialNumber - Certificate serial number
   * @param index - Certificate index in the list
   * @returns CertificateId instance
   * @throws BrandedTypeError if inputs are invalid
   */
  static create(serialNumber: string, index: string | number): CertificateId {
    const numIndex = typeof index === 'string' ? Number.parseInt(index, 10) : index

    if (!CertificateId.isValidComponents(serialNumber, numIndex)) {
      throw new BrandedTypeError(
        'CertificateId',
        { serialNumber, index },
        'CertificateId requires non-empty serialNumber and non-negative integer index',
      )
    }
    return new CertificateId(serialNumber, numIndex)
  }

  /**
   * Attempts to create a CertificateId, returning null on invalid input
   *
   * @param serialNumber - Certificate serial number
   * @param index - Certificate index in the list
   * @returns CertificateId instance or null if invalid
   */
  static tryCreate(
    serialNumber: string,
    index: string | number,
  ): CertificateId | null {
    const numIndex = typeof index === 'string' ? Number.parseInt(index, 10) : index

    if (!CertificateId.isValidComponents(serialNumber, numIndex)) {
      return null
    }
    return new CertificateId(serialNumber, numIndex)
  }

  /**
   * Parses a string in format "serialNumber:index" into a CertificateId
   *
   * @param value - String to parse
   * @returns CertificateId instance
   * @throws BrandedTypeError if format is invalid
   */
  static fromString(value: string): CertificateId {
    const parsed = CertificateId.tryFromString(value)
    if (!parsed) {
      throw new BrandedTypeError(
        'CertificateId',
        value,
        'CertificateId must be in format "serialNumber:index"',
      )
    }
    return parsed
  }

  /**
   * Attempts to parse a string into a CertificateId
   *
   * @param value - String to parse
   * @returns CertificateId instance or null if invalid
   */
  static tryFromString(value: string): CertificateId | null {
    if (typeof value !== 'string' || value.length === 0) {
      return null
    }
    const parts = value.split(':')
    if (parts.length !== 2) {
      return null
    }
    const [serialNumber, indexStr] = parts
    if (!serialNumber || !/^\d+$/.test(indexStr)) {
      return null
    }
    const index = Number.parseInt(indexStr, 10)
    return new CertificateId(serialNumber, index)
  }

  /**
   * Validates if components would create a valid CertificateId
   */
  private static isValidComponents(
    serialNumber: unknown,
    index: unknown,
  ): boolean {
    return (
      typeof serialNumber === 'string'
      && serialNumber.length > 0
      && typeof index === 'number'
      && Number.isInteger(index)
      && index >= 0
    )
  }

  /**
   * Type guard to check if a value is a CertificateId instance
   */
  static isCertificateId(value: unknown): value is CertificateId {
    return value instanceof CertificateId
  }

  /**
   * Returns the underlying string value
   */
  toString(): string {
    return this.#value
  }

  /**
   * Returns the underlying string value (for implicit conversion)
   */
  valueOf(): string {
    return this.#value
  }

  /**
   * Returns the underlying string value (for JSON serialization)
   */
  toJSON(): string {
    return this.#value
  }

  /**
   * Returns the parsed components
   */
  parse(): { serialNumber: string, index: number } {
    return {
      serialNumber: this.#serialNumber,
      index: this.#index,
    }
  }

  /**
   * Returns the serial number component
   */
  get serialNumber(): string {
    return this.#serialNumber
  }

  /**
   * Returns the index component
   */
  get index(): number {
    return this.#index
  }

  /**
   * Compares equality with another CertificateId
   */
  equals(other: CertificateId): boolean {
    return this.#value === other.#value
  }
}

// ============================================================================
// Legacy Compatibility Functions
// ============================================================================

/**
 * Creates a KeyId from a string
 * @deprecated Use KeyId.create() instead
 */
export function createKeyId(id: string): KeyId {
  return KeyId.create(id)
}

/**
 * Creates a CertificateId from serial number and index
 * @deprecated Use CertificateId.create() instead
 */
export function createCertificateId(
  serialNumber: string,
  index: string | number,
): CertificateId {
  return CertificateId.create(serialNumber, index)
}

/**
 * Validates if a value is a valid KeyId
 * @deprecated Use KeyId.isKeyId() instead
 */
export function isValidKeyId(value: unknown): value is KeyId {
  return KeyId.isKeyId(value)
}

/**
 * Validates if a value is a valid CertificateId
 * @deprecated Use CertificateId.isCertificateId() instead
 */
export function isValidCertificateId(value: unknown): value is CertificateId {
  return CertificateId.isCertificateId(value)
}

/**
 * Extracts the underlying string value from a branded type
 * @deprecated Use .toString() method instead
 */
export function unwrapBrand(branded: KeyId | CertificateId): string {
  return branded.toString()
}

/**
 * Parses a CertificateId to extract its components
 * @deprecated Use CertificateId.parse() method instead
 */
export function parseCertificateId(
  certId: CertificateId,
): { serialNumber: string, index: number } {
  return certId.parse()
}
