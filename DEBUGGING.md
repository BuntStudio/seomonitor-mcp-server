# Debugging Claude Desktop MCP Interactions

This guide shows how to capture and analyze detailed logs of how Claude Desktop interacts with the SEOMonitor MCP server. **All logging is now written to files instead of stderr** for better debugging experience.

## 📁 Log File Locations

### Default Log Files
- **Default location**: `/tmp/seomonitor-mcp.log` (system temp directory)
- **Custom location**: Set via `LOG_DIR` and `LOG_FILE` environment variables

### Recommended Setup
We recommend using a dedicated log directory for easier access:

```json
{
  "env": {
    "LOG_DIR": "/tmp/seomonitor-mcp-logs",
    "LOG_FILE": "claude-desktop.log"
  }
}
```

This creates logs at: `/tmp/seomonitor-mcp-logs/claude-desktop.log`

## Quick Setup for Enhanced Logging

### 1. Claude Desktop Configuration (Development)

Use this configuration in your Claude Desktop settings to enable detailed file logging:

```json
{
  "mcpServers": {
    "seomonitor-dev": {
      "command": "npx",
      "args": [".", "--log-level", "debug"],
      "cwd": "/absolute/path/to/seomonitor-mcp-server",
      "env": {
        "SEOMONITOR_API_KEY": "your-jwt-token-here",
        "LOG_LEVEL": "debug",
        "LOG_DIR": "/tmp/seomonitor-mcp-logs",
        "LOG_FILE": "claude-desktop-debug.log"
      }
    }
  }
}
```

### 2. Published Package Configuration

For the published npm package:

```json
{
  "mcpServers": {
    "seomonitor": {
      "command": "npx", 
      "args": ["seomonitor-mcp-server", "--log-level", "info"],
      "env": {
        "SEOMONITOR_API_KEY": "your-jwt-token-here",
        "LOG_LEVEL": "info",
        "LOG_DIR": "/tmp/seomonitor-mcp-logs",
        "LOG_FILE": "claude-desktop.log"
      }
    }
  }
}
```

## What Gets Logged

### 🚀 Server Startup
```
[2025-09-01T16:39:07.812Z] [INFO] 🚀 Starting MCP Server with STDIO transport
[2025-09-01T16:39:07.812Z] [INFO] 📡 Claude Desktop MCP Protocol Logging Enabled
[2025-09-01T16:39:07.812Z] [INFO] ✅ MCP Server connected and ready for Claude Desktop
```

### 🔧 Tool Discovery (When Claude Desktop starts)
```
[2025-09-01T16:39:07.812Z] [INFO] 🔧 MCP ListTools Request received
{
  "method": "tools/list",
  "params": {}
}
[2025-09-01T16:39:07.813Z] [INFO] ✅ Loaded 27 SEOMonitor tools:
{
  "toolNames": [
    "get_tracked_campaigns",
    "get_keyword_data", 
    "get_daily_keyword_ranks",
    ...
  ]
}
```

### 🚀 Tool Execution (When you use a tool)
```
[2025-09-01T16:39:20.155Z] [INFO] 🚀 MCP Tool Call Request:
{
  "toolName": "get_tracked_campaigns",
  "arguments": {},
  "method": "tools/call"
}
[2025-09-01T16:39:20.689Z] [INFO] ✅ Tool get_tracked_campaigns completed successfully
{
  "duration": "534ms",
  "resultType": "text", 
  "resultSize": 6451
}
```

### ❌ Error Logging (If something goes wrong)
```
[2025-09-01T16:39:30.123Z] [ERROR] ❌ Tool get_tracked_campaigns execution failed
{
  "duration": "1234ms",
  "errorMessage": "Request failed with status code 401",
  "httpStatus": 401,
  "httpData": {
    "error": "Invalid API key"
  }
}
```

## 📖 How to View Logs

### Method 1: Real-time Monitoring (Recommended)

Monitor the logs in real-time as Claude Desktop interacts with your MCP server:

