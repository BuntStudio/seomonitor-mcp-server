# SEOMonitor MCP Server

A **Model Context Protocol (MCP) server** for accessing [SEOMonitor](https://www.seomonitor.com)’s API in AI assistants like Claude Desktop.

---

## 🚀 Quick Start

### Run via npx (Recommended)
```bash
npx github:BuntStudio/seomonitor-mcp-server
```

### Local Development
```bash
git clone https://github.com/BuntStudio/seomonitor-mcp-server.git
cd seomonitor-mcp-server
npm install
npm run build
npm start
```

Requirements:
- Node.js **18+**
- A valid **SEOMonitor API key**

---

## ⚙️ Configuration

Set environment variables in `.env` or in your MCP config:

```env
SEOMONITOR_API_KEY=your-api-key-here

# Optional
SEOMONITOR_HTTP_TIMEOUT_MS=180000  # Default 180s, must be >120s
LOG_LEVEL=info
```

---

## 📦 Claude Desktop Integration

### Config File
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

#### Option A: Run via npx (auto-updates)
```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "npx",
      "args": ["github:BuntStudio/seomonitor-mcp-server"],
      "env": { "SEOMONITOR_API_KEY": "your-seomonitor-api-key-here" }
    }
  }
}
```

#### Option B: Local clone
```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "node",
      "args": ["/absolute/path/to/seomonitor-mcp-server/dist/index.js"],
      "env": { "SEOMONITOR_API_KEY": "your-seomonitor-api-key-here" }
    }
  }
}
```

Restart Claude Desktop to load tools.

---

## 🛠️ Available Tools (27 Total)

### Campaign Management (1)
- `get_tracked_campaigns`

### Rank Tracking (4)
- `get_keyword_data`
- `get_daily_keyword_ranks`
- `get_keyword_groups`
- `get_group_data`

### Advanced Rank Tracking (8)
- `get_keywords_competition`
- `get_serp_feature_presence`
- `get_top_results`
- `get_keyword_ai_overview`
- `get_ranking_pages`
- `get_daily_group_visibility`
- `add_keywords`
- `get_keyword_import_status`

### Traffic Analytics (2)
- `get_daily_traffic_data`
- `get_traffic_by_keywords`

### Keyword Research (6)
- `get_related_keywords`
- `get_topic_overview`
- `get_domain_overview`
- `get_domain_ranking_keywords`
- `get_research_keyword_data`
- `get_research_ranking_data`

### Forecasting (4)
- `get_forecast_scenarios`
- `get_forecast_scenario_data`
- `get_forecast_objective_data`
- `get_forecast_keywords`

### Keyword Vault (2)
- `get_keyword_vault_data`
- `get_keyword_vault_overview`

---

## 🏗️ Development

### Commands
```bash
npm run dev     # Dev with auto-reload
npm run build   # Build TypeScript
npm start       # Start built server
```

### Project Structure
```
src/
 ├── index.ts              # CLI entry
 ├── server.ts             # MCP server
 ├── clients/seomonitor-client.ts
 ├── mcp-tools/            # Tool implementations
 │   ├── campaign-tools.ts
 │   ├── rank-tracking-tools.ts
 │   ├── rank-advanced-tools.ts
 │   ├── traffic-tools.ts
 │   ├── research-tools.ts
 │   ├── forecast-tools.ts
 │   └── vault-tools.ts
```

### Adding Tools
1. Define schema in `*-tools.ts`
2. Implement execution
3. Export — tools are auto-discovered

---

## 📊 API Examples

### Campaign Performance
```typescript
const campaigns = await mcp.callTool('get_tracked_campaigns');
const data = await mcp.callTool('get_keyword_data', {
  campaign_id: campaigns[0].campaign_info.id,
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});
```

### Competitive Intelligence
```typescript
const comp = await mcp.callTool('get_keywords_competition', {
  campaign_id: 12345,
  device: 'desktop',
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});
```

### Keyword Research
```typescript
const related = await mcp.callTool('get_related_keywords', {
  topic: 'digital marketing',
  country: 'US',
  limit: 100
});
```

---

## 🔧 Troubleshooting

- **Claude doesn’t load tools**: Check paths, API key, rebuild `dist/`, restart Claude.
- **Auth errors**: Verify API key and permissions.
- **Execution errors**: Enable debug logging.

```bash
npm start -- --log-level debug
```

---
## 📚 Resources

- [SEOMonitor API Docs](https://docs.seomonitor.com)  
- [MCP Specification](https://modelcontextprotocol.io)  
- [GitHub Issues](https://github.com/BuntStudio/seomonitor-mcp-server/issues)
