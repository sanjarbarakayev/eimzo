/**
 * Init Command - Initialize E-IMZO in a project
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { confirm, select } from '@inquirer/prompts'
import ora from 'ora'
import pc from 'picocolors'
import { getNuxtTemplate, getVanillaTemplate, getVueTemplate } from '../templates/index.js'
import { detectFramework } from '../utils/detect-framework.js'
import { detectPackageManager, runPackageManager } from '../utils/package-manager.js'

interface InitOptions {
  framework?: string
  packageManager?: string
  skipInstall?: boolean
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(pc.bold('\nE-IMZO SDK Setup\n'))

  // Detect or ask for framework
  let framework = options.framework
  if (!framework) {
    const detected = await detectFramework()
    if (detected) {
      const useDetected = await confirm({
        message: `Detected ${pc.cyan(detected)} project. Use this framework?`,
        default: true,
      })
      if (useDetected) {
        framework = detected
      }
    }

    if (!framework) {
      framework = await select({
        message: 'Select your framework:',
        choices: [
          { value: 'vue', name: 'Vue 3' },
          { value: 'nuxt', name: 'Nuxt 3' },
          { value: 'vanilla', name: 'Vanilla JavaScript/TypeScript' },
        ],
      })
    }
  }

  // Detect or ask for package manager
  let pm = options.packageManager
  if (!pm) {
    const detected = await detectPackageManager()
    if (detected) {
      pm = detected
    }
    else {
      pm = await select({
        message: 'Select your package manager:',
        choices: [
          { value: 'pnpm', name: 'pnpm (Recommended)' },
          { value: 'npm', name: 'npm' },
          { value: 'yarn', name: 'yarn' },
        ],
      })
    }
  }

  console.log()
  console.log(pc.dim(`Framework: ${framework}`))
  console.log(pc.dim(`Package Manager: ${pm}`))
  console.log()

  // Install packages
  if (!options.skipInstall) {
    const spinner = ora('Installing dependencies...').start()

    try {
      const packages
        = framework === 'vanilla'
          ? ['@eimzo/core']
          : ['@eimzo/core', '@eimzo/vue']

      await runPackageManager(pm, 'add', packages)
      spinner.succeed('Dependencies installed')
    }
    catch (error) {
      spinner.fail('Failed to install dependencies')
      console.error(pc.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
  }

  // Generate example files
  const generateExample = await confirm({
    message: 'Generate example files?',
    default: true,
  })

  if (generateExample) {
    const spinner = ora('Generating example files...').start()

    try {
      let template: { filename: string, content: string }[]

      switch (framework) {
        case 'vue':
          template = getVueTemplate()
          break
        case 'nuxt':
          template = getNuxtTemplate()
          break
        default:
          template = getVanillaTemplate()
      }

      for (const file of template) {
        const filePath = path.join(process.cwd(), file.filename)
        const dir = path.dirname(filePath)

        // Create directory if needed
        await fs.mkdir(dir, { recursive: true })

        // Check if file exists
        try {
          await fs.access(filePath)
          spinner.warn(`Skipping ${file.filename} (already exists)`)
          continue
        }
        catch {
          // File doesn't exist, create it
        }

        await fs.writeFile(filePath, file.content, 'utf-8')
      }

      spinner.succeed('Example files generated')
    }
    catch (error) {
      spinner.fail('Failed to generate example files')
      console.error(pc.red(error instanceof Error ? error.message : String(error)))
    }
  }

  // Print next steps
  console.log()
  console.log(pc.green('E-IMZO SDK initialized successfully!'))
  console.log()
  console.log(pc.bold('Next steps:'))
  console.log()

  if (framework === 'vue') {
    console.log(`  1. Add the plugin to your ${pc.cyan('main.ts')}:`)
    console.log()
    console.log(pc.dim('     import { VueESignature } from \'@eimzo/vue\''))
    console.log(pc.dim('     app.use(VueESignature)'))
    console.log()
    console.log(`  2. Use the composable in your components:`)
    console.log()
    console.log(pc.dim('     const { install, listKeys, signData } = useESignature()'))
  }
  else if (framework === 'nuxt') {
    console.log(`  1. Create a client plugin at ${pc.cyan('plugins/eimzo.client.ts')}`)
    console.log(`  2. Use the composable in your components`)
  }
  else {
    console.log(`  1. Import the client:`)
    console.log()
    console.log(pc.dim('     import { EIMZOClient } from \'@eimzo/core\''))
    console.log(pc.dim('     const client = new EIMZOClient()'))
  }

  console.log()
  console.log(`  Run ${pc.cyan('eimzo doctor')} to verify your setup.`)
  console.log()
}
