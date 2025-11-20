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
  private isLoggingEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // Allow enabling logs in production via NEXT_PUBLIC_ENABLE_LOGGING environment variable
    // This is useful for debugging in deployed environments
    this.isLoggingEnabled = 
      this.isDevelopment || 
      process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true';
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
    
    // Always log errors, conditionally log others based on environment or config
    if (level === 'error' || this.isLoggingEnabled) {
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
   * Log debug messages (enabled in development or when NEXT_PUBLIC_ENABLE_LOGGING is set)
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

// Export a singleton instance
export const logger = new Logger();

