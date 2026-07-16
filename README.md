# SEOmonitor MCP Server

The official **Model Context Protocol (MCP) server** for [SEOmonitor](https://www.seomonitor.com) — connect Claude, ChatGPT, Gemini CLI, or any MCP-compatible client to your SEO data: rank tracking, AI visibility (AI Overviews & AI search), keyword research, organic traffic, and forecasts.

**Hosted server:** `https://mcp.seomonitor.com` (Streamable HTTP) — no install needed.
Setup guide: [mcp.seomonitor.com](https://mcp.seomonitor.com)

---

## 🚀 Quick Start (hosted — recommended)

You need a **SEOmonitor API key**: in the app, go to **Account → Edit profile → API key**.

### Claude (custom connector)
Settings → Connectors → **Add custom connector**, then use:

```
https://mcp.seomonitor.com/YOUR_API_KEY/mcp
```

### Any Streamable HTTP client
```
POST https://mcp.seomonitor.com/mcp
Authorization: Bearer YOUR_API_KEY
```

Both forms hit the same server; use whichever your client supports. Rate limit: **60 requests/minute per API key** (burst 30) — over-limit calls get HTTP 429 with `Retry-After`.

### Gemini CLI
```bash
gemini extensions install https://github.com/BuntStudio/seomonitor-mcp-server
```
(or add the server manually to `~/.gemini/settings.json` using the Bearer form above)

---

## 💻 Run locally (stdio)

### Via npx
```bash
npx github:BuntStudio/seomonitor-mcp-server
```

### Local clone
```bash
git clone https://github.com/BuntStudio/seomonitor-mcp-server.git
cd seomonitor-mcp-server
npm install && npm run build && npm start
```

Requirements: Node.js **18+**, a valid SEOmonitor API key.

### Claude Desktop config (local stdio)
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

### Environment variables
```env
SEOMONITOR_API_KEY=your-api-key-here   # required for stdio mode

# Optional
SEOMONITOR_HTTP_TIMEOUT_MS=180000      # default 180s, must be >120s
LOG_LEVEL=info
MCP_TRANSPORT=stdio                    # stdio (default) or http
MCP_HTTP_PORT=3000                     # http transport only
MCP_RATE_LIMIT_RPM=60                  # http transport: requests/min per key
MCP_RATE_LIMIT_BURST=30
MCP_ENABLE_WRITE_TOOLS=false           # keep false: public surface is read-only
```

---

## 🛠️ Available Tools (49, all read-only)

Every tool is **read-only** — the server retrieves data from your SEOmonitor account and never modifies it. All tools carry MCP annotations (`readOnlyHint: true`) and are prefixed with `seomonitor_` to avoid collisions.

### Campaigns & Account (2)
- `seomonitor_get_tracked_campaigns`
- `seomonitor_list_companies`

### Rank Tracking (4)
- `seomonitor_get_keyword_data`
- `seomonitor_get_daily_keyword_ranks`
- `seomonitor_get_keyword_groups`
- `seomonitor_get_group_data`

### Advanced Rank Tracking (7)
- `seomonitor_get_keywords_competition`
- `seomonitor_get_serp_feature_presence`
- `seomonitor_get_top_results`
- `seomonitor_get_keyword_ai_overview`
- `seomonitor_get_ranking_pages`
- `seomonitor_get_daily_group_visibility`
- `seomonitor_get_keyword_import_status`

### AI Overview (4)
- `seomonitor_get_daily_keyword_ranks_ai_overview`
- `seomonitor_get_keywords_competition_ai_overview`
- `seomonitor_get_daily_group_visibility_ai_overview_mentions`
- `seomonitor_get_daily_group_visibility_ai_overview_citations`

### AI Search — ChatGPT, Perplexity, Gemini visibility (5)
- `seomonitor_get_keyword_ai_search_data`
- `seomonitor_get_keywords_competition_ai_search`
- `seomonitor_get_daily_ai_search_keyword_ranks`
- `seomonitor_get_daily_group_ai_search_brand_mentions`
- `seomonitor_get_daily_group_ai_search_site_citations`

### Visibility & Share of Voice (3)
- `seomonitor_get_share_of_voice`
- `seomonitor_get_daily_share_of_clicks`
- `seomonitor_get_serp_visibility`

### Organic Traffic (2)
- `seomonitor_get_daily_traffic_data`
- `seomonitor_get_traffic_by_keywords`

### Keyword Research (6)
- `seomonitor_get_related_keywords`
- `seomonitor_get_topic_overview`
- `seomonitor_get_domain_overview`
- `seomonitor_get_domain_ranking_keywords`
- `seomonitor_get_research_keyword_data`
- `seomonitor_get_research_ranking_data`

### Forecasting (4)
- `seomonitor_get_forecast_scenarios`
- `seomonitor_get_forecast_scenario_data`
- `seomonitor_get_forecast_objective_data`
- `seomonitor_get_forecast_keywords`

### Keyword Vault (3)
- `seomonitor_get_keyword_vault_data`
- `seomonitor_get_keyword_vault_overview`
- `seomonitor_get_vault_lists`

### Content / AI Writer (3)
- `seomonitor_get_article_content`
- `seomonitor_get_generation_status`
- `seomonitor_get_topic_recommendations`

### Insights & Composite (6)
- `seomonitor_get_top_keywords`
- `seomonitor_find_keywords`
- `seomonitor_get_top_ai_search_keywords`
- `seomonitor_get_campaign_widgets`
- `seomonitor_get_ai_search_engine_performance`
- `seomonitor_get_top_cited_landing_pages`

> Two write tools (`seomonitor_generate_articles`, `seomonitor_add_keywords`) exist in the codebase but are **disabled by default** (`MCP_ENABLE_WRITE_TOOLS`). The public hosted server does not expose them.

---

## 🔐 Authentication & Privacy

- **API key** — passed as a Bearer token or in the connector URL. The key is the API token from your SEOmonitor profile; regenerating it there invalidates the old one.
- The hosted server is **stateless**: it forwards each request to the SEOmonitor API with your key and does not store your data.
- **Privacy policy:** [SEOmonitor Privacy Policy](https://help.seomonitor.com/en/articles/2285725-seomonitor-privacy-policy)
- Support: [GitHub Issues](https://github.com/BuntStudio/seomonitor-mcp-server/issues) or support@seomonitor.com

---

## 📊 Example prompts

- *"Which of my campaigns lost the most visibility this month, and which keyword groups drove it?"*
- *"How often is my brand mentioned in AI Overviews for my tracked keywords vs. my main competitor?"*
- *"Find keyword opportunities around 'crm software' in the US with high search volume where I rank below position 10."*
- *"Show my daily ranks for the 'pricing' keyword group over the last 30 days, desktop vs mobile."*
- *"What does my current forecast scenario say about traffic by December?"*

---

## 🏗️ Development

```bash
npm run dev     # Dev with auto-reload
npm run build   # Build TypeScript
npm start       # Start built server (stdio)
node dist/index.js --transport http --port 3000   # Streamable HTTP
```

### Project structure
```
src/
 ├── index.ts              # CLI entry
 ├── server.ts             # MCP server
 ├── rate-limiter.ts       # Per-key token bucket (http transport)
 ├── clients/seomonitor-client.ts
 ├── transports/           # stdio + Streamable HTTP
 └── mcp-tools/            # Tool implementations (auto-discovered)
```

### Adding tools
1. Define the schema (with `title` + `annotations`) in a `*-tools.ts` file
2. Implement the execution method
3. Export — tools are auto-discovered

---

## 🔧 Troubleshooting

- **Client doesn't load tools**: check the URL/API key; for stdio, rebuild `dist/` and restart the client.
- **401 errors**: the API key is missing or was regenerated — copy the current one from your profile.
- **429 errors**: you're over 60 requests/minute for your key; back off per the `Retry-After` header.
- **Debug logging**: `npm start -- --log-level debug`

---

## 📚 Resources

- [Hosted server & setup guide](https://mcp.seomonitor.com)
- [SEOmonitor API docs](https://api-docs.seomonitor.com)
- [MCP specification](https://modelcontextprotocol.io)
- [GitHub Issues](https://github.com/BuntStudio/seomonitor-mcp-server/issues)
