#!/usr/bin/env node

import { createRequire } from 'module';
import { Command } from 'commander';
import { runDataCommand } from './commands/data.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('quantis')
  .description('Quantis CLI – data layer between human, agent, and profits')
  .version(pkg.version ?? '0.1.0');

program
  .command('data')
  .description('Fetch Quantis data for agents. Output: JSON (default when piped) or human-readable.')
  .option('-j, --json', 'Output as JSON (agents: pipe to your logic)')
  .option('--compact', 'Compact JSON, one line (default for -j, best for agents)')
  .option('--pretty', 'Pretty-print JSON with indentation (human-readable)')
  .option('--intel', 'Intel only: crypto, trends, ISS, FRED, treasury, disasters, flights')
  .option('--markets', 'Markets only: Polymarket + events')
  .option('--feed', 'Feed only: news, tweets, telegrams with related markets')
  .action(runDataCommand);

program.parse();
