import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MCPServer } from '../server.js';
import { MCPServerConfig } from '../types.js';
import { logger } from '../logger.js';

const JSON_BODY_LIMIT = '4mb';

// Never log full API keys — show enough to correlate a user, nothing more
function maskKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

function extractApiKey(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const pathKey = req.params.apiKey;
  if (pathKey) return pathKey;
  return undefined;
}

function jsonRpcError(res: Response, httpStatus: number, code: number, message: string) {
  res.status(httpStatus).json({
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  });
}

export class HttpTransport {
  private config: MCPServerConfig;
  private httpServer: HttpServer | null = null;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json({ limit: JSON_BODY_LIMIT }));

    // CORS for browser-based MCP clients; harmless for Claude Desktop
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version');
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', server: 'seomonitor-mcp-server' });
    });

    // RFC 9728 protected-resource metadata: points OAuth-capable MCP clients
    // (Claude, ChatGPT) at the authorization server. Key-in-URL connectors are
    // unaffected. Clients probe both the root and path-suffixed well-known URI.
    const publicUrl = (process.env.MCP_PUBLIC_URL || 'https://mcp.seomonitor.com').replace(/\/$/, '');
    const authServerUrl = (process.env.MCP_AUTH_SERVER_URL || 'https://auth.seomonitor.com').replace(/\/$/, '');
    const resourceMetadata = (_req: Request, res: Response) => {
      res.json({
        resource: `${publicUrl}/mcp`,
        authorization_servers: [authServerUrl],
        bearer_methods_supported: ['header'],
      });
    };
    app.get('/.well-known/oauth-protected-resource', resourceMetadata);
    app.get('/.well-known/oauth-protected-resource/mcp', resourceMetadata);

    const resourceMetadataUrl = `${publicUrl}/.well-known/oauth-protected-resource`;

    const handleMcpPost = async (req: Request, res: Response) => {
      const apiKey = extractApiKey(req);
      if (!apiKey) {
        res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`);
        jsonRpcError(res, 401, -32001, 'Missing SEOmonitor API key. Provide it as a Bearer token or in the connector URL: https://<host>/{API_KEY}/mcp');
        return;
      }

      logger.info('🌐 HTTP MCP request', {
        method: req.body?.method,
        apiKey: maskKey(apiKey),
      });

      // Stateless mode: a fresh server + transport per request, keyed to the
      // caller's API key, so one process serves many users concurrently.
      const mcpServer = new MCPServer(this.config, apiKey);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on('close', () => {
        transport.close();
        mcpServer.stop().catch(() => {});
      });

      try {
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error('HTTP MCP request failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!res.headersSent) {
          jsonRpcError(res, 500, -32603, 'Internal server error');
        }
      }
    };

    // Stateless server: no session to resume (GET/SSE) or terminate (DELETE)
    const handleMcpNonPost = (_req: Request, res: Response) => {
      jsonRpcError(res, 405, -32000, 'Method not allowed. This server runs in stateless mode; send POST requests.');
    };

    app.post('/mcp', handleMcpPost);
    app.get('/mcp', handleMcpNonPost);
    app.delete('/mcp', handleMcpNonPost);

    app.post('/:apiKey/mcp', handleMcpPost);
    app.get('/:apiKey/mcp', handleMcpNonPost);
    app.delete('/:apiKey/mcp', handleMcpNonPost);

    const port = this.config.port || 3000;
    await new Promise<void>((resolve, reject) => {
      this.httpServer = app.listen(port, () => resolve());
      this.httpServer.on('error', reject);
    });

    logger.rotateLogs();
    logger.info('🚀 MCP Server listening on HTTP', { port, endpoint: '/mcp' });
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
      this.httpServer = null;
    }
  }
}
