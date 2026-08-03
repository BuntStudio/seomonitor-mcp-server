# SEOmonitor extension

This extension connects to the hosted SEOmonitor MCP server (`mcp.seomonitor.com`) and exposes 50 read-only tools over the user's SEOmonitor account: rank tracking, AI Overview and AI search visibility, keyword research, organic traffic, and forecasts.

## Setup

Nothing to configure. On first use Gemini CLI opens SEOmonitor's sign-in in the browser; the user logs in and approves read access, and the connection persists from then on.

If tool calls fail with 401, the sign-in expired or was revoked from SEOmonitor Account → Edit profile → Connected apps — ask the user to run `/mcp auth seomonitor` to sign in again.

## Usage notes

- Start with `seomonitor_get_tracked_campaigns` to discover campaign IDs; most tools require a `campaign_id`.
- Dates are `YYYY-MM-DD`. Keep ranges tight (30–90 days) — large ranges return a lot of data.
- Rate limit is 60 requests/minute; on HTTP 429, wait for the `Retry-After` interval before retrying.
- All tools are read-only; nothing in this extension modifies the user's account.
