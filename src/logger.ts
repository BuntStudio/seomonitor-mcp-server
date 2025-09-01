import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables immediately
config({ quiet: true });

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logFile: string;
  private logLevel: LogLevel;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(logFile?: string, logLevel?: LogLevel) {
    const logPath = process.env.LOG_PATH || path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
    this.logFile = logFile || path.join(logPath, 'mcp-server.log');
    this.logLevel = logLevel || (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private logMessage(level: LogLevel, message: string, data?: any) {
    if (this.levels[level] < this.levels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logData = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`;

    // Always log to console
    console.log(logEntry);

    // In stdio mode, we don't write to files to avoid mixing with transport messages
    if (!this.isStdioMode()) {
      this.writeToFile(logEntry);
    }
  }

  debug(message: string, data?: any) {
    this.logMessage('debug', message, data);
  }

  info(message: string, data?: any) {
    this.logMessage('info', message, data);
  }

  warn(message: string, data?: any) {
    this.logMessage('warn', message, data);
  }

  error(message: string, data?: any) {
    this.logMessage('error', message, data);
  }

  // Legacy method for backward compatibility
  log(message: string, data?: any) {
    this.info(message, data);
  }

  private writeToFile(message: string) {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (err) {
      // Silently fail for file writing to avoid interfering with STDIO
    }
  }

  // Check if we're in STDIO mode by looking at command line args or env
  private isStdioMode(): boolean {
    return process.argv.includes('--transport') && process.argv.includes('stdio') ||
           !process.argv.includes('--transport') && process.env.TRANSPORT !== 'http' && process.env.TRANSPORT !== 'websocket';
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  clearLog() {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
      }
    } catch (err) {
      console.error('Failed to clear log file:', err);
    }
  }
}

// Default logger instance
export const logger = new Logger();