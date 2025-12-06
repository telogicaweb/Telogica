export enum LogEventType {
  LOG_CREATED = 'LOG_CREATED',
  LOG_UPDATED = 'LOG_UPDATED',
  LOG_DELETED = 'LOG_DELETED',
  BULK_OPERATION = 'BULK_OPERATION',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH',
}

export enum LogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  ALERT = 'ALERT',
  EMERGENCY = 'EMERGENCY',
}

export enum ActionCategory {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  INTEGRATION = 'INTEGRATION',
  NOTIFICATION = 'NOTIFICATION',
  BATCH = 'BATCH',
  WORKFLOW = 'WORKFLOW',
  AUDIT = 'AUDIT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  CONFIG = 'CONFIG',
  PERMISSION = 'PERMISSION',
}

export interface Log {
  _id: string;
  id?: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  actionCategory: ActionCategory;
  entity: string;
  entityId: string;
  severity: LogSeverity;
  message: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  responseTime?: number;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  tags: string[];
  changes?: {
    before: any;
    after: any;
  };
  metadata?: Record<string, any>;
  correlationId?: string;
  sessionId?: string;
  version?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogStats {
  totalLogs: number;
  todayCount: number;
  yesterdayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  errorCount: number;
  warningCount: number;
  activeAdmins: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  apiCalls: number;
  dataChanges: number;
  hourly: Array<{
    hour: string;
    count: number;
    errors: number;
    warnings: number;
    avgResponseTime: number;
  }>;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
  bySeverity: Record<LogSeverity, number>;
  byAdmin: Array<{
    adminId: string;
    adminName: string;
    count: number;
    lastActivity: string;
  }>;
  topIPs: Array<{
    ip: string;
    count: number;
    lastSeen: string;
  }>;
}

export interface LogFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  adminRole?: string;
  action?: string;
  actionCategory?: ActionCategory;
  entity?: string;
  entityId?: string;
  severity?: LogSeverity | LogSeverity[];
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number | string;
  minDuration?: number;
  maxDuration?: number;
  tags?: string[];
  hasError?: boolean;
  hasWarnings?: boolean;
  hasChanges?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  forceRefresh?: boolean;
}

export interface ExportOptions extends LogFilter {
  format: 'csv' | 'excel' | 'pdf' | 'json' | 'xml';
  fields?: string[];
  onProgress?: (progressEvent: any) => void;
}

export interface BulkLogOperation {
  operation: 'delete' | 'archive' | 'update' | 'export';
  ids?: string[];
  criteria?: Partial<LogFilter>;
  updates?: Partial<Log>;
  exportOptions?: ExportOptions;
}

export interface LogSearchResult {
  results: Log[];
  total: number;
  page: number;
  totalPages: number;
  took: number;
  highlights?: Record<string, string[]>;
  suggestions?: string[];
}

export interface RealTimeLog extends Omit<Log, 'id'> {
  id?: string;
  eventId: string;
  receivedAt: string;
}

export interface LogAnalysis {
  patterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
    examples: Log[];
  }>;
  anomalies: Array<{
    log: Log;
    anomalyScore: number;
    reason: string;
    recommendations: string[];
  }>;
  trends: Array<{
    metric: string;
    values: Array<{ timestamp: string; value: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    rate: number;
  }>;
  correlations: Array<{
    metricA: string;
    metricB: string;
    correlation: number;
    significance: number;
  }>;
}

export interface AuditTrail {
  id: string;
  entityType: string;
  entityId: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: string;
    changedBy: string;
  }>;
  timeline: Log[];
}

export interface LogAlert {
  id: string;
  name: string;
  description: string;
  criteria: Partial<LogFilter>;
  threshold: number;
  timeWindow: number; // minutes
  channels: Array<'email' | 'sms' | 'slack' | 'webhook'>;
  recipients: string[];
  enabled: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}
