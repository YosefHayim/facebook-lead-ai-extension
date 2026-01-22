type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogCategory = 
  | 'api'
  | 'selector'
  | 'storage'
  | 'ai'
  | 'scan'
  | 'auth'
  | 'extension'
  | 'ui'
  | 'general';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  stack?: string;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  enabledCategories: LogCategory[] | 'all';
  persistLogs: boolean;
  maxStoredLogs: number;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  api: '#10b981',
  selector: '#f59e0b',
  storage: '#6366f1',
  ai: '#8b5cf6',
  scan: '#06b6d4',
  auth: '#ec4899',
  extension: '#3b82f6',
  ui: '#84cc16',
  general: '#6b7280',
};

const CATEGORY_ICONS: Record<LogCategory, string> = {
  api: '🌐',
  selector: '🔍',
  storage: '💾',
  ai: '🤖',
  scan: '📡',
  auth: '🔐',
  extension: '🧩',
  ui: '🎨',
  general: '📝',
};

class Logger {
  private config: LoggerConfig = {
    enabled: import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true',
    minLevel: 'debug',
    enabledCategories: 'all',
    persistLogs: true,
    maxStoredLogs: 500,
  };

  private logs: LogEntry[] = [];
  private storageKey = 'leadscout:logs';

  constructor() {
    this.loadStoredLogs();
  }

  get api() { return this.createCategoryLogger('api'); }
  get selector() { return this.createCategoryLogger('selector'); }
  get storage() { return this.createCategoryLogger('storage'); }
  get ai() { return this.createCategoryLogger('ai'); }
  get scan() { return this.createCategoryLogger('scan'); }
  get auth() { return this.createCategoryLogger('auth'); }
  get extension() { return this.createCategoryLogger('extension'); }
  get ui() { return this.createCategoryLogger('ui'); }
  get general() { return this.createCategoryLogger('general'); }

  private createCategoryLogger(category: LogCategory) {
    return {
      debug: (message: string, data?: unknown) => this.log('debug', category, message, data),
      info: (message: string, data?: unknown) => this.log('info', category, message, data),
      warn: (message: string, data?: unknown) => this.log('warn', category, message, data),
      error: (message: string, data?: unknown) => this.log('error', category, message, data),
    };
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: unknown) {
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: this.sanitizeData(data),
      stack: level === 'error' ? new Error().stack : undefined,
    };

    this.printToConsole(entry);
    this.storeLog(entry);
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!this.config.enabled) return false;
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) return false;
    if (this.config.enabledCategories !== 'all' && 
        !this.config.enabledCategories.includes(category)) return false;
    return true;
  }

  private sanitizeData(data: unknown): unknown {
    if (data === undefined) return undefined;
    
    try {
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'string' && value.length > 1000) {
          return value.substring(0, 1000) + '... [truncated]';
        }
        if (value instanceof HTMLElement) {
          return `[HTMLElement: ${value.tagName}${value.id ? '#' + value.id : ''}${value.className ? '.' + value.className.split(' ')[0] : ''}]`;
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      }));
    } catch {
      return '[Unserializable data]';
    }
  }

  private printToConsole(entry: LogEntry) {
    const icon = CATEGORY_ICONS[entry.category];
    const color = CATEGORY_COLORS[entry.category];
    const time = entry.timestamp.split('T')[1].split('.')[0];
    
    const prefix = `%c${icon} [${time}] [${entry.category.toUpperCase()}]`;
    const style = `color: ${color}; font-weight: bold;`;
    
    const consoleMethod = entry.level === 'error' ? console.error :
                          entry.level === 'warn' ? console.warn :
                          entry.level === 'debug' ? console.debug :
                          console.log;

    if (entry.data !== undefined) {
      consoleMethod(prefix, style, entry.message, entry.data);
    } else {
      consoleMethod(prefix, style, entry.message);
    }

    if (entry.stack && entry.level === 'error') {
      console.debug('%cStack trace:', 'color: #666; font-size: 10px;', entry.stack);
    }
  }

  private storeLog(entry: LogEntry) {
    if (!this.config.persistLogs) return;

    this.logs.push(entry);
    
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs = this.logs.slice(-this.config.maxStoredLogs);
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch {
      this.logs = this.logs.slice(-100);
    }
  }

  private loadStoredLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logs.filter(l => l.category === category);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(l => l.level === level);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrors(): LogEntry[] {
    return this.logs.filter(l => l.level === 'error');
  }

  searchLogs(query: string): LogEntry[] {
    const q = query.toLowerCase();
    return this.logs.filter(l => 
      l.message.toLowerCase().includes(q) ||
      JSON.stringify(l.data).toLowerCase().includes(q)
    );
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
    }
    this.general.info('Logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs() {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadscout-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  printSummary() {
    const summary = {
      total: this.logs.length,
      byLevel: {
        debug: this.logs.filter(l => l.level === 'debug').length,
        info: this.logs.filter(l => l.level === 'info').length,
        warn: this.logs.filter(l => l.level === 'warn').length,
        error: this.logs.filter(l => l.level === 'error').length,
      },
      byCategory: {} as Record<string, number>,
    };

    for (const category of Object.keys(CATEGORY_ICONS) as LogCategory[]) {
      summary.byCategory[category] = this.logs.filter(l => l.category === category).length;
    }

    console.log('%c📊 LeadScout Log Summary', 'font-size: 14px; font-weight: bold; color: #3b82f6;');
    console.table(summary.byLevel);
    console.table(summary.byCategory);
  }

  configure(options: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...options };
    this.general.info('Logger configured', options);
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
  }

  setMinLevel(level: LogLevel) {
    this.config.minLevel = level;
  }

  setCategories(categories: LogCategory[] | 'all') {
    this.config.enabledCategories = categories;
  }

  logApiRequest(provider: 'gemini' | 'openai', endpoint: string, payload: unknown) {
    this.api.info(`[${provider.toUpperCase()}] Request: ${endpoint}`, {
      provider,
      endpoint,
      payload: this.truncatePayload(payload),
    });
  }

  logApiResponse(provider: 'gemini' | 'openai', endpoint: string, response: unknown, durationMs: number) {
    this.api.info(`[${provider.toUpperCase()}] Response: ${endpoint} (${durationMs}ms)`, {
      provider,
      endpoint,
      durationMs,
      response: this.truncatePayload(response),
    });
  }

  logApiError(provider: 'gemini' | 'openai', endpoint: string, error: unknown) {
    this.api.error(`[${provider.toUpperCase()}] Error: ${endpoint}`, {
      provider,
      endpoint,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
  }

  logSelector(action: 'found' | 'not_found' | 'multiple', selector: string, count?: number) {
    const level = action === 'not_found' ? 'warn' : 'debug';
    this.selector[level](`Selector ${action}: ${selector}`, { selector, count });
  }

  logScan(phase: 'start' | 'complete' | 'error', data: unknown) {
    const level = phase === 'error' ? 'error' : 'info';
    this.scan[level](`Scan ${phase}`, data);
  }

  logAiAnalysis(action: string, input: unknown, output: unknown, durationMs?: number) {
    this.ai.info(`AI ${action}`, { input: this.truncatePayload(input), output, durationMs });
  }

  private truncatePayload(payload: unknown): unknown {
    const str = JSON.stringify(payload);
    if (str && str.length > 500) {
      return JSON.parse(str.substring(0, 500) + '..."');
    }
    return payload;
  }
}

export const logger = new Logger();

if (typeof window !== 'undefined') {
  (window as unknown as { __leadscout_logger: Logger }).__leadscout_logger = logger;
}

export type { LogLevel, LogCategory, LogEntry, LoggerConfig };
