/**
 * Mock certificates for playground testing
 */

import type { Certificate } from '@eimzo/core'

export const mockCertificates: Certificate[] = [
  {
    serialNumber: '01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF',
    type: 'pfx',
    CN: 'TOSHMATOV ALISHER KARIMOVICH',
    O: 'TECHNOSOFT LLC',
    T: 'Director',
    OU: 'Management',
    validFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    TIN: '123456789',
    PINFL: '31234567890123',
  },
  {
    serialNumber: 'FE:DC:BA:98:76:54:32:10:FE:DC:BA:98:76:54:32:10',
    type: 'pfx',
    CN: 'ABDULLAYEV BOBUR RUSTAMOVICH',
    O: 'DIGITAL SOLUTIONS LLC',
    T: 'Chief Accountant',
    OU: 'Finance',
    validFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    TIN: '987654321',
    PINFL: '41234567890123',
  },
  {
    serialNumber: 'AA:BB:CC:DD:EE:FF:00:11:AA:BB:CC:DD:EE:FF:00:11',
    type: 'id-card',
    CN: 'KARIMOVA NILUFAR SHAVKATOVNA',
    O: 'MINISTRY OF FINANCE',
    T: 'Specialist',
    OU: 'IT Department',
    validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000),
    TIN: '456789123',
    PINFL: '42345678901234',
  },
  {
    serialNumber: '11:22:33:44:55:66:77:88:11:22:33:44:55:66:77:88',
    type: 'baik',
    CN: 'RAHIMOV SARDOR OLIMJONOVICH',
    O: 'NATIONAL BANK OF UZBEKISTAN',
    T: 'Manager',
    OU: 'Operations',
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
    TIN: '789123456',
    PINFL: '31456789012345',
  },
  {
    serialNumber: '99:88:77:66:55:44:33:22:99:88:77:66:55:44:33:22',
    type: 'pfx',
    CN: 'EXPIRED CERTIFICATE (TEST)',
    O: 'TEST ORGANIZATION',
    T: 'Tester',
    validFrom: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired
    TIN: '000000000',
    PINFL: '30000000000000',
  },
]
