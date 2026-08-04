import { env } from '../config/env.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export class Logger {
  private minSeverity: number;

  constructor(private defaultContext: string = 'System') {
    const configuredLevel = env.LOG_LEVEL as LogLevel;
    this.minSeverity = LOG_LEVEL_SEVERITY[configuredLevel] ?? 20;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_SEVERITY[level] >= this.minSeverity;
  }

  private formatEntry(level: LogLevel, message: string, context?: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || this.defaultContext,
      ...(metadata ? { metadata } : {}),
    };
  }

  private emit(entry: LogEntry): void {
    const color = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    }[entry.level];
    const reset = '\x1b[0m';

    const logLine = `[${entry.timestamp}] [${entry.level}] [${entry.context}]: ${entry.message}`;

    if (entry.level === 'ERROR') {
      console.error(`${color}${logLine}${reset}`, entry.metadata ? entry.metadata : '');
    } else if (entry.level === 'WARN') {
      console.warn(`${color}${logLine}${reset}`, entry.metadata ? entry.metadata : '');
    } else {
      console.log(`${color}${logLine}${reset}`, entry.metadata ? entry.metadata : '');
    }
  }

  public debug(message: string, metadata?: Record<string, unknown>, context?: string): void {
    if (this.shouldLog('DEBUG')) {
      this.emit(this.formatEntry('DEBUG', message, context, metadata));
    }
  }

  public info(message: string, metadata?: Record<string, unknown>, context?: string): void {
    if (this.shouldLog('INFO')) {
      this.emit(this.formatEntry('INFO', message, context, metadata));
    }
  }

  public warn(message: string, metadata?: Record<string, unknown>, context?: string): void {
    if (this.shouldLog('WARN')) {
      this.emit(this.formatEntry('WARN', message, context, metadata));
    }
  }

  public error(message: string, metadata?: Record<string, unknown>, context?: string): void {
    if (this.shouldLog('ERROR')) {
      this.emit(this.formatEntry('ERROR', message, context, metadata));
    }
  }
}

export const logger = new Logger('AtlasMain');
