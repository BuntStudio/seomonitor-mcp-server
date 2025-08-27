import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { DynamicApiClient } from './clients/api-client.js';
import { SEOMonitorClient } from './clients/seomonitor-client.js';
import { UserSession, MCPServerConfig, MCPAuthContext } from './types.js';
import { getAllToolDefinitions, executeToolByName, getAllToolNames } from './mcp-tools/index.js';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

export class MCPServer {
  private server: Server;
  private sessions: Map<string, { client: DynamicApiClient; seoClient: SEOMonitorClient; session: UserSession }> = new Map();
  private config: MCPServerConfig;
  private seoToolNames: Set<string> | null = null;
  private defaultSeoClient: SEOMonitorClient | null = null;

  constructor(config: MCPServerConfig) {
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
    this.initializeDefaultClient();
    
    this.setupToolHandlers();
    this.setupErrorHandling();
    
    logger.info('MCP Server initialized', { config });
  }

  private initializeDefaultClient() {
    const seoApiKey = process.env.SEOMONITOR_API_KEY;
    const seoBaseUrl = process.env.SEOMONITOR_BASE_URL || 'https://apigw.seomonitor.com';
    
    if (seoApiKey) {
      const defaultSession: UserSession = {
        userId: 'default',
        apiKey: seoApiKey,
        baseUrl: seoBaseUrl
      };
      
      this.defaultSeoClient = new SEOMonitorClient(defaultSession);
      logger.info('Default SEOMonitor client initialized');
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('ListTools requested - loading dynamic tool definitions');
      
      try {
        const dynamicToolDefinitions = await getAllToolDefinitions();
        logger.info(`Loaded ${dynamicToolDefinitions.length} dynamic SEOMonitor tools`);
        
        return {
          tools: [
            {
              name: 'set_user_session',
              description: 'Set user session with API key and base URL for backend access',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'Unique user identifier',
                  },
                  apiKey: {
                    type: 'string',
                    description: 'User API key for backend authentication',
                  },
                  baseUrl: {
                    type: 'string',
                    description: 'Base URL of the backend API',
                  },
                },
                required: ['userId', 'apiKey', 'baseUrl'],
              },
            },
            {
              name: 'api_get',
              description: 'Make GET request to backend API using user session',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID for session lookup',
                  },
                  endpoint: {
                    type: 'string',
                    description: 'API endpoint path (without base URL)',
                  },
                },
                required: ['userId', 'endpoint'],
              },
            },
            {
              name: 'api_post',
              description: 'Make POST request to backend API using user session',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID for session lookup',
                  },
                  endpoint: {
                    type: 'string',
                    description: 'API endpoint path (without base URL)',
                  },
                  data: {
                    type: 'object',
                    description: 'Request payload data',
                  },
                },
                required: ['userId', 'endpoint', 'data'],
              },
            },
            {
              name: 'api_put',
              description: 'Make PUT request to backend API using user session',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID for session lookup',
                  },
                  endpoint: {
                    type: 'string',
                    description: 'API endpoint path (without base URL)',
                  },
                  data: {
                    type: 'object',
                    description: 'Request payload data',
                  },
                },
                required: ['userId', 'endpoint', 'data'],
              },
            },
            {
              name: 'api_delete',
              description: 'Make DELETE request to backend API using user session',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID for session lookup',
                  },
                  endpoint: {
                    type: 'string',
                    description: 'API endpoint path (without base URL)',
                  },
                },
                required: ['userId', 'endpoint'],
              },
            },
            {
              name: 'get_user_data',
              description: 'Get user profile data from backend API',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID for session lookup',
                  },
                },
                required: ['userId'],
              },
            },
            // SEOMonitor API Tools - Fully Dynamic Implementation
            ...dynamicToolDefinitions,
          ],
        };
      } catch (error) {
        logger.error('Failed to load dynamic tool definitions', error);
        // Fallback to basic tools only
        return {
          tools: [
            {
              name: 'set_user_session',
              description: 'Set user session with API key and base URL for backend access',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', description: 'Unique user identifier' },
                  apiKey: { type: 'string', description: 'User API key for backend authentication' },
                  baseUrl: { type: 'string', description: 'Base URL of the backend API' },
                },
                required: ['userId', 'apiKey', 'baseUrl'],
              },
            },
          ],
        };
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Log incoming MCP tool call
      logger.info(`MCP Tool Call: ${name}`, args);

      const startTime = Date.now();

      try {
        let result;
        switch (name) {
          case 'set_user_session':
            result = await this.handleSetUserSession(args);
            break;
          case 'api_get':
            result = await this.handleApiGet(args);
            break;
          case 'api_post':
            result = await this.handleApiPost(args);
            break;
          case 'api_put':
            result = await this.handleApiPut(args);
            break;
          case 'api_delete':
            result = await this.handleApiDelete(args);
            break;
          case 'get_user_data':
            result = await this.handleGetUserData(args);
            break;
          default:
            // Handle dynamic SEOMonitor API tools
            if (await this.isSEOMonitorTool(name)) {
              const seoClient = this.getDefaultSEOClient();
              // Remove userId from args as it's not needed with default client
              const cleanArgs = { ...args };
              delete cleanArgs.userId;
              result = await executeToolByName(name, cleanArgs, seoClient);
            } else {
              throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${name}`
              );
            }
        }

        // Log successful result
        const duration = Date.now() - startTime;
        logger.info(`Tool ${name} completed in ${duration}ms`);

        return result;
      } catch (error) {
        // Log error result
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error(`Tool ${name} failed after ${duration}ms: ${errorMessage}`, error);
        
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async handleSetUserSession(args: any) {
    const { userId, apiKey, baseUrl } = args;

    const session: UserSession = { userId, apiKey, baseUrl };
    const client = new DynamicApiClient(session);
    const seoClient = new SEOMonitorClient(session);

    this.sessions.set(userId, { client, seoClient, session });
    logger.info(`User session set for user: ${userId}`);

    return {
      content: [
        {
          type: 'text',
          text: `User session set successfully for user: ${userId}`,
        },
      ],
    };
  }

  private getClientForUser(userId: string) {
    const sessionData = this.sessions.get(userId);
    if (!sessionData) {
      throw new Error(`No session found for user: ${userId}. Please set user session first.`);
    }
    return sessionData.client;
  }

  private getSEOClientForUser(userId: string) {
    const sessionData = this.sessions.get(userId);
    if (!sessionData) {
      throw new Error(`No session found for user: ${userId}. Please set user session first.`);
    }
    return sessionData.seoClient;
  }

  private getDefaultSEOClient() {
    if (!this.defaultSeoClient) {
      throw new Error('SEOMonitor API key not configured. Please set SEOMONITOR_API_KEY environment variable.');
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

  private async handleApiGet(args: any) {
    const { userId, endpoint } = args;
    const client = this.getClientForUser(userId);

    const result = await client.get(endpoint);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleApiPost(args: any) {
    const { userId, endpoint, data } = args;
    const client = this.getClientForUser(userId);

    const result = await client.post(endpoint, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleApiPut(args: any) {
    const { userId, endpoint, data } = args;
    const client = this.getClientForUser(userId);

    const result = await client.put(endpoint, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleApiDelete(args: any) {
    const { userId, endpoint } = args;
    const client = this.getClientForUser(userId);

    const result = await client.delete(endpoint);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetUserData(args: any) {
    const { userId } = args;
    const client = this.getClientForUser(userId);

    // Assuming your backend has a /user or /profile endpoint
    const result = await client.get('/user');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server Error', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  // Start with STDIO transport
  async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Don't log in STDIO mode to avoid interfering with Claude Desktop
  }

  // Cleanup
  async stop(): Promise<void> {
    await this.server.close();
  }
}