# SEOMonitor MCP Server

A Model Context Protocol (MCP) server that provides access to SEOMonitor's comprehensive SEO API suite. This server can be used with Claude Desktop, AI applications, or any MCP-compatible client to integrate real-time SEO data and insights.

## Features

- 🔌 **Multiple Transport Options**: STDIO, HTTP REST API, WebSocket
- 🛠️ **28+ SEO Tools**: Complete SEOMonitor API coverage
- 🔐 **Flexible Authentication**: API key-based auth with session management
- 🐳 **Docker Ready**: Full containerization support
- 📊 **Real-time Data**: Live SEO metrics and analytics
- 🚀 **Easy Integration**: Works with Claude Desktop and custom applications

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd seomonitor-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage Options

#### 1. STDIO Mode (Claude Desktop Integration)

```bash
# Start STDIO server (default)
npm start

# Or with explicit transport
npm start -- --transport stdio
```

#### 2. HTTP REST API Server

```bash
# Start HTTP server
npm start -- --transport http --port 3001

# With authentication
npm start -- --transport http --port 3001 --enable-auth --api-key your-secret-key
```

#### 3. WebSocket Server

```bash
# Start WebSocket server
npm start -- --transport websocket --port 3001 --enable-auth
```

#### 4. Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Or build manually
docker build -f docker/Dockerfile -t seomonitor-mcp-server .
docker run -p 3001:3001 -e TRANSPORT=http seomonitor-mcp-server
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3001
HOST=localhost
NODE_ENV=development
TRANSPORT=stdio

# Authentication
API_KEY=your-api-key-here
ENABLE_AUTH=true

# SEOMonitor API
SEOMONITOR_BASE_URL=https://apigw.seomonitor.com

# Logging
LOG_LEVEL=info
LOG_FILE=mcp-server.log

# CORS (for HTTP/WebSocket)
CORS_ORIGIN=*
```

### Command Line Options

```bash
seomonitor-mcp [options]

Options:
  -t, --transport <type>     Transport type: stdio, http, websocket
  -p, --port <number>        Port for HTTP/WebSocket (default: 3001)
  -h, --host <host>          Host address (default: localhost)
  --api-key <key>            API key for authentication
  --enable-auth              Enable API key authentication
  --log-level <level>        Log level: debug, info, warn, error
  --help                     Show help message
```

## API Documentation

### Available Tools

The server provides 28+ tools across 7 categories:

#### Campaign Management
- `get_tracked_campaigns` - Retrieve all tracked campaigns
- Campaign analytics and performance metrics

#### Rank Tracking  
- `get_keyword_data` - Get keyword rankings and metrics
- `get_daily_keyword_ranks` - Historical ranking data
- `get_keyword_groups` - Keyword group management

#### Traffic Analytics
- `get_daily_traffic_data` - Organic traffic metrics
- `get_traffic_by_keywords` - Keyword-specific traffic data

#### Competition Analysis
- `get_competition_data` - Competitor analysis
- Market share and visibility metrics

#### Keyword Research
- `seo_research_keywords` - Keyword research and suggestions
- `get_related_keywords` - Find related keywords
- `get_topic_overview` - Topic analysis

#### Forecasting
- `get_forecast_scenarios` - Traffic forecasting
- `get_forecast_data` - Projection data

#### Content Vault
- Content performance tracking
- Page-level SEO metrics

### HTTP REST API

When running in HTTP mode, the server exposes these endpoints:

#### Environment Setup
The server automatically uses your SEOMonitor API key from the `SEOMONITOR_API_KEY` environment variable.

#### List Available Tools
```http
GET /api/mcp/tools
Authorization: Bearer your-api-key
```

#### Execute Tool
```http
POST /api/mcp/tools/get_tracked_campaigns
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "limit": 50,
  "offset": 0
}
```

### WebSocket API

Connect to `ws://localhost:3001` and send JSON-RPC 2.0 messages:

#### List Tools
```json
{
  "id": "1",
  "method": "tools/list",
  "params": {}
}
```

#### Execute Tool
```json
{
  "id": "2", 
  "method": "tools/call",
  "params": {
    "name": "get_tracked_campaigns",
    "arguments": {
      "limit": 50
    }
  }
}
```

## Claude Desktop Integration

Add this to your Claude Desktop MCP configuration:

### Windows
`%APPDATA%\Claude\claude_desktop_config.json`

