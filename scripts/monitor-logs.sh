#!/bin/bash

# SEOMonitor MCP Server Log Monitor
# Usage: ./scripts/monitor-logs.sh [log-file-path]

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default log file locations to try
DEFAULT_LOGS=(
    "/tmp/seomonitor-mcp-logs/claude-desktop-debug.log"
    "/tmp/seomonitor-mcp-logs/claude-desktop.log"
    "/tmp/seomonitor-mcp.log"
)

# Function to find log file
find_log_file() {
    # If log file provided as argument
    if [ "$1" ]; then
        if [ -f "$1" ]; then
            echo "$1"
            return 0
        else
            echo "Error: Log file '$1' not found" >&2
            return 1
        fi
    fi
    
    # Try default locations
    for log_file in "${DEFAULT_LOGS[@]}"; do
        if [ -f "$log_file" ]; then
            echo "$log_file"
            return 0
        fi
    done
    
    echo "Error: No SEOMonitor MCP log file found in default locations" >&2
    echo "Tried:" >&2
    for log_file in "${DEFAULT_LOGS[@]}"; do
        echo "  - $log_file" >&2
    done
    echo "" >&2
    echo "Usage: $0 [path-to-log-file]" >&2
    return 1
}

# Function to colorize log output
colorize_logs() {
    while IFS= read -r line; do
        case "$line" in
            *"[ERROR]"*)
                echo -e "${RED}${line}${NC}"
                ;;
            *"[WARN]"*)
                echo -e "${YELLOW}${line}${NC}"
                ;;
            *"[INFO]"*)
                case "$line" in
                    *"🚀"*|*"✅"*|*"📡"*|*"📁"*)
                        echo -e "${GREEN}${line}${NC}"
                        ;;
                    *"MCP Tool Call Request"*)
                        echo -e "${CYAN}${line}${NC}"
                        ;;
                    *"MCP ListTools Request"*)
                        echo -e "${PURPLE}${line}${NC}"
                        ;;
                    *)
                        echo -e "${BLUE}${line}${NC}"
                        ;;
                esac
                ;;
            *"[DEBUG]"*)
                echo -e "${line}"
                ;;
            *"NEW MCP SERVER SESSION STARTED"*)
                echo -e "${GREEN}${line}${NC}"
                ;;
            *"============================================================"*)
                echo -e "${GREEN}${line}${NC}"
                ;;
            *)
                echo "$line"
                ;;
        esac
    done
}

# Main execution
LOG_FILE=$(find_log_file "$1")
if [ $? -ne 0 ]; then
    exit 1
fi

echo -e "${GREEN}🔍 Monitoring SEOMonitor MCP Server logs:${NC}"
echo -e "${CYAN}📁 Log file: ${LOG_FILE}${NC}"
echo -e "${YELLOW}💡 Tip: Use Ctrl+C to stop monitoring${NC}"
echo ""

# Check if file exists and has content
if [ ! -s "$LOG_FILE" ]; then
    echo -e "${YELLOW}⚠️  Log file is empty. Waiting for MCP server to start...${NC}"
fi

# Start monitoring with colorization
tail -n 20 -f "$LOG_FILE" | colorize_logs