#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import { captureScreens } from '../src/capture.js';
import { startViewerServer } from '../src/server.js';

const [,, cmd, ...args] = process.argv;

function printHelp() {
  console.log(`
lookfeel — Visual evaluation & screenshot testing harness for agentic coding

Usage:
  lookfeel capture [config.json]    Capture screenshots defined in config file or default
  lookfeel review [options]         Start interactive browser review studio (default port 8802)
  lookfeel help                     Show this message

Options for review:
  --port <number>                   Custom port (default: 8802)
  --output-dir <path>               Custom directory for outputs (default: ./outputs)
`);
}

async function main() {
  if (!cmd || cmd === 'help' || cmd === '--help') {
    printHelp();
    process.exit(0);
  }

  if (cmd === 'review') {
    const portIndex = args.indexOf('--port');
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : (process.env.PORT || 8802);
    const outIndex = args.indexOf('--output-dir');
    const outputDir = outIndex !== -1 ? path.resolve(args[outIndex + 1]) : path.resolve(process.cwd(), 'outputs');

    startViewerServer({ port, outputDir });
    return;
  }

  if (cmd === 'capture') {
    const configPath = args[0] ? path.resolve(args[0]) : path.resolve(process.cwd(), 'lookfeel.config.json');
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found at ${configPath}. Creating a sample lookfeel.config.json...`);
      const sample = {
        outputDir: "./outputs",
        screens: [
          {
            id: "home-desktop",
            title: "Homepage (Desktop)",
            url: "http://localhost:3000",
            viewport: { width: 1440, height: 900 }
          },
          {
            id: "home-mobile",
            title: "Homepage (Mobile)",
            url: "http://localhost:3000",
            viewport: { width: 390, height: 844 }
          }
        ]
      };
      fs.writeFileSync(configPath, JSON.stringify(sample, null, 2));
      console.log(`Created sample config at ${configPath}. Edit it and rerun 'lookfeel capture'.`);
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`[lookfeel] Running capture using ${configPath}...`);
    await captureScreens(config.screens || [], {
      outputDir: config.outputDir ? path.resolve(config.outputDir) : path.resolve(process.cwd(), 'outputs'),
      metadata: config.metadata || {}
    });
    console.log(`[lookfeel] ✅ Capture finished. Run 'lookfeel review' to inspect.`);
    process.exit(0);
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error('[lookfeel] Fatal error:', err);
  process.exit(1);
});
