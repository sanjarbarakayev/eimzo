/**
 * Framework Detection Utility
 */

import fs from 'node:fs/promises'
import path from 'node:path'

export async function detectFramework(): Promise<string | null> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const content = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content)

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Check for Nuxt first (more specific)
    if (deps.nuxt || deps.nuxt3) {
      return 'nuxt'
    }

    // Check for Vue
    if (deps.vue) {
      return 'vue'
    }

    // Check for React
    if (deps.react) {
      return 'react'
    }

    // Check for Next.js
    if (deps.next) {
      return 'next'
    }

    // Check for Svelte
    if (deps.svelte) {
      return 'svelte'
    }

    return 'vanilla'
  }
  catch {
    return null
  }
}

export async function detectTypeScript(): Promise<boolean> {
  try {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json')
    await fs.access(tsConfigPath)
    return true
  }
  catch {
    return false
  }
}
