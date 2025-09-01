import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import express from 'express';
import cors from 'cors';
import { MCPServerConfig, MCPAuthContext, UserSession } from '../types.js';
import { getAllToolDefinitions, executeToolByName } from '../mcp-tools/index.js';
import { DynamicApiClient } from '../clients/api-client.js';
import { SEOMonitorClient } from '../clients/seomonitor-client.js';
import { logger } from '../logger.js';

interface WSMessage {
  id?: string;
  method: string;
  params?: any;
}

interface WSResponse {
  id?: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class WebSocketTransport {
  private app: express.Application;
  private server: Server;
  private wss: WebSocketServer;
  private config: MCPServerConfig;
  private sessions: Map<string, { client: DynamicApiClient; seoClient: SEOMonitorClient; session: UserSession }> = new Map();
  private connections: Map<WebSocket, { authenticated: boolean; userId?: string }> = new Map();

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress() {
    this.app.use(cors({
      origin: this.config.corsOrigin || '*',
      credentials: true
    }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        transport: 'websocket',
        connections: this.connections.size
      });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection established');
      
      this.connections.set(ws, { authenticated: !this.config.enableAuth });

      // Send welcome message
      this.sendResponse(ws, {
        result: {
          method: 'welcome',
          message: 'Connected to SEOMonitor MCP Server',
          version: '1.0.0',
          authRequired: this.config.enableAuth || false
        }
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          logger.debug('WebSocket message received', message);

          await this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error);
          this.sendError(ws, undefined, -32700, 'Parse error', error);
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.connections.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
        this.connections.delete(ws);
      });

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // 30 seconds
    });
  }

  private async handleMessage(ws: WebSocket, message: WSMessage) {
    const connection = this.connections.get(ws);
    if (!connection) {
      return this.sendError(ws, message.id, -32603, 'Internal error: Connection not found');
    }

    try {
      switch (message.method) {
        case 'authenticate':
          await this.handleAuthenticate(ws, message);
          break;
        
        case 'tools/list':
          if (this.config.enableAuth && !connection.authenticated) {
            return this.sendError(ws, message.id, -32601, 'Authentication required');
          }
          await this.handleListTools(ws, message);
          break;
        
        case 'tools/call':
          if (this.config.enableAuth && !connection.authenticated) {
            return this.sendError(ws, message.id, -32601, 'Authentication required');
          }
          await this.handleToolCall(ws, message);
          break;
        
        case 'session/create':
          if (this.config.enableAuth && !connection.authenticated) {
            return this.sendError(ws, message.id, -32601, 'Authentication required');
          }
          await this.handleCreateSession(ws, message);
          break;

        default:
          this.sendError(ws, message.id, -32601, `Method not found: ${message.method}`);
      }
    } catch (error) {
      logger.error(`WebSocket method ${message.method} failed`, error);
      this.sendError(ws, message.id, -32603, 'Internal error', error);
    }
  }

  private async handleAuthenticate(ws: WebSocket, message: WSMessage) {
    const { apiKey } = message.params || {};
    
    if (!apiKey || (this.config.apiKey && apiKey !== this.config.apiKey)) {
      return this.sendError(ws, message.id, -32602, 'Invalid API key');
    }

    const connection = this.connections.get(ws);
    if (connection) {
      connection.authenticated = true;
    }

    this.sendResponse(ws, {
      id: message.id,
      result: {
        authenticated: true,
        message: 'Authentication successful'
      }
    });
  }

  private async handleListTools(ws: WebSocket, message: WSMessage) {
    try {
      const tools = await getAllToolDefinitions();
      
      // Add basic MCP tools
      const allTools = [
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
        ...tools
      ];

      this.sendResponse(ws, {
        id: message.id,
        result: {
          tools: allTools
        }
      });
    } catch (error) {
      this.sendError(ws, message.id, -32603, 'Failed to list tools', error);
    }
  }

  private async handleToolCall(ws: WebSocket, message: WSMessage) {
    const { name, arguments: args } = message.params || {};
    
    if (!name) {
      return this.sendError(ws, message.id, -32602, 'Missing tool name');
    }

    try {
      let result;
      
      switch (name) {
        case 'set_user_session':
          result = await this.handleSetUserSession(args);
          break;
        case 'api_get':
          result = await this.handleApiCall(args, 'get');
          break;
        case 'api_post':
          result = await this.handleApiCall(args, 'post');
          break;
        case 'api_put':
          result = await this.handleApiCall(args, 'put');
          break;
        case 'api_delete':
          result = await this.handleApiCall(args, 'delete');
          break;
        case 'get_user_data':
          result = await this.handleGetUserData(args);
          break;
        default:
          // Handle SEOMonitor tools
          const { userId } = args || {};
          if (!userId) {
            return this.sendError(ws, message.id, -32602, 'Missing userId for SEOMonitor tool');
          }

          const sessionData = this.sessions.get(userId);
          if (!sessionData) {
            return this.sendError(ws, message.id, -32602, `No session found for user: ${userId}`);
          }

          result = await executeToolByName(name, args, sessionData.seoClient);
      }

      this.sendResponse(ws, {
        id: message.id,
        result
      });

    } catch (error) {
      this.sendError(ws, message.id, -32603, `Tool execution failed: ${name}`, error);
    }
  }

  private async handleCreateSession(ws: WebSocket, message: WSMessage) {
    const { userId, apiKey, baseUrl } = message.params || {};

    if (!userId || !apiKey || !baseUrl) {
      return this.sendError(ws, message.id, -32602, 'Missing required fields: userId, apiKey, baseUrl');
    }

    const session: UserSession = { userId, apiKey, baseUrl };
    const client = new DynamicApiClient(session);
    const seoClient = new SEOMonitorClient(session, logger);

    this.sessions.set(userId, { client, seoClient, session });

    // Associate this connection with the user
    const connection = this.connections.get(ws);
    if (connection) {
      connection.userId = userId;
    }

    this.sendResponse(ws, {
      id: message.id,
      result: {
        message: `Session created successfully for user: ${userId}`
      }
    });
  }

  private async handleSetUserSession(args: any) {
    const { userId, apiKey, baseUrl } = args;
    const session: UserSession = { userId, apiKey, baseUrl };
    const client = new DynamicApiClient(session);
    const seoClient = new SEOMonitorClient(session, logger);
    this.sessions.set(userId, { client, seoClient, session });
    return {
      content: [{
        type: 'text',
        text: `Session created successfully for user: ${userId}`
      }]
    };
  }

  private async handleApiCall(args: any, method: 'get' | 'post' | 'put' | 'delete') {
    const { userId, endpoint, data } = args;
    const sessionData = this.sessions.get(userId);
    if (!sessionData) {
      throw new Error(`No session found for user: ${userId}`);
    }

    let result;
    switch (method) {
      case 'get':
        result = await sessionData.client.get(endpoint);
        break;
      case 'post':
        result = await sessionData.client.post(endpoint, data);
        break;
      case 'put':
        result = await sessionData.client.put(endpoint, data);
        break;
      case 'delete':
        result = await sessionData.client.delete(endpoint);
        break;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async handleGetUserData(args: any) {
    const { userId } = args;
    const sessionData = this.sessions.get(userId);
    if (!sessionData) {
      throw new Error(`No session found for user: ${userId}`);
    }
    
    const result = await sessionData.client.get('/user');
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private sendResponse(ws: WebSocket, response: WSResponse) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  private sendError(ws: WebSocket, id: string | undefined, code: number, message: string, data?: any) {
    this.sendResponse(ws, {
      id,
      error: {
        code,
        message,
        data: data instanceof Error ? data.message : data
      }
    });
  }

  async start(): Promise<void> {
    const port = this.config.port || 3001;
    const host = this.config.host || 'localhost';

    return new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        logger.info(`WebSocket transport started on ws://${host}:${port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        logger.error('WebSocket server error', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    // Close all WebSocket connections
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('WebSocket transport stopped');
        resolve();
      });
    });
  }
}