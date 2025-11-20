/**
 * Logger utility for frontend application
 * Provides structured logging with different log levels
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const logEntry = this.formatMessage(level, message, data);
    
    // Always log errors, conditionally log others based on environment
    if (level === 'error' || this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn :
                           level === 'debug' ? console.debug : 
                           console.log;
      
      consoleMethod(`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log error messages
   */
  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

// Export a singleton instance
export const logger = new Logger();

