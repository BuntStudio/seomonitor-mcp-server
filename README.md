# SEOMonitor MCP Server

A Model Context Protocol (MCP) server that provides access to SEOMonitor's API for AI assistants like Claude Desktop.

## Installation & Usage

### Via NPX (Recommended)
```bash
npx seomonitor-mcp-server
```

### Via npm Global Install
```bash
npm install -g seomonitor-mcp-server
seomonitor-mcp
```

## Configuration

### Environment Variables
- `SEOMONITOR_API_KEY` (required): Your SEOMonitor API key

### Claude Desktop Configuration

Add this to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "npx",
      "args": ["seomonitor-mcp-server"],
      "env": {
        "SEOMONITOR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Available Tools

The server provides access to SEOMonitor's API endpoints as MCP tools:

- Campaign management
- Keyword tracking  
- Traffic analytics
- Research tools
- Forecasting
- And more...

## CLI Options

```bash
seomonitor-mcp --help
```

Options:
- `--log-level <level>`: Set log level (debug, info, warn, error)
- `--help`: Show help message

## Requirements

- Node.js 18+
- SEOMonitor API key

## Development

```bash
# Clone the repository
git clone <repository-url>
cd seomonitor-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev
```

## License

MIT

A Model Context Protocol (MCP) server that provides access to SEOMonitor's comprehensive SEO API suite. This server enables AI applications like Claude Desktop to integrate real-time SEO data and insights directly into conversations.

## Features

- 🔌 **Multiple Transport Options**: STDIO, HTTP REST API, WebSocket
- 🛠️ **27 SEO Tools**: Complete coverage of SEOMonitor's core API endpoints
- 🔐 **Secure Authentication**: API key-based authentication system
- 🐳 **Docker Ready**: Full containerization with production-ready setup
- 📊 **Real-time SEO Data**: Live rankings, traffic, and competitive intelligence
- 🚀 **Claude Desktop Integration**: Direct integration with Claude Desktop app
- 🎯 **OpenAPI Compliant**: All tools match SEOMonitor API v3.0 specification

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

### Basic Usage

```bash
# Start STDIO server (for Claude Desktop)
npm start

# Start HTTP server
npm start -- --transport http --port 3001

# Start WebSocket server
npm start -- --transport websocket --port 3001
```

## Available SEO Tools (27 Total)

### 📊 Campaign Management (1 tool)
- `get_tracked_campaigns` - Retrieve all tracked campaigns with performance metrics

### 📈 Rank Tracking (4 tools)
- `get_keyword_data` - Get keyword rankings and metrics with filtering options
- `get_daily_keyword_ranks` - Historical daily ranking data for keywords
- `get_keyword_groups` - Retrieve keyword groups and organization structure
- `get_group_data` - Get performance metrics for specific keyword groups

### 🔍 Advanced Rank Tracking (8 tools)
- `get_keywords_competition` - Detailed competitor analysis for keywords
- `get_serp_feature_presence` - Track SERP features over time
- `get_top_results` - Top 100 SERP results for keywords
- `get_keyword_ai_overview` - AI Overview presence data for keywords
- `get_ranking_pages` - Pages ranking for specific keywords
- `get_daily_group_visibility` - Daily visibility metrics for keyword groups
- `add_keywords` - Add new keywords to campaigns
- `get_keyword_import_status` - Check status of keyword import tasks

### 🚦 Traffic Analytics (2 tools)
- `get_daily_traffic_data` - Daily organic traffic metrics and trends
- `get_traffic_by_keywords` - Keyword-specific traffic data and performance

### 🔎 Keyword Research (6 tools)
- `get_related_keywords` - Find semantically related keywords for topics
- `get_topic_overview` - Comprehensive topic analysis and insights
- `get_domain_overview` - Domain-level SEO metrics and overview
- `get_domain_ranking_keywords` - Keywords a domain currently ranks for
- `get_research_keyword_data` - Detailed keyword research data
- `get_research_ranking_data` - Historical ranking data for research

### 📅 Forecasting (4 tools)
- `get_forecast_scenarios` - List available forecast scenarios
- `get_forecast_scenario_data` - Detailed forecast data for specific scenarios
- `get_forecast_objective_data` - Objective-specific forecast metrics
- `get_forecast_keywords` - Keyword-level forecasting data

### 📚 Keyword Vault (2 tools)
- `get_keyword_vault_data` - Vault tracking and metrics
- `get_keyword_vault_overview` - Overview of Keyword Vault performance

## Claude Desktop Integration

### Step 1: Add to Claude Desktop Configuration

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "node",
      "args": ["/absolute/path/to/seomonitor-mcp-server/dist/index.js"],
      "env": {
        "SEOMONITOR_API_KEY": "your-seomonitor-api-key-here"
      }
    }
  }
}
```

### Step 2: Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the SEOMonitor tools.

### Step 3: Start Using SEO Tools

```
Can you get my tracked campaigns and show me the performance for the top 3?
```

```
Show me keyword data for campaign ID 12345, focusing on keywords with ranking improvements
```

```
Get competitor analysis for my main keywords in campaign 67890
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# SEOMonitor API Configuration
SEOMONITOR_API_KEY=your-api-key-here
SEOMONITOR_BASE_URL=https://apigw.seomonitor.com

