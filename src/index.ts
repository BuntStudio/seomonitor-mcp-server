#!/usr/bin/env node

import { config } from 'dotenv';
import { MCPServerConfig, LogLevel } from './types.js';
import { StdioTransport } from './transports/stdio.js';
import { HttpTransport } from './transports/http.js';
import { logger } from './logger.js';

// STDIO mode - suppress dotenv logging to avoid Claude Desktop issues
const originalConsoleLog = console.log;
console.log = () => {};
config();
console.log = originalConsoleLog;

interface CLIArgs {
  transport?: 'stdio' | 'http';
  port?: number;
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
      case '--transport':
        if (nextArg && ['stdio', 'http'].includes(nextArg)) {
          args.transport = nextArg as 'stdio' | 'http';
          i++;
        }
        break;
      case '--port':
        if (nextArg && !Number.isNaN(parseInt(nextArg, 10))) {
          args.port = parseInt(nextArg, 10);
          i++;
        }
        break;
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
  --transport <stdio|http>   Transport to use (default: stdio)
  --port <port>              HTTP port (default: 3000, http transport only)
  --log-level <level>        Log level: debug, info, warn, error (default: info)
  --help                     Show this help message

Examples:
  seomonitor-mcp                        # Start with STDIO (Claude Desktop local)
  seomonitor-mcp --transport http       # Serve Streamable HTTP on port 3000
  seomonitor-mcp --transport http --port 8080
  seomonitor-mcp --log-level debug      # Start with debug logging

Environment Variables:
  SEOMONITOR_API_KEY         SEOMonitor API key (required for stdio; HTTP clients send their own)
  MCP_TRANSPORT              Transport: stdio or http (overridden by --transport)
  MCP_HTTP_PORT              HTTP port (overridden by --port)
  LOG_LEVEL                  Log level (debug/info/warn/error)
`);
}

function createConfig(args: CLIArgs): MCPServerConfig {
  const envTransport = process.env.MCP_TRANSPORT === 'http' ? 'http' : undefined;
  const envPort = process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : undefined;

  const config: MCPServerConfig = {
    transport: args.transport || envTransport || 'stdio',
    port: args.port || envPort,
    logLevel: args.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'info'
  };

  return config;
}

async function startServer(config: MCPServerConfig) {
  // Set up logger
  logger.setLogLevel(config.logLevel || 'info');

  let transport: StdioTransport | HttpTransport;

  try {
    transport = config.transport === 'http'
      ? new HttpTransport(config)
      : new StdioTransport(config);
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
