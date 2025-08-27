import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPServer } from '../server.js';
import { MCPServerConfig } from '../types.js';
import { logger } from '../logger.js';

export class StdioTransport {
  private mcpServer: MCPServer;

  constructor(config: MCPServerConfig) {
    this.mcpServer = new MCPServer(config);
  }

  async start(): Promise<void> {
    try {
      await this.mcpServer.startStdio();
      // Don't log in STDIO mode to avoid interfering with Claude Desktop
    } catch (error) {
      // Only log critical errors to stderr, not stdout
      process.stderr.write(`Failed to start STDIO transport: ${error}\n`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.mcpServer.stop();
  }
}