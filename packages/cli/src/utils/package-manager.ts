/**
 * Package Manager Detection and Execution
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

export type PackageManager = 'pnpm' | 'npm' | 'yarn'

export async function detectPackageManager(): Promise<PackageManager | null> {
  const cwd = process.cwd()

  // Check for lock files
  try {
    await fs.access(path.join(cwd, 'pnpm-lock.yaml'))
    return 'pnpm'
  }
  catch {}

  try {
    await fs.access(path.join(cwd, 'yarn.lock'))
    return 'yarn'
  }
  catch {}

  try {
    await fs.access(path.join(cwd, 'package-lock.json'))
    return 'npm'
  }
  catch {}

  // Check environment variable
  const userAgent = process.env.npm_config_user_agent
  if (userAgent) {
    if (userAgent.startsWith('pnpm'))
      return 'pnpm'
    if (userAgent.startsWith('yarn'))
      return 'yarn'
    if (userAgent.startsWith('npm'))
      return 'npm'
  }

  return null
}

export async function runPackageManager(
  pm: string,
  command: string,
  args: string[],
): Promise<void> {
  const fullArgs = [command, ...args]

  return new Promise((resolve, reject) => {
    const child = spawn(pm, fullArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      }
      else {
        reject(new Error(`${pm} ${command} failed with code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}
