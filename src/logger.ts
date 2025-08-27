import fs from 'fs';
import path from 'path';

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

  constructor(logFile?: string, logLevel: LogLevel = 'info') {
    this.logFile = logFile || path.join(process.cwd(), 'mcp-server.log');
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? '\n' + JSON.stringify(data, null, 2) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('debug')) return;
    
    const formatted = this.formatMessage('debug', message, data);
    if (!this.isStdioMode()) {
      console.debug(formatted);
    }
    this.writeToFile(formatted);
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('info')) return;
    
    const formatted = this.formatMessage('info', message, data);
    if (!this.isStdioMode()) {
      console.info(formatted);
    }
    this.writeToFile(formatted);
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('warn')) return;
    
    const formatted = this.formatMessage('warn', message, data);
    if (!this.isStdioMode()) {
      console.warn(formatted);
    }
    this.writeToFile(formatted);
  }

  error(message: string, error?: any) {
    if (!this.shouldLog('error')) return;
    
    const formatted = this.formatMessage('error', message, error);
    if (!this.isStdioMode()) {
      console.error(formatted);
    }
    this.writeToFile(formatted);
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