# Server Configuration  
PORT=3001
HOST=localhost
TRANSPORT=stdio
NODE_ENV=development

# Authentication (for HTTP/WebSocket modes)
API_KEY=your-server-api-key
ENABLE_AUTH=false

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
  -t, --transport <type>     Transport: stdio, http, websocket (default: stdio)
  -p, --port <number>        Port for HTTP/WebSocket (default: 3001)
  -h, --host <host>          Host address (default: localhost)
  --api-key <key>            Server API key for authentication
  --enable-auth              Enable API key authentication
  --log-level <level>        Log level: debug, info, warn, error
  --help                     Show help message
```

## HTTP REST API Usage

When running in HTTP mode (`--transport http`):

### List Available Tools
```bash
curl http://localhost:3001/api/mcp/tools
```

### Execute a Tool
```bash
curl -X POST http://localhost:3001/api/mcp/tools/get_tracked_campaigns \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "offset": 0}'
```

### Example: Get Keyword Data
```bash
curl -X POST http://localhost:3001/api/mcp/tools/get_keyword_data \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": 12345,
    "start_date": "2024-01-01", 
    "end_date": "2024-01-31",
    "limit": 100
  }'
```

## Running with Docker

This project is fully containerized and can be run using Docker and Docker Compose.

### Local Development Setup

Follow these steps to run the MCP server locally for development.

**1. Create Environment File**

The Docker Compose setup requires a `.env` file for configuration. You can create one by copying the example file:

```bash
cp .env.example .env
```

**2. Configure API Key**

Open the newly created `.env` file and add your SEOMonitor API key:

```env
SEOMONITOR_API_KEY=your-seomonitor-api-key-here
```

**3. Build and Run the Container**

Use Docker Compose to build the image and start the server in detached mode:

```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

The server will be available on `http://localhost:3001`.

**4. Verify the Server**

You can check if the server is running by accessing the health check endpoint:

```bash
curl http://localhost:3001/health
```

**5. Stop the Server**

To stop the container, run:

```bash
docker-compose -f docker/docker-compose.yml down
```

### Production Deployment

For production, use the `docker-compose.prod.yml` file, which is optimized for performance and scalability.

```bash
# Ensure your .env file is configured for production

# Start the services
docker-compose -f docker/docker-compose.prod.yml up -d

# Scale the service (optional)
docker-compose -f docker/docker-compose.prod.yml up -d --scale seomonitor-mcp=3
```

## Development

### Project Structure

```
seomonitor-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # Core MCP server implementation
│   ├── types.ts              # TypeScript type definitions
│   ├── logger.ts             # Structured logging utilities
│   ├── transports/           # Transport layer implementations
│   │   ├── stdio.ts          # STDIO transport (Claude Desktop)
│   │   ├── http.ts           # HTTP REST API server
│   │   └── websocket.ts      # WebSocket server
│   ├── clients/              # External API clients
│   │   ├── api-client.ts     # Generic HTTP client
│   │   └── seomonitor-client.ts # SEOMonitor API client
│   ├── auth/                 # Authentication utilities
│   └── mcp-tools/            # MCP tool implementations
│       ├── index.ts          # Dynamic tool discovery
│       ├── campaign-tools.ts         # Campaign management (1 tool)
│       ├── rank-tracking-tools.ts    # Basic rank tracking (4 tools)
│       ├── rank-advanced-tools.ts    # Advanced ranking (8 tools)
│       ├── traffic-tools.ts          # Traffic analytics (2 tools)
│       ├── research-tools.ts         # Keyword research (6 tools)
│       ├── forecast-tools.ts         # Forecasting (4 tools)
│       └── vault-tools.ts            # Content vault (2 tools)
├── bin/
│   └── mcp-server.js         # CLI executable wrapper
├── docker/                   # Docker configuration
└── dist/                     # Compiled TypeScript output
```

