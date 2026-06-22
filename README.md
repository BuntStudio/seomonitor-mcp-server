# SEOMonitor MCP Server

A Model Context Protocol (MCP) server that provides access to SEOMonitor's API for AI assistants like Claude Desktop.

## Installation & Usage

### Via npx (Recommended)
```bash
npx github:BuntStudio/seomonitor-mcp-server
```

### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/BuntStudio/seomonitor-mcp-server.git
cd seomonitor-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Environment Variables
- `SEOMONITOR_API_KEY` (required): Your SEOMonitor API key
- `SEOMONITOR_HTTP_TIMEOUT_MS` (optional): HTTP timeout in milliseconds for SEOMonitor API requests made by tools. Defaults to 180000 (180s), ensuring tool calls can run over 120s.

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

The server provides 45 comprehensive SEO tools organized into categories. Every tool name is prefixed with `seomonitor_` to avoid collisions with tools exposed by other MCP servers:

- **1 Campaign tool** - tracked campaigns
- **4 Rank tracking tools** - keyword data, daily ranks, groups, group metrics
- **8 Advanced rank tracking tools** - competition analysis, SERP features, AI overview presence
- **4 AI Overview (AIO) tools** - daily ranks, competition, group mentions/citations visibility
- **5 AI Search (AIS) tools** - keyword data, daily ranks, competition, group mentions/citations visibility
- **3 Visibility tools** - share of voice, daily share of clicks, SERP visibility
- **4 AI Writer tools** - article content, generate outlines/articles, generation status, topic recommendations
- **2 Traffic analytics tools** - daily traffic data and keyword-specific metrics
- **6 Research tools** - related keywords, topic analysis, domain insights
- **4 Forecasting tools** - scenarios, objectives, keyword forecasts
- **3 Keyword Vault tools** - vault data, overview, lists
- **1 Dashboard tool** - list companies (accounts)

All tools are automatically discovered and loaded at runtime.

## CLI Options

```bash
seomonitor-mcp --help
```

Options:
- `--log-level <level>`: Set log level (debug, info, warn, error)
- `--help`: Show help message

The server runs in STDIO mode by default for Claude Desktop integration.

## Requirements

- Node.js 18+
- SEOMonitor API key

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development with auto-reload
npm run dev

# Start built version
npm start
```

## License

MIT

## Features

- 🛠️ **27 Dynamic SEO Tools**: Complete coverage of SEOMonitor's core API endpoints
- 🔐 **API Key Authentication**: Secure access to SEOMonitor data
- 📊 **Real-time SEO Data**: Live rankings, traffic, and competitive intelligence
- 🚀 **Claude Desktop Integration**: STDIO transport for seamless AI integration
- 🔍 **Dynamic Tool Discovery**: Tools are automatically loaded and registered at runtime
- 🎯 **OpenAPI Compliant**: All tools match SEOMonitor API v3.0 specification
- 🏗️ **TypeScript**: Full type safety and modern development experience

## Quick Start

### Option 1: Direct Usage (Recommended)

```bash
# Run directly from GitHub
npx github:BuntStudio/seomonitor-mcp-server
```

### Option 2: Local Development

```bash
# Clone and setup
git clone https://github.com/BuntStudio/seomonitor-mcp-server.git
cd seomonitor-mcp-server
npm install
npm run build

# Start STDIO server (for Claude Desktop)
npm start

# Development mode with auto-reload
npm run dev
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

#### Option A: Run via npx (Recommended)
```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "npx",
      "args": ["github:BuntStudio/seomonitor-mcp-server"],
      "env": {
        "SEOMONITOR_API_KEY": "your-seomonitor-api-key-here"
      }
    }
  }
}
```

#### Option B: Run from local clone
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

**Note**: Option A runs directly from GitHub and automatically handles updates. Option B requires local setup but offers more control.

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

# Optional: increase/decrease HTTP timeout (default 180000ms)
# Must be >120000 to allow long-running tool calls
# SEOMONITOR_HTTP_TIMEOUT_MS=180000

# Logging
LOG_LEVEL=info
```

### Command Line Options

```bash
seomonitor-mcp [options]

Options:
  --log-level <level>        Log level: debug, info, warn, error
  --help                     Show help message
```



## Development

### Project Structure

```
seomonitor-mcp-server/
├── src/
│   ├── index.ts              # Main entry point with CLI
│   ├── server.ts             # Core MCP server implementation
│   ├── types.ts              # TypeScript type definitions
│   ├── logger.ts             # Structured logging utilities
│   ├── transports/
│   │   └── stdio.ts          # STDIO transport for Claude Desktop
│   ├── clients/
│   │   └── seomonitor-client.ts # SEOMonitor API client
│   └── mcp-tools/            # MCP tool implementations
│       ├── index.ts          # Dynamic tool discovery & loading
│       ├── campaign-tools.ts         # Campaign management (1 tool)
│       ├── rank-tracking-tools.ts    # Basic rank tracking (4 tools)
│       ├── rank-advanced-tools.ts    # Advanced ranking (8 tools)
│       ├── traffic-tools.ts          # Traffic analytics (2 tools)
│       ├── research-tools.ts         # Keyword research (6 tools)
│       ├── forecast-tools.ts         # Forecasting (4 tools)
│       └── vault-tools.ts            # Keyword Vault (2 tools)
├── bin/
│   └── mcp-server.js         # CLI executable wrapper
└── dist/                     # Compiled TypeScript output
```

### Development Commands

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start built version
npm start
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

3. **Add to class** - tools are automatically discovered at runtime!

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

3. **Tool execution errors**:
   - Enable debug logging: `--log-level debug`
   - Check parameter types match tool requirements
   - Verify campaign IDs exist and are accessible

### Debug Mode

```bash
# Enable detailed logging
npm start -- --log-level debug

# Or set environment variable
export LOG_LEVEL=debug
npm start
```

## Performance Considerations

- **Rate Limiting**: SEOMonitor API has rate limits - implement appropriate delays
- **Pagination**: Use limit/offset parameters for large datasets
- **Date Ranges**: Smaller date ranges improve response times

## Security

- **API Keys**: Store in environment variables, never in code
- **Private Package**: This package is marked as private and not published to npm

## Contributing

1. Fork the repository at https://github.com/BuntStudio/seomonitor-mcp-server
2. Create a feature branch (`git checkout -b feature/new-tool`)
3. Follow existing code patterns and OpenAPI compliance
4. Add tests for new functionality
5. Submit a pull request with detailed description

## License

MIT License - see LICENSE file for details

## Support

- **GitHub Issues**: [Report issues and feature requests](https://github.com/BuntStudio/seomonitor-mcp-server/issues)
- **SEOMonitor API Docs**: [Official API documentation](https://docs.seomonitor.com)
- **MCP Protocol**: [Model Context Protocol specification](https://modelcontextprotocol.io)

---

*This MCP server provides comprehensive SEO data access for AI applications, enabling intelligent SEO analysis and recommendations directly within Claude Desktop and other MCP-compatible tools.*
