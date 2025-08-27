/**
 * MCP Tools Index - True Runtime Dynamic Loading
 * Scans directory and loads tool classes at runtime - no hardcoding!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded classes and tools
let toolClasses: Map<string, any> = new Map();
let toolRegistry: Map<string, any> = new Map();
let initialized = false;

/**
 * Initialize tools by scanning directory and loading classes
 */
async function initializeTools(): Promise<void> {
  if (initialized) return;
  
  // Only log to console if not in STDIO mode
  const isStdio = process.argv.includes('stdio') || (!process.argv.includes('--transport') && process.env.TRANSPORT !== 'http' && process.env.TRANSPORT !== 'websocket');
  if (!isStdio) console.log('🔍 Initializing MCP tools dynamically...');
  
  try {
    // Find all tool files in current directory
    const toolFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('-tools.js')) // Only actual tool files
      .sort();
    
    
    // Load each tool file
    for (const file of toolFiles) {
      try {
        const module = await import(`./${file}`);
        
        // Find exported classes ending with "Tools"
        for (const [exportName, exportClass] of Object.entries(module)) {
          if (exportName.endsWith('Tools') && typeof exportClass === 'function') {
            toolClasses.set(exportName, exportClass);
            
            // Get tool definitions from this class
            const toolClass = exportClass as any;
            
            // Try different ways to get definitions
            let definitions: any[] = [];
            if (toolClass.getAllDefinitions) {
              definitions = toolClass.getAllDefinitions();
            } else if (toolClass.getDefinition) {
              definitions = [toolClass.getDefinition()];
            }
            
            // Register each tool
            for (const def of definitions) {
              if (def && def.name) {
                toolRegistry.set(def.name, toolClass);
              }
            }
          }
        }
      } catch (error) {
      }
    }
    
    initialized = true;
    
  } catch (error) {
  }
}

/**
 * Get all tool definitions
 */
export async function getAllToolDefinitions(): Promise<any[]> {
  await initializeTools();
  
  const definitions: any[] = [];
  
  for (const [className, toolClass] of toolClasses.entries()) {
    try {
      if (toolClass.getAllDefinitions) {
        definitions.push(...toolClass.getAllDefinitions());
      } else if (toolClass.getDefinition) {
        definitions.push(toolClass.getDefinition());
      }
    } catch (error) {
      // Silently skip failed definitions in STDIO mode
      const isStdio = process.argv.includes('stdio') || (!process.argv.includes('--transport') && process.env.TRANSPORT !== 'http' && process.env.TRANSPORT !== 'websocket');
    }
  }
  
  const isStdio = process.argv.includes('stdio') || (!process.argv.includes('--transport') && process.env.TRANSPORT !== 'http' && process.env.TRANSPORT !== 'websocket');
  return definitions;
}

/**
 * Execute a tool by name
 */
export async function executeToolByName(toolName: string, args: any, seoClient: any): Promise<any> {
  await initializeTools();
  
  const isStdio = process.argv.includes('stdio') || (!process.argv.includes('--transport') && process.env.TRANSPORT !== 'http' && process.env.TRANSPORT !== 'websocket');
  
  const ToolClass = toolRegistry.get(toolName);
  
  if (!ToolClass) {
    const available = Array.from(toolRegistry.keys()).sort();
    throw new Error(`Unknown tool: ${toolName}. Available: ${available.join(', ')}`);
  }
  
  
  try {
    // Check if it's a single-tool class or multi-tool class
    const hasExecuteWithToolName = ToolClass.name !== 'CampaignTools'; // CampaignTools is single-tool
    
    if (hasExecuteWithToolName) {
      return await ToolClass.execute(toolName, args, seoClient);
    } else {
      return await ToolClass.execute(args, seoClient);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get all available tool names
 */
export async function getAllToolNames(): Promise<string[]> {
  await initializeTools();
  return Array.from(toolRegistry.keys()).sort();
}

// Module loaded - tools will initialize dynamically on first use