### Development Commands

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run with specific transport
npm run start:stdio
npm run start:http  
npm run start:ws

# Docker development
npm run docker:build
npm run docker:run
```

### Adding New Tools

1. **Create tool definition** in appropriate `*-tools.ts` file:
```typescript
static getYourToolDefinition() {
  return {
    name: 'your_tool_name',
    description: 'Tool description',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'integer',
          description: 'Campaign ID'
        }
      },
      required: ['campaign_id']
    }
  };
}
```

2. **Implement execution method**:
```typescript
static async executeYourTool(args: any, seoClient: SEOMonitorClient) {
  const { campaign_id } = args;
  const result = await seoClient.yourApiMethod(campaign_id);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
```

3. **Add to definitions and execute methods** - tools are automatically discovered!

## API Integration Examples

### Campaign Performance Analysis
```typescript
// Get all campaigns
const campaigns = await mcp.callTool('get_tracked_campaigns', { limit: 50 });

// Analyze keyword performance for top campaign
const keywordData = await mcp.callTool('get_keyword_data', {
  campaign_id: campaigns[0].campaign_info.id,
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  limit: 100
});
```

### Competitive Intelligence
```typescript
// Get competitor analysis
const competition = await mcp.callTool('get_keywords_competition', {
  campaign_id: 12345,
  device: 'desktop',
  start_date: '2024-01-01', 
  end_date: '2024-01-31'
});

// Get SERP features
const serpFeatures = await mcp.callTool('get_keyword_ai_overview', {
  campaign_id: 12345,
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});
```

### Keyword Research Workflow
```typescript
// Research topic
const topicOverview = await mcp.callTool('get_topic_overview', {
  topic: 'digital marketing',
  country: 'US',
  language: 'en'
});

// Get related keywords
const relatedKeywords = await mcp.callTool('get_related_keywords', {
  topic: 'digital marketing',
  country: 'US',
  limit: 100
});

// Analyze competitor domains
const domainOverview = await mcp.callTool('get_domain_overview', {
  domain: 'competitor.com',
  country: 'US'
});
```

## Troubleshooting

### Common Issues

1. **Claude Desktop not loading tools**:
   - Verify absolute paths in configuration
   - Check that `dist/` folder exists after build
   - Ensure SEOMONITOR_API_KEY is set correctly
   - Restart Claude Desktop after config changes

2. **Authentication errors**:
   - Verify SEOMonitor API key is valid
   - Check API key has proper permissions
   - Ensure base URL is correct

3. **Tool execution errors**:
   - Enable debug logging: `LOG_LEVEL=debug`
   - Check parameter types match tool requirements
   - Verify campaign IDs exist and are accessible

### Debug Mode

```bash
# Enable detailed logging
export LOG_LEVEL=debug
npm start

# Check tool loading
npm start -- --transport stdio --log-level debug

# Test HTTP endpoints
curl -v http://localhost:3001/api/mcp/tools
```

## Performance Considerations

- **Rate Limiting**: SEOMonitor API has rate limits - implement appropriate delays
- **Caching**: Consider caching frequently requested data
- **Pagination**: Use limit/offset parameters for large datasets
- **Date Ranges**: Smaller date ranges improve response times

## Security

- **API Keys**: Store in environment variables, never in code
- **HTTPS**: Use HTTPS in production deployments
- **CORS**: Configure appropriate CORS origins for web clients
- **Authentication**: Enable API key auth for HTTP/WebSocket transports

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-tool`)
3. Follow existing code patterns and OpenAPI compliance
4. Add tests for new functionality
5. Submit a pull request with detailed description

## License

MIT License - see LICENSE file for details

## Support

- **GitHub Issues**: [Report issues and feature requests](https://github.com/seomonitor/mcp-server/issues)
- **SEOMonitor API Docs**: [Official API documentation](https://docs.seomonitor.com)
- **MCP Protocol**: [Model Context Protocol specification](https://modelcontextprotocol.io)

---

*This MCP server provides comprehensive SEO data access for AI applications, enabling intelligent SEO analysis and recommendations directly within Claude Desktop and other MCP-compatible tools.*