```bash
# Watch the default log file
tail -f /tmp/seomonitor-mcp.log

# Watch a custom log file
tail -f /tmp/seomonitor-mcp-logs/claude-desktop.log

# Watch with line numbers
tail -n 50 -f /tmp/seomonitor-mcp-logs/claude-desktop-debug.log
```

### Method 2: Session-based Log Files

Each time the MCP server starts, it creates a clear session separator:

```
============================================================
[2025-09-01T16:43:44.183Z] NEW MCP SERVER SESSION STARTED
============================================================
```

This makes it easy to find the start of each Claude Desktop session.

### Method 3: Log File Management

```bash
# View recent logs
cat /tmp/seomonitor-mcp-logs/claude-desktop.log

# Search for specific tool calls
grep "Tool Call Request" /tmp/seomonitor-mcp-logs/claude-desktop.log

# Search for errors
grep "ERROR" /tmp/seomonitor-mcp-logs/claude-desktop.log

# View last N lines
tail -n 100 /tmp/seomonitor-mcp-logs/claude-desktop.log
```

### Method 4: Multiple Terminal Setup

For active debugging, use a split-terminal setup:

```bash
# Terminal 1: Monitor logs
tail -f /tmp/seomonitor-mcp-logs/claude-desktop-debug.log

# Terminal 2: Use Claude Desktop
# Make your requests and see real-time logging in Terminal 1
```

## Debugging Common Issues

### Issue: "Could not attach to MCP server"

**Check for:**
```
[ERROR] 🔥 MCP Server Error
{
  "error": "Server startup failed",
  "name": "ConnectionError"
}
```

**Solutions:**
- Verify API key is correct
- Check file paths in configuration
- Ensure npx can access the package

### Issue: "Tool execution failed"

**Check for:**
```
[ERROR] ❌ Tool get_tracked_campaigns execution failed
{
  "httpStatus": 401,
  "errorMessage": "Invalid authentication"
}
```

**Solutions:**
- Verify SEOMONITOR_API_KEY is valid JWT token
- Check API key permissions
- Test API directly with curl

### Issue: "Unknown tool"

**Check for:**
```
[ERROR] ❌ Tool some_tool_name execution failed
{
  "errorMessage": "Unknown tool: some_tool_name. Available: get_tracked_campaigns, ..."
}
```

**Solutions:**
- Check tool name spelling
- Verify tool is in the available tools list
- Rebuild the project if developing locally

## Advanced Debugging

### Full Protocol Capture

To capture ALL MCP protocol messages, you can modify the server to log at the transport level. This is more advanced but useful for protocol-level debugging.

### API Response Inspection

The logs include API response details:

```
[DEBUG] SEOMonitor API Response
{
  "user": "default", 
  "status": 200,
  "responseSize": 6451
}
```

### Performance Monitoring

Track tool execution times:

```
[INFO] ✅ Tool get_tracked_campaigns completed successfully
{
  "duration": "534ms",
  "resultSize": 6451
}
```

## Log Levels

- `error`: Only errors and critical issues
- `warn`: Warnings and errors  
- `info`: General information, tool calls, completions
- `debug`: Detailed protocol messages, API calls, full responses

## Tips for Effective Debugging

1. **Start with `info` level** for general troubleshooting
2. **Use `debug` level** for detailed protocol analysis
3. **Check API responses** for authentication issues
4. **Monitor tool execution times** for performance issues
5. **Verify tool names** match exactly (case-sensitive)

## Example Debugging Session

```bash
# 1. Start with debug logging
SEOMONITOR_API_KEY="your-key" npx . --log-level debug

# 2. In Claude Desktop, try: "Show me my tracked campaigns"

# 3. Check logs for:
#    - Tool discovery (ListTools)
#    - Tool execution (CallTool) 
#    - API calls to SEOMonitor
#    - Response processing
#    - Any errors

# 4. If errors, check:
#    - HTTP status codes
#    - Error messages
#    - API response data
```

This enhanced logging will help you understand exactly how Claude Desktop is interacting with your MCP server and troubleshoot any issues that arise.