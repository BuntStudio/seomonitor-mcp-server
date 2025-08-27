#!/usr/bin/env node

// CLI wrapper for the SEOMonitor MCP Server
// This script just imports and runs the main application

import('../dist/index.js').then(module => {
  // The main module will handle everything
}).catch(error => {
  console.error('Failed to start SEOMonitor MCP Server:', error.message);
  process.exit(1);
});