### macOS
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "node",
      "args": ["/path/to/seomonitor-mcp-server/dist/index.js"],
      "env": {
        "SEOMONITOR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Replace `/path/to/seomonitor-mcp-server/` with the actual path to your installation.**

## Development

### Project Structure

```
seomonitor-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # Core MCP server
│   ├── types.ts              # TypeScript definitions
│   ├── logger.ts             # Logging utilities
│   ├── transports/           # Transport layers
│   │   ├── stdio.ts          # STDIO transport
│   │   ├── http.ts           # HTTP REST API
│   │   └── websocket.ts      # WebSocket transport
│   ├── clients/              # API clients
│   │   ├── api-client.ts     # Generic API client
│   │   └── seomonitor-client.ts # SEOMonitor API client
│   └── mcp-tools/            # MCP tool implementations
│       ├── index.ts          # Dynamic tool loader
│       ├── campaign-tools.ts
│       ├── rank-tracking-tools.ts
│       ├── traffic-tools.ts
│       ├── research-tools.ts
│       ├── forecast-tools.ts
│       ├── vault-tools.ts
│       └── rank-advanced-tools.ts
├── bin/
│   └── mcp-server.js         # CLI wrapper
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
└── docs/                     # Additional documentation
```

### Building and Testing

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run specific transport for testing
npm run start:http
npm run start:ws

# Docker development
npm run docker:build
npm run docker:run
```

### Adding New Tools

1. Create tool in appropriate `*-tools.ts` file
2. Follow the existing pattern with static methods
3. Tools are automatically discovered and registered
4. No manual registration required!

Example tool structure:

```typescript
export class YourTools {
  static getAllDefinitions() {
    return [
      {
        name: 'your_tool_name',
        description: 'Tool description',
        inputSchema: {
          type: 'object',
          properties: {
            // Define parameters
          },
          required: ['userId', 'param1']
        }
      }
    ];
  }

  static async execute(toolName: string, args: any, seoClient: SEOMonitorClient) {
    // Implementation
  }
}
```

## Production Deployment

### Docker Production Setup

1. **Create production environment file**:
```bash
cp .env.example .env.production
# Edit with production values
```

2. **Deploy with Docker Compose**:
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

3. **With load balancer**:
```bash
docker-compose -f docker/docker-compose.prod.yml --profile production up -d
```

### Scaling

The server is stateless except for user sessions, making it easy to scale:

```bash
# Scale to 3 instances
docker-compose -f docker/docker-compose.prod.yml up -d --scale seomonitor-mcp=3
```

### Monitoring

- Health check: `GET /health`
- Logs: Structured JSON logging with configurable levels
- Metrics: Container resource usage via Docker

## Troubleshooting

### Common Issues

1. **MCP Tools Not Loading**:
   ```bash
   # Check if dist files exist after build
   ls dist/mcp-tools/

   # Enable debug logging
   export LOG_LEVEL=debug
   npm start
   ```

2. **Authentication Issues**:
   ```bash
   # Verify API key format
   curl -H "Authorization: Bearer your-key" http://localhost:3001/health
   ```

3. **CORS Issues**:
   ```bash
   # Update CORS_ORIGIN environment variable
   export CORS_ORIGIN="https://your-domain.com"
   ```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Check tool loading
npm start -- --transport stdio --log-level debug

# Test HTTP endpoints
curl -X GET http://localhost:3001/api/mcp/tools
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following existing patterns
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: [Additional docs in /docs folder]
- SEOMonitor API: [Official API documentation]

---

## Integration Examples

### Node.js Client

```javascript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3001/api/mcp',
  headers: { 'Authorization': 'Bearer your-api-key' }
});

// Get campaigns (server uses SEOMONITOR_API_KEY from environment)
const campaigns = await client.post('/tools/get_tracked_campaigns', {
  limit: 10
});
```

### Python Client

```python
import requests

class SEOMonitorMCP:
    def __init__(self, base_url="http://localhost:3001", api_key=None):
        self.base_url = f"{base_url}/api/mcp"
        self.headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    
    def call_tool(self, tool_name, **kwargs):
        return requests.post(f"{self.base_url}/tools/{tool_name}", 
                           json=kwargs, 
                           headers=self.headers)

# Usage (server uses SEOMONITOR_API_KEY from environment)
mcp = SEOMonitorMCP(api_key="your-api-key")
campaigns = mcp.call_tool("get_tracked_campaigns", limit=10)
```