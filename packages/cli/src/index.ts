#!/usr/bin/env node
/**
 * E-IMZO CLI Tool
 *
 * Commands:
 * - init: Initialize E-IMZO in a project
 * - doctor: Diagnose E-IMZO installation
 * - mock:certificate: Generate mock certificates for testing
 */

import { Command } from 'commander'
import pc from 'picocolors'
import { doctorCommand } from './commands/doctor.js'
import { initCommand } from './commands/init.js'
import { mockCommand } from './commands/mock.js'

const program = new Command()

program
  .name('eimzo')
  .description('CLI tool for E-IMZO SDK setup and diagnostics')
  .version('1.0.0')

// Init command
program
  .command('init')
  .description('Initialize E-IMZO in your project')
  .option('-f, --framework <framework>', 'Target framework (vue, nuxt, vanilla)')
  .option('-p, --package-manager <pm>', 'Package manager (pnpm, npm, yarn)')
  .option('--skip-install', 'Skip package installation')
  .action(initCommand)

// Doctor command
program
  .command('doctor')
  .description('Diagnose E-IMZO installation and configuration')
  .option('-v, --verbose', 'Show detailed output')
  .action(doctorCommand)

// Mock command
program
  .command('mock:certificate')
  .alias('mock:cert')
  .description('Generate mock certificates for testing')
  .option('-c, --count <count>', 'Number of certificates to generate', '3')
  .option('-o, --output <file>', 'Output file path')
  .option('--type <type>', 'Certificate type (pfx, id-card, baik, ckc)', 'pfx')
  .action(mockCommand)

// Handle unknown commands
program.on('command:*', () => {
  console.error(pc.red(`\nUnknown command: ${program.args.join(' ')}`))
  console.log(`Run ${pc.cyan('eimzo --help')} for available commands.\n`)
  process.exit(1)
})

// Parse arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
