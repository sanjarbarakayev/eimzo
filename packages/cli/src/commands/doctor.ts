/**
 * Doctor Command - Diagnose E-IMZO installation
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'

interface DoctorOptions {
  verbose?: boolean
}

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  details?: string
}

export async function doctorCommand(options: DoctorOptions): Promise<void> {
  console.log(pc.bold('\nE-IMZO Doctor\n'))
  console.log(pc.dim('Checking your E-IMZO setup...\n'))

  const results: CheckResult[] = []

  // Check 1: Package.json exists
  const packageJsonCheck = await checkPackageJson()
  results.push(packageJsonCheck)

  // Check 2: @eimzo/core is installed
  const coreCheck = await checkPackageInstalled('@eimzo/core')
  results.push(coreCheck)

  // Check 3: @eimzo/vue is installed (optional)
  const vueCheck = await checkPackageInstalled('@eimzo/vue')
  results.push(vueCheck)

  // Check 4: TypeScript config
  const tsCheck = await checkTypeScriptConfig()
  results.push(tsCheck)

  // Check 5: Node version
  const nodeCheck = checkNodeVersion()
  results.push(nodeCheck)

  // Check 6: E-IMZO WebSocket URL accessibility (local check)
  const wsCheck = await checkWebSocketUrl()
  results.push(wsCheck)

  // Print results
  console.log()
  for (const result of results) {
    const icon
      = result.status === 'pass'
        ? pc.green('✓')
        : result.status === 'warn'
          ? pc.yellow('⚠')
          : pc.red('✗')

    console.log(`  ${icon} ${result.name}`)
    console.log(`    ${pc.dim(result.message)}`)

    if (options.verbose && result.details) {
      console.log(`    ${pc.dim(result.details)}`)
    }
    console.log()
  }

  // Summary
  const passed = results.filter(r => r.status === 'pass').length
  const warnings = results.filter(r => r.status === 'warn').length
  const failed = results.filter(r => r.status === 'fail').length

  console.log(pc.bold('Summary:'))
  console.log(`  ${pc.green(`${passed} passed`)}, ${pc.yellow(`${warnings} warnings`)}, ${pc.red(`${failed} failed`)}`)
  console.log()

  if (failed > 0) {
    console.log(pc.red('Some checks failed. Please fix the issues above.'))
    process.exit(1)
  }
  else if (warnings > 0) {
    console.log(pc.yellow('Setup looks good with some warnings.'))
  }
  else {
    console.log(pc.green('All checks passed! Your E-IMZO setup is ready.'))
  }
  console.log()
}

async function checkPackageJson(): Promise<CheckResult> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    await fs.access(packageJsonPath)
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    JSON.parse(content)

    return {
      name: 'package.json',
      status: 'pass',
      message: 'Found valid package.json',
    }
  }
  catch {
    return {
      name: 'package.json',
      status: 'fail',
      message: 'No valid package.json found',
      details: 'Run \'npm init\' or \'pnpm init\' to create one',
    }
  }
}

async function checkPackageInstalled(packageName: string): Promise<CheckResult> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content)

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    if (deps[packageName]) {
      // Check if actually installed in node_modules
      const modulePath = path.join(process.cwd(), 'node_modules', packageName)
      try {
        await fs.access(modulePath)
        return {
          name: packageName,
          status: 'pass',
          message: `Installed (${deps[packageName]})`,
        }
      }
      catch {
        return {
          name: packageName,
          status: 'warn',
          message: 'Listed but not installed',
          details: 'Run \'npm install\' or \'pnpm install\' to install dependencies',
        }
      }
    }

    // Check if it's an optional package
    if (packageName === '@eimzo/vue') {
      return {
        name: packageName,
        status: 'warn',
        message: 'Not installed (optional for non-Vue projects)',
        details: 'Install with \'npm add @eimzo/vue\' for Vue support',
      }
    }

    return {
      name: packageName,
      status: 'fail',
      message: 'Not installed',
      details: `Run 'npm add ${packageName}' to install`,
    }
  }
  catch {
    return {
      name: packageName,
      status: 'fail',
      message: 'Could not check',
      details: 'package.json not found or invalid',
    }
  }
}

async function checkTypeScriptConfig(): Promise<CheckResult> {
  try {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json')
    await fs.access(tsConfigPath)
    const content = await fs.readFile(tsConfigPath, 'utf-8')
    const config = JSON.parse(content)

    const issues: string[] = []

    // Check strict mode
    if (!config.compilerOptions?.strict) {
      issues.push('Consider enabling \'strict\' mode for better type safety')
    }

    // Check module resolution
    if (
      config.compilerOptions?.moduleResolution !== 'bundler'
      && config.compilerOptions?.moduleResolution !== 'node16'
      && config.compilerOptions?.moduleResolution !== 'nodenext'
    ) {
      issues.push('Consider using \'bundler\' or \'node16\' moduleResolution')
    }

    if (issues.length > 0) {
      return {
        name: 'TypeScript Config',
        status: 'warn',
        message: 'Found with suggestions',
        details: issues.join('; '),
      }
    }

    return {
      name: 'TypeScript Config',
      status: 'pass',
      message: 'Found and looks good',
    }
  }
  catch {
    return {
      name: 'TypeScript Config',
      status: 'warn',
      message: 'No tsconfig.json found',
      details: 'TypeScript is recommended but not required',
    }
  }
}

function checkNodeVersion(): CheckResult {
  const version = process.version
  const major = Number.parseInt(version.slice(1).split('.')[0], 10)

  if (major >= 18) {
    return {
      name: 'Node.js Version',
      status: 'pass',
      message: `${version} (>=18 required)`,
    }
  }

  return {
    name: 'Node.js Version',
    status: 'fail',
    message: `${version} (>=18 required)`,
    details: 'Please upgrade to Node.js 18 or later',
  }
}

async function checkWebSocketUrl(): Promise<CheckResult> {
  // We can't actually connect to WebSocket without E-IMZO running
  // So we just check if the expected ports are documented
  return {
    name: 'E-IMZO WebSocket',
    status: 'warn',
    message: 'Cannot test connection from CLI',
    details:
      'E-IMZO connects to wss://127.0.0.1:64443 when running in the browser. '
      + 'Make sure E-IMZO desktop app is installed and running.',
  }
}
