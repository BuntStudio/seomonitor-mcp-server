import fs from 'fs';
import path from 'path';
import os from 'os';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logLevel: LogLevel;
  private logFile: string;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(logLevel?: LogLevel) {
    this.logLevel = logLevel || (process.env.LOG_LEVEL as LogLevel) || 'info';
    
    // Set up log file path
    const logDir = process.env.LOG_DIR || os.tmpdir();
    const logFileName = process.env.LOG_FILE || 'seomonitor-mcp.log';
    this.logFile = path.join(logDir, logFileName);
    
    // Ensure log directory exists
    try {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    } catch (error) {
      // If we can't create log directory, fall back to temp dir
      this.logFile = path.join(os.tmpdir(), 'seomonitor-mcp.log');
    }
    
    // Initialize log file with session start
    this.writeToFile(`\n${'='.repeat(60)}\n[${new Date().toISOString()}] NEW MCP SERVER SESSION STARTED\n${'='.repeat(60)}\n`);
  }

  private writeToFile(logEntry: string) {
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      // Fallback to stderr if file writing fails
      process.stderr.write(`[LOG FILE ERROR] ${error}\n${logEntry}`);
    }
  }

  private logMessage(level: LogLevel, message: string, data?: any) {
    if (this.levels[level] < this.levels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logData = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${logData}\n`;

    // Write to log file
    this.writeToFile(logEntry);
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

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  getLogFile(): string {
    return this.logFile;
  }

  // Method to manually rotate logs (simple implementation)
  rotateLogs() {
    try {
      const stats = fs.statSync(this.logFile);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        const rotatedFile = `${this.logFile}.${Date.now()}`;
        fs.renameSync(this.logFile, rotatedFile);
        this.writeToFile(`\n${'='.repeat(60)}\n[${new Date().toISOString()}] LOG ROTATED - NEW SESSION\n${'='.repeat(60)}\n`);
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }
}

// Default logger instance
export const logger = new Logger();