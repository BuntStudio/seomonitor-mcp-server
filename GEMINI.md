# SEOmonitor extension

This extension connects to the hosted SEOmonitor MCP server (`mcp.seomonitor.com`) and exposes 49 read-only tools over the user's SEOmonitor account: rank tracking, AI Overview and AI search visibility, keyword research, organic traffic, and forecasts.

## Setup

The user must export their SEOmonitor API key before starting Gemini CLI:

```bash
export SEOMONITOR_API_KEY="<key from SEOmonitor Account → Edit profile → API key>"
```

If tool calls fail with 401, the key is missing or was regenerated in the SEOmonitor app — ask the user to re-export the current key.

## Usage notes

- Start with `seomonitor_get_tracked_campaigns` to discover campaign IDs; most tools require a `campaign_id`.
- Dates are `YYYY-MM-DD`. Keep ranges tight (30–90 days) — large ranges return a lot of data.
- Rate limit is 60 requests/minute per API key; on HTTP 429, wait for the `Retry-After` interval before retrying.
- All tools are read-only; nothing in this extension modifies the user's account.
