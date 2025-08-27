import express from 'express';
import cors from 'cors';
import { createServer, Server } from 'http';
import { MCPServerConfig, MCPAuthContext } from '../types.js';
import { getAllToolDefinitions, executeToolByName } from '../mcp-tools/index.js';
import { DynamicApiClient } from '../clients/api-client.js';
import { SEOMonitorClient } from '../clients/seomonitor-client.js';
import { UserSession } from '../types.js';
import { logger } from '../logger.js';

export class HttpTransport {
  private app: express.Application;
  private server: Server;
  private config: MCPServerConfig;
  private sessions: Map<string, { client: DynamicApiClient; seoClient: SEOMonitorClient; session: UserSession }> = new Map();

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: this.config.corsOrigin || '*',
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Authentication middleware for protected routes
    if (this.config.enableAuth) {
      this.app.use('/api/mcp', this.authenticateRequest.bind(this));
    }

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.method !== 'GET' ? req.body : undefined
      });
      next();
    });
  }

  private authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-key'] as string;
    
    if (!apiKey || (this.config.apiKey && apiKey !== this.config.apiKey)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid API key required'
      });
      return;
    }

    // Add auth context to request
    req.authContext = {
      apiKey,
      authenticated: true
    };

    next();
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        transport: 'http'
      });
    });

    // List available tools
    this.app.get('/api/mcp/tools', async (req, res) => {
      try {
        const tools = await getAllToolDefinitions();
        res.json({
          success: true,
          data: {
            tools,
            count: tools.length
          }
        });
      } catch (error) {
        logger.error('Failed to list tools', error);
        res.status(500).json({
          success: false,
          error: 'Failed to list tools',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Set user session
    this.app.post('/api/mcp/session', async (req, res) => {
      try {
        const { userId, apiKey, baseUrl } = req.body;

        if (!userId || !apiKey || !baseUrl) {
          res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'userId, apiKey, and baseUrl are required'
          });
          return;
        }

        const session: UserSession = { userId, apiKey, baseUrl };
        const client = new DynamicApiClient(session);
        const seoClient = new SEOMonitorClient(session);

        this.sessions.set(userId, { client, seoClient, session });

        logger.info(`Session created for user: ${userId}`);

        res.json({
          success: true,
          message: `Session created successfully for user: ${userId}`
        });
      } catch (error) {
        logger.error('Failed to create session', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create session',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Execute tool
    this.app.post('/api/mcp/tools/:toolName', async (req, res) => {
      try {
        const { toolName } = req.params;
        const args = req.body;

        logger.info(`Executing tool: ${toolName}`, args);

        // Handle basic API tools
        let result;
        switch (toolName) {
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
            const { userId } = args;
            if (!userId) {
              res.status(400).json({
                success: false,
                error: 'Missing userId',
                message: 'userId is required for SEOMonitor tools'
              });
              return;
            }

            const sessionData = this.sessions.get(userId);
            if (!sessionData) {
              res.status(400).json({
                success: false,
                error: 'Session not found',
                message: `No session found for user: ${userId}`
              });
              return;
            }

            result = await executeToolByName(toolName, args, sessionData.seoClient);
        }

        res.json({
          success: true,
          data: result
        });

      } catch (error) {
        logger.error(`Tool execution failed: ${req.params.toolName}`, error);
        res.status(500).json({
          success: false,
          error: 'Tool execution failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error handler', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  private async handleSetUserSession(args: any) {
    const { userId, apiKey, baseUrl } = args;
    const session: UserSession = { userId, apiKey, baseUrl };
    const client = new DynamicApiClient(session);
    const seoClient = new SEOMonitorClient(session);
    this.sessions.set(userId, { client, seoClient, session });
    return { message: `Session created successfully for user: ${userId}` };
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

    return result;
  }

  private async handleGetUserData(args: any) {
    const { userId } = args;
    const sessionData = this.sessions.get(userId);
    if (!sessionData) {
      throw new Error(`No session found for user: ${userId}`);
    }
    return await sessionData.client.get('/user');
  }

  async start(): Promise<void> {
    const port = this.config.port || 3001;
    const host = this.config.host || 'localhost';

    return new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        logger.info(`HTTP transport started on http://${host}:${port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        logger.error('HTTP server error', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('HTTP transport stopped');
        resolve();
      });
    });
  }
}

// Extend Express Request type to include auth context
declare global {
  namespace Express {
    interface Request {
      authContext?: MCPAuthContext;
    }
  }
}