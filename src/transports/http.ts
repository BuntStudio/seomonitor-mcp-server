import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MCPServer } from '../server.js';
import { MCPServerConfig } from '../types.js';
import { logger } from '../logger.js';
import { RateLimiter } from '../rate-limiter.js';

const JSON_BODY_LIMIT = '4mb';
const MARKETING_URL = process.env.MCP_MARKETING_URL || 'https://www.seomonitor.com/mcp';
const RATE_LIMIT_RPM = Number(process.env.MCP_RATE_LIMIT_RPM || '60');
const RATE_LIMIT_BURST = Number(process.env.MCP_RATE_LIMIT_BURST || '30');

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
    const rateLimiter = new RateLimiter(RATE_LIMIT_RPM, RATE_LIMIT_BURST);
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
    //
    // The resource identity is the bare host — the published connect URL. The
    // /mcp alias serves the same metadata so connectors on the old URL keep
    // working; nothing downstream reads the value (the access token carries no
    // audience claim), so both forms resolve to the same server either way.
    const publicUrl = (process.env.MCP_PUBLIC_URL || 'https://mcp.seomonitor.com').replace(/\/$/, '');
    const authServerUrl = (process.env.MCP_AUTH_SERVER_URL || 'https://auth.seomonitor.com').replace(/\/$/, '');
    const resourceMetadata = (_req: Request, res: Response) => {
      res.json({
        resource: publicUrl,
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

      const retryAfter = rateLimiter.check(apiKey);
      if (retryAfter > 0) {
        logger.warn('Rate limit exceeded', { apiKey: maskKey(apiKey), retryAfter });
        res.setHeader('Retry-After', String(retryAfter));
        jsonRpcError(res, 429, -32029, `Rate limit exceeded (${RATE_LIMIT_RPM} requests/minute per API key). Retry after ${retryAfter}s.`);
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

    // Bare host — the published connect URL. Bearer only: there is no path
    // segment to carry a key here, and a root :apiKey wildcard would shadow
    // /health and the well-known URIs.
    app.post('/', handleMcpPost);
    app.delete('/', handleMcpNonPost);
    app.get('/', (req: Request, res: Response) => {
      // Browsers get the marketing page; everything else keeps the 405 that
      // /mcp returns, so a client probing the URL before it POSTs sees a
      // known-good shape. Test the header directly rather than req.accepts():
      // that resolves a missing or */* Accept to the first listed type, which
      // would divert non-browser callers into an HTML page.
      // If SSE-on-GET is ever added, exempt Accept: text/event-stream here.
      if (req.headers.accept?.includes('text/html')) {
        res.redirect(302, MARKETING_URL);
        return;
      }
      handleMcpNonPost(req, res);
    });

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
