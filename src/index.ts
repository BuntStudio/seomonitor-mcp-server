#!/usr/bin/env node

import { config } from 'dotenv';
import { MCPServerConfig, LogLevel } from './types.js';
import { StdioTransport } from './transports/stdio.js';
import { HttpTransport } from './transports/http.js';
import { WebSocketTransport } from './transports/websocket.js';
import { logger } from './logger.js';

// Load environment variables
if (process.argv.includes('--transport') && process.argv.includes('stdio') ||
    (!process.argv.includes('--transport') && process.env.TRANSPORT !== 'http' && process.env.TRANSPORT !== 'websocket')) {
  // STDIO mode - suppress dotenv logging to avoid Claude Desktop issues
  const originalConsoleLog = console.log;
  console.log = () => {};
  config();
  console.log = originalConsoleLog;
} else {
  config();
}

interface CLIArgs {
  transport?: 'stdio' | 'http' | 'websocket';
  port?: number;
  host?: string;
  apiKey?: string;
  enableAuth?: boolean;
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
      case '-t':
        if (nextArg && ['stdio', 'http', 'websocket'].includes(nextArg)) {
          args.transport = nextArg as 'stdio' | 'http' | 'websocket';
          i++;
        }
        break;
      case '--port':
      case '-p':
        if (nextArg && !isNaN(parseInt(nextArg))) {
          args.port = parseInt(nextArg);
          i++;
        }
        break;
      case '--host':
      case '-h':
        if (nextArg) {
          args.host = nextArg;
          i++;
        }
        break;
      case '--api-key':
        if (nextArg) {
          args.apiKey = nextArg;
          i++;
        }
        break;
      case '--enable-auth':
        args.enableAuth = true;
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
  -t, --transport <type>     Transport type: stdio, http, websocket (default: stdio)
  -p, --port <number>        Port for HTTP/WebSocket (default: 3001)
  -h, --host <host>          Host for HTTP/WebSocket (default: localhost)
  --api-key <key>            API key for authentication (optional)
  --enable-auth              Enable API key authentication
  --log-level <level>        Log level: debug, info, warn, error (default: info)
  --help                     Show this help message

Examples:
  seomonitor-mcp                                    # Start with STDIO transport
  seomonitor-mcp -t http -p 3001                   # Start HTTP server on port 3001
  seomonitor-mcp -t websocket -p 3002 --enable-auth # Start WebSocket server with auth
  seomonitor-mcp -t http --api-key abc123          # Start HTTP with specific API key

Environment Variables:
  PORT                       Server port (default: 3001)
  HOST                       Server host (default: localhost)
  TRANSPORT                  Transport type (default: stdio)
  API_KEY                    API key for authentication
  ENABLE_AUTH                Enable authentication (true/false)
  LOG_LEVEL                  Log level (debug/info/warn/error)
  CORS_ORIGIN                CORS origin for HTTP/WebSocket
`);
}

function createConfig(args: CLIArgs): MCPServerConfig {
  const config: MCPServerConfig = {
    transport: args.transport || (process.env.TRANSPORT as any) || 'stdio',
    port: args.port || parseInt(process.env.PORT || '3001'),
    host: args.host || process.env.HOST || 'localhost',
    apiKey: args.apiKey || process.env.API_KEY,
    enableAuth: args.enableAuth || process.env.ENABLE_AUTH === 'true',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    logLevel: args.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'info',
    logFile: process.env.LOG_FILE
  };

  return config;
}

async function startServer(config: MCPServerConfig) {
  // Set up logger
  logger.setLogLevel(config.logLevel || 'info');
  
  // Only log startup info if not in STDIO mode
  if (config.transport !== 'stdio') {
    logger.info('Starting SEOMonitor MCP Server', {
      transport: config.transport,
      port: config.port,
      host: config.host,
      authEnabled: config.enableAuth,
      logLevel: config.logLevel
    });
  }

  let transport: StdioTransport | HttpTransport | WebSocketTransport;

  try {
    switch (config.transport) {
      case 'stdio':
        transport = new StdioTransport(config);
        break;
      case 'http':
        transport = new HttpTransport(config);
        break;
      case 'websocket':
        transport = new WebSocketTransport(config);
        break;
      default:
        throw new Error(`Unsupported transport: ${config.transport}`);
    }

    await transport.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      try {
        await transport.stop();
        logger.info('Server stopped gracefully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Failed to start server', error);
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
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Failed to start application', error);
    process.exit(1);
  });
}