/**
 * Frontend Logger Utility
 * Simple logging for browser environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
  }

  private formatTime(): string {
    return new Date().toISOString();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level,
      message,
      data,
    };

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        if (this.isDev) {
          console.debug(prefix, message, data);
        }
        break;
      case 'info':
        console.info(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
