#!/usr/bin/env node

import { config } from 'dotenv';
import { MCPServerConfig, LogLevel } from './types.js';
import { StdioTransport } from './transports/stdio.js';
import { logger } from './logger.js';

// STDIO mode - suppress dotenv logging to avoid Claude Desktop issues
const originalConsoleLog = console.log;
console.log = () => {};
config();
console.log = originalConsoleLog;

interface CLIArgs {
  logLevel?: LogLevel;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const nextArg = argv[i + 1];

    switch (arg) {
      case '--log-level':
        if (nextArg && ['debug', 'info', 'warn', 'error'].includes(nextArg)) {
          args.logLevel = nextArg as LogLevel;
          i++;
        }
        break;
      case '--help':
        args.help = true;
        break;
    }
  }

  return args;
}

function printUsage() {
  console.log(`
SEOMonitor MCP Server v1.0.0

Usage:
  seomonitor-mcp [options]

Options:
  --log-level <level>        Log level: debug, info, warn, error (default: info)
  --help                     Show this help message

Examples:
  seomonitor-mcp                        # Start with default settings
  seomonitor-mcp --log-level debug      # Start with debug logging

Environment Variables:
  SEOMONITOR_API_KEY         SEOMonitor API key (required)
  LOG_LEVEL                  Log level (debug/info/warn/error)
`);
}

function createConfig(args: CLIArgs): MCPServerConfig {
  const config: MCPServerConfig = {
    transport: 'stdio',
    logLevel: args.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'info'
  };

  return config;
}

async function startServer(config: MCPServerConfig) {
  // Set up logger
  logger.setLogLevel(config.logLevel || 'info');

  let transport: StdioTransport;

  try {
    transport = new StdioTransport(config);
    await transport.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      try {
        await transport.stop();
        process.exit(0);
      } catch (error) {
        process.stderr.write(`Error during shutdown: ${error}\n`);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    process.stderr.write(`Failed to start server: ${error}\n`);
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const serverConfig = createConfig(args);
  await startServer(serverConfig);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught exception: ${error}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  process.stderr.write(`Unhandled rejection: ${reason}\n`);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  process.stderr.write(`Failed to start application: ${error}\n`);
  process.exit(1);
});