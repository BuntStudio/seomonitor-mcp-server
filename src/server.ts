import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { SEOMonitorClient } from './clients/seomonitor-client.js';
import { UserSession, MCPServerConfig } from './types.js';
import { getAllToolDefinitions, executeToolByName, getAllToolNames } from './mcp-tools/index.js';
import { logger } from './logger.js';

export class MCPServer {
  private server: Server;
  private config: MCPServerConfig;
  private seoToolNames: Set<string> | null = null;
  private defaultSeoClient: SEOMonitorClient | null = null;

  constructor(config: MCPServerConfig, apiKey?: string) {
    this.config = config;

    this.server = new Server(
      {
        name: 'seomonitor-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize default SEO client if API key is provided
    this.initializeDefaultClient(apiKey);

    this.setupToolHandlers();
    this.setupErrorHandling();

    logger.info('MCP Server initialized', { config });
  }

  private initializeDefaultClient(apiKey?: string) {
    const seoApiKey = apiKey || process.env.SEOMONITOR_API_KEY;
    const seoBaseUrl = process.env.SEOMONITOR_BASE_URL || 'https://apigw.seomonitor.com';

    if (seoApiKey) {
      const defaultSession: UserSession = {
        userId: 'default',
        apiKey: seoApiKey,
        baseUrl: seoBaseUrl
      };

      this.defaultSeoClient = new SEOMonitorClient(defaultSession, logger);
      logger.info('Default SEOMonitor client initialized');
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      logger.info('🔧 MCP ListTools Request received', {
        method: 'tools/list',
        params: request.params
      });
      
      try {
        const dynamicToolDefinitions = await getAllToolDefinitions();
        logger.info(`✅ Loaded ${dynamicToolDefinitions.length} SEOMonitor tools:`, {
          toolNames: dynamicToolDefinitions.map(t => t.name)
        });
        
        const response = { tools: dynamicToolDefinitions };
        
        logger.debug('📤 ListTools Response:', {
          toolCount: dynamicToolDefinitions.length,
          responseSize: JSON.stringify(response).length
        });
        
        return response;
      } catch (error) {
        logger.error('❌ Failed to load dynamic tool definitions', error);
        return { tools: [] };
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Log detailed incoming MCP tool call
      logger.info(`🚀 MCP Tool Call Request:`, {
        toolName: name,
        arguments: args,
        method: 'tools/call'
      });

      const startTime = Date.now();

      try {
        let result;
        
        // Handle SEOMonitor API tools only
        if (await this.isSEOMonitorTool(name)) {
          const seoClient = this.getDefaultSEOClient();
          result = await executeToolByName(name, args, seoClient);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        // Log successful result
        const duration = Date.now() - startTime;
        logger.info(`✅ Tool ${name} completed successfully`, {
          duration: `${duration}ms`,
          resultType: result?.content?.[0]?.type || 'unknown',
          resultSize: JSON.stringify(result).length
        });

        logger.debug('📤 Tool Response being sent to Claude Desktop:', {
          toolName: name,
          resultStructure: {
            type: typeof result,
            hasContent: !!result?.content,
            contentLength: result?.content?.length || 0,
            firstContentType: result?.content?.[0]?.type,
            firstContentSize: result?.content?.[0]?.text?.length || 0,
            firstContent100Chars: result?.content?.[0]?.text?.substring(0, 100) + '...'
          }
        });

        return result;
      } catch (error) {
        // Log detailed error information
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        logger.error(`❌ Tool ${name} execution failed`, {
          duration: `${duration}ms`,
          errorMessage: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          httpStatus: (error as any)?.response?.status,
          httpData: (error as any)?.response?.data
        });
        
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }


  private getDefaultSEOClient() {
    if (!this.defaultSeoClient) {
      throw new Error('SEOMonitor API key not configured. Set the SEOMONITOR_API_KEY environment variable (stdio) or provide the key in the request (HTTP).');
    }
    return this.defaultSeoClient;
  }

  private async isSEOMonitorTool(toolName: string): Promise<boolean> {
    try {
      // Initialize cache if needed
      if (!this.seoToolNames) {
        const allToolNames = await getAllToolNames();
        this.seoToolNames = new Set(allToolNames);
        logger.debug(`Cached ${this.seoToolNames.size} SEOMonitor tool names`);
      }
      
      return this.seoToolNames.has(toolName);
    } catch (error) {
      logger.error('Failed to check if tool is SEOMonitor tool', error);
      return false;
    }
  }


  private setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('🔥 MCP Server Error', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
    };

    // Add protocol message logging if available
    try {
      (this.server as any).onnotification = (notification: any) => {
        logger.debug('📨 MCP Notification received', {
          method: notification.method,
          params: notification.params
        });
      };
    } catch (error) {
      // onnotification might not be available in all MCP versions
    }

    // Per-request instances (HTTP mode) must not accumulate process listeners
    if (this.config.transport === 'stdio') {
      process.on('SIGINT', async () => {
        logger.info('🛑 Shutting down MCP server...');
        await this.server.close();
        process.exit(0);
      });
    }
  }

  // Start with STDIO transport
  async startStdio(): Promise<void> {
    // Rotate logs if needed
    logger.rotateLogs();
    
    logger.info('🚀 Starting MCP Server with STDIO transport');
    logger.info('📡 Claude Desktop MCP Protocol Logging Enabled');
    logger.info('📁 Log file location', { logFile: logger.getLogFile() });
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('✅ MCP Server connected and ready for Claude Desktop');
    // Note: stdout is used for MCP protocol, all logging goes to file
  }

  // Connect to an arbitrary transport (used by the HTTP transport)
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  // Cleanup
  async stop(): Promise<void> {
    await this.server.close();
  }
}