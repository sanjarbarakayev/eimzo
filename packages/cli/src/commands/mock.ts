/**
 * Mock Command - Generate mock certificates for testing
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'

interface MockOptions {
  count?: string
  output?: string
  type?: string
}

interface MockCertificate {
  serialNumber: string
  type: 'pfx' | 'id-card' | 'baik' | 'ckc'
  CN: string
  O: string
  T?: string
  OU?: string
  validFrom: string
  validTo: string
  TIN?: string
  PINFL?: string
}

const FIRST_NAMES = [
  'Aziz',
  'Botir',
  'Davron',
  'Farrux',
  'Gafur',
  'Hamid',
  'Ilhom',
  'Jamshid',
  'Karim',
  'Laziz',
  'Mansur',
  'Nodira',
  'Olim',
  'Pulat',
  'Rustam',
  'Sardor',
  'Temur',
  'Ulugbek',
  'Vohid',
  'Yusuf',
]

const LAST_NAMES = [
  'Abdullayev',
  'Boymatov',
  'Choriyev',
  'Davlatov',
  'Ergashev',
  'Fayzullayev',
  'Gulomov',
  'Hakimov',
  'Ismoilov',
  'Jurayev',
  'Karimov',
  'Latipov',
  'Mahmudov',
  'Nazarov',
  'Olimov',
  'Primov',
  'Qodirov',
  'Rahimov',
  'Salimov',
  'Toshmatov',
]

const ORGANIZATIONS = [
  'TechnoSoft LLC',
  'UzDigital Solutions',
  'InfoTech Systems',
  'CyberSecure Co',
  'DataFlow Inc',
  'SmartCode Ltd',
  'CloudNine Services',
  'DevMasters Group',
]

const POSITIONS = [
  'Director',
  'Chief Accountant',
  'Manager',
  'Developer',
  'Analyst',
]

export async function mockCommand(options: MockOptions): Promise<void> {
  const count = Number.parseInt(options.count || '3', 10)
  const certType = (options.type || 'pfx') as MockCertificate['type']

  console.log(pc.bold('\nGenerating Mock Certificates\n'))
  console.log(pc.dim(`Count: ${count}`))
  console.log(pc.dim(`Type: ${certType}`))
  console.log()

  const certificates: MockCertificate[] = []

  for (let i = 0; i < count; i++) {
    const cert = generateMockCertificate(certType, i)
    certificates.push(cert)

    console.log(`${pc.green('+')} ${cert.CN}`)
    console.log(`  ${pc.dim('Organization:')} ${cert.O}`)
    console.log(`  ${pc.dim('Type:')} ${cert.type}`)
    console.log(`  ${pc.dim('Valid:')} ${cert.validFrom} - ${cert.validTo}`)
    console.log()
  }

  // Output to file if specified
  if (options.output) {
    const outputPath = path.resolve(options.output)
    const content = JSON.stringify(certificates, null, 2)

    await fs.writeFile(outputPath, content, 'utf-8')
    console.log(pc.green(`Certificates saved to ${outputPath}`))
    console.log()
  }

  // Output TypeScript code
  console.log(pc.bold('Usage in tests:'))
  console.log()
  console.log(pc.dim('import type { Certificate } from \'@eimzo/core\''))
  console.log()
  console.log(pc.dim('const mockCertificates: Certificate[] = '))
  console.log(JSON.stringify(certificates, null, 2))
  console.log()

  // Provide helper code
  console.log(pc.bold('Or use with MockWebSocketAdapter:'))
  console.log()
  console.log(pc.dim(`import { MockWebSocketAdapter, createEIMZOClient } from '@eimzo/core'

const mockAdapter = new MockWebSocketAdapter({
  certificates: mockCertificates,
})

const client = createEIMZOClient({
  adapter: mockAdapter,
})`))
  console.log()
}

function generateMockCertificate(
  type: MockCertificate['type'],
  index: number,
): MockCertificate {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
  const lastName = LAST_NAMES[(index + 5) % LAST_NAMES.length]
  const org = ORGANIZATIONS[index % ORGANIZATIONS.length]
  const position = POSITIONS[index % POSITIONS.length]

  // Generate dates
  const validFrom = new Date()
  validFrom.setFullYear(validFrom.getFullYear() - 1)

  const validTo = new Date()
  validTo.setFullYear(validTo.getFullYear() + 1)

  // Generate IDs
  const serialNumber = generateSerialNumber()
  const tin = generateTIN()
  const pinfl = generatePINFL()

  return {
    serialNumber,
    type,
    CN: `${lastName.toUpperCase()} ${firstName.toUpperCase()}`,
    O: org,
    T: position,
    OU: 'IT Department',
    validFrom: validFrom.toISOString(),
    validTo: validTo.toISOString(),
    TIN: tin,
    PINFL: pinfl,
  }
}

function generateSerialNumber(): string {
  const chars = '0123456789ABCDEF'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
    if (i > 0 && i < 31 && i % 2 === 1) {
      result += ':'
    }
  }
  return result
}

function generateTIN(): string {
  let result = ''
  for (let i = 0; i < 9; i++) {
    result += Math.floor(Math.random() * 10)
  }
  return result
}

function generatePINFL(): string {
  // PINFL format: 14 digits
  let result = ''
  // First digit: gender (3 = male born 1900-1999, 4 = female born 1900-1999, etc.)
  result += (3 + Math.floor(Math.random() * 2)).toString()

  // Next 6 digits: birth date DDMMYY
  const day = (1 + Math.floor(Math.random() * 28)).toString().padStart(2, '0')
  const month = (1 + Math.floor(Math.random() * 12)).toString().padStart(2, '0')
  const year = (80 + Math.floor(Math.random() * 20)).toString()
  result += day + month + year

  // Remaining 7 digits: random
  for (let i = 0; i < 7; i++) {
    result += Math.floor(Math.random() * 10)
  }

  return result
}
