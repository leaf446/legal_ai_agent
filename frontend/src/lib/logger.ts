/**
 * Logger Utility
 * Centralized logging with environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const isDevelopment = process.env.NODE_ENV === 'development';

function formatLogEntry(entry: LogEntry): string {
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!isDevelopment) return;
    const entry = createLogEntry('debug', message, context);
    console.debug(formatLogEntry(entry));
  },

  info(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('info', message, context);
    console.info(formatLogEntry(entry));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLogEntry(entry));
  },

  error(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('error', message, context);
    console.error(formatLogEntry(entry));
  },
};

export default logger;
