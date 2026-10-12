type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

const MAX_QUEUE_SIZE = 50;
const logQueue: LogEntry[] = [];

function enqueue(level: LogLevel, message: string, data?: unknown) {
  logQueue.push({
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  });
  if (logQueue.length >= MAX_QUEUE_SIZE) flush();
}

function flush() {
  const entries = logQueue.splice(0, logQueue.length);
  if (!__DEV__) return;
  for (const entry of entries) {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    if (entry.level === 'error') {
      console.error(prefix, entry.message, entry.data ?? '');
    } else if (entry.level === 'warn') {
      console.warn(prefix, entry.message, entry.data ?? '');
    } else {
      console.log(prefix, entry.message, entry.data ?? '');
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => flush(), 5000);
}

export const logger = {
  debug: (msg: string, data?: unknown) => enqueue('debug', msg, data),
  info: (msg: string, data?: unknown) => enqueue('info', msg, data),
  warn: (msg: string, data?: unknown) => enqueue('warn', msg, data),
  error: (msg: string, data?: unknown) => enqueue('error', msg, data),
};
