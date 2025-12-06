import api from '../api';
import { io, Socket } from 'socket.io-client';
import {
  LogEventType,
  LogSeverity
} from '../types/logs.ts';
import type {
  Log,
  LogStats,
  LogFilter,
  ExportOptions,
  BulkLogOperation,
  LogSearchResult,
  RealTimeLog,
  LogAnalysis,
  AuditTrail,
  LogAlert
} from '../types/logs.ts';
// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 100,
  timeWindow: 60000, // 1 minute
};

// Cache configuration
const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
};


// Cache implementation
class LogCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, data: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests = new Map<string, number[]>();

  isLimited(key: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_CONFIG.timeWindow);
    
    if (recentRequests.length >= RATE_LIMIT_CONFIG.maxRequests) {
      return true;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return false;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Singleton instances
const cache = new LogCache(CACHE_CONFIG.maxSize, CACHE_CONFIG.ttl);
const rateLimiter = new RateLimiter();

// Main log service class
class LogService {
  private socket: Socket | null = null;
  private eventListeners = new Map<LogEventType, Function[]>();

  /**
   * Get logs with advanced filtering and pagination
   */
  async getLogs(params: LogFilter): Promise<{
    logs: Log[];
    total: number;
    page: number;
    totalPages: number;
    stats: Partial<LogStats>;
  }> {
    try {
      const cacheKey = `logs:${JSON.stringify(params)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && !params.forceRefresh) {
        return cached;
      }

      // Check rate limit
      if (rateLimiter.isLimited('getLogs')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      const response = await api.get('/api/logs/advanced', {
        params: this.sanitizeParams(params),
        headers: this.getAuthHeaders(),
      });

      const result = {
        logs: response.data.data,
        total: response.data.meta.total,
        page: response.data.meta.page,
        totalPages: response.data.meta.totalPages,
        stats: response.data.stats || {},
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search logs with full-text capabilities
   */
  async searchLogs(query: string, options?: {
    fields?: string[];
    highlight?: boolean;
    fuzzy?: boolean;
    page?: number;
    limit?: number;
  }): Promise<LogSearchResult> {
    try {
      const response = await api.get('/api/logs/search', {
        params: {
          q: query,
          ...options,
        },
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error searching logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get comprehensive log statistics
   */
  async getLogStats(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    metrics?: string[];
  }): Promise<LogStats> {
    try {
      const cacheKey = `stats:${JSON.stringify(params || {})}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await api.get('/api/logs/stats', {
        params,
        headers: this.getAuthHeaders(),
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching log stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Export logs in multiple formats
   */
  async exportLogs(options: ExportOptions): Promise<Blob> {
    try {
      const response = await api.get('/api/logs/export', {
        params: this.sanitizeParams(options),
        responseType: 'blob',
        headers: {
          ...this.getAuthHeaders(),
          'Accept': this.getAcceptHeader(options.format),
        },
        onDownloadProgress: options.onProgress,
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Perform bulk operations on logs
   */
  async bulkOperation(operation: BulkLogOperation): Promise<{
    success: boolean;
    affected: number;
    errors?: string[];
  }> {
    try {
      const response = await api.post('/api/logs/bulk', operation, {
        headers: this.getAuthHeaders(),
      });

      // Invalidate relevant cache entries
      this.invalidateCache();
      
      return response.data;
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Clear logs based on criteria
   */
  async clearLogs(criteria?: {
    olderThan?: string;
    severity?: LogSeverity[];
    entity?: string[];
    action?: string[];
  }): Promise<{ deleted: number }> {
    try {
      const response = await api.delete('/api/logs/clear', {
        params: criteria,
        headers: this.getAuthHeaders(),
      });

      // Invalidate cache
      this.invalidateCache();
      
      return response.data;
    } catch (error) {
      console.error('Error clearing logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new log entry
   */
  async createLog(log: Partial<Log>): Promise<Log> {
    try {
      const response = await api.post('/api/logs', log, {
        headers: this.getAuthHeaders(),
      });

      // Invalidate cache
      this.invalidateCache();
      
      return response.data;
    } catch (error) {
      console.error('Error creating log:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get log by ID with full details
   */
  async getLogById(id: string, options?: {
    includeChanges?: boolean;
    includeRelated?: boolean;
    includeMetadata?: boolean;
  }): Promise<Log> {
    try {
      const cacheKey = `log:${id}:${JSON.stringify(options || {})}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await api.get(`/api/logs/${id}`, {
        params: options,
        headers: this.getAuthHeaders(),
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching log by ID:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update log entry
   */
  async updateLog(id: string, updates: Partial<Log>): Promise<Log> {
    try {
      const response = await api.patch(`/api/logs/${id}`, updates, {
        headers: this.getAuthHeaders(),
      });

      // Invalidate cache for this log and list
      cache.delete(`log:${id}`);
      this.invalidateCache();
      
      return response.data;
    } catch (error) {
      console.error('Error updating log:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Archive logs (move to cold storage)
   */
  async archiveLogs(criteria: {
    olderThan: string;
    batchSize?: number;
  }): Promise<{ archived: number; batchId: string }> {
    try {
      const response = await api.post('/api/logs/archive', criteria, {
        headers: this.getAuthHeaders(),
      });

      this.invalidateCache();
      return response.data;
    } catch (error) {
      console.error('Error archiving logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Restore archived logs
   */
  async restoreLogs(batchId: string): Promise<{ restored: number }> {
    try {
      const response = await api.post(`/api/logs/archive/${batchId}/restore`, null, {
        headers: this.getAuthHeaders(),
      });

      this.invalidateCache();
      return response.data;
    } catch (error) {
      console.error('Error restoring logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get audit trail for specific entity
   */
  async getAuditTrail(entityType: string, entityId: string): Promise<AuditTrail[]> {
    try {
      const cacheKey = `audit:${entityType}:${entityId}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await api.get(`/api/logs/audit/${entityType}/${entityId}`, {
        headers: this.getAuthHeaders(),
      });

      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyze logs for patterns and anomalies
   */
  async analyzeLogs(params: {
    startDate: string;
    endDate: string;
    analysisType: 'patterns' | 'anomalies' | 'trends' | 'correlations';
    confidence?: number;
  }): Promise<LogAnalysis> {
    try {
      const response = await api.post('/api/logs/analyze', params, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error analyzing logs:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Set up real-time log monitoring
   */
  connectWebSocket(): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected for log monitoring');
      this.emitEvent(LogEventType.SYSTEM_HEALTH, { status: 'connected' });
    });

    this.socket.on('new_log', (log: any) => {
      this.handleWebSocketMessage({ type: 'log', log });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket.IO connection error:', error);
      this.emitEvent(LogEventType.SYSTEM_HEALTH, { status: 'error', error });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.emitEvent(LogEventType.SYSTEM_HEALTH, { status: 'disconnected' });
      // Socket.io handles reconnection automatically usually, but we can keep this if needed
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to real-time log events
   */
  subscribe(eventType: LogEventType, callback: Function): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Set up log alert
   */
  async setupAlert(alert: Partial<LogAlert>): Promise<LogAlert> {
    try {
      const response = await api.post('/api/logs/alerts', alert, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error setting up alert:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts(params?: {
    active?: boolean;
    severity?: LogSeverity[];
    page?: number;
    limit?: number;
  }): Promise<{
    alerts: LogAlert[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await api.get('/api/logs/alerts', {
        params,
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, notes?: string): Promise<LogAlert> {
    try {
      const response = await api.patch(`/api/logs/alerts/${alertId}/acknowledge`, 
        { notes },
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get system health based on logs
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const response = await api.get('/api/logs/health', {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate log report
   */
  async generateReport(params: {
    reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
    startDate: string;
    endDate: string;
    format: 'pdf' | 'html' | 'json';
    sections: string[];
  }): Promise<Blob> {
    try {
      const response = await api.post('/api/logs/reports', params, {
        responseType: 'blob',
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw this.handleError(error);
    }
  }

  // Private helper methods

  private sanitizeParams(params: any): any {
    // Remove undefined values
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': this.generateRequestId(),
      'X-Client-Version': process.env.REACT_APP_VERSION || '1.0.0',
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAcceptHeader(format: string): string {
    const acceptMap: Record<string, string> = {
      'csv': 'text/csv',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pdf': 'application/pdf',
      'json': 'application/json',
      'xml': 'application/xml',
    };
    return acceptMap[format] || 'application/json';
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'log':
        this.emitEvent(LogEventType.LOG_CREATED, data.log as RealTimeLog);
        break;
      case 'alert':
        this.emitEvent(LogEventType.ALERT_TRIGGERED, data.alert as LogAlert);
        break;
      case 'bulk':
        this.emitEvent(LogEventType.BULK_OPERATION, data.operation);
        break;
      case 'system':
        this.emitEvent(LogEventType.SYSTEM_HEALTH, data.status);
        break;
    }
  }

  private emitEvent(eventType: LogEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }



  private invalidateCache(): void {
    cache.clear();
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions');
        case 404:
          return new Error('Resource not found');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Internal server error');
        default:
          return new Error(data.message || `Error ${status}`);
      }
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

const logService = new LogService();
export default logService;

// Also export individual functions for backward compatibility
export const getLogs = logService.getLogs.bind(logService);
export const exportLogs = logService.exportLogs.bind(logService);
export const getLogStats = logService.getLogStats.bind(logService);
export const searchLogs = logService.searchLogs.bind(logService);
export const clearLogs = logService.clearLogs.bind(logService);
export const getLogById = logService.getLogById.bind(logService);
export const createLog = logService.createLog.bind(logService);
export const updateLog = logService.updateLog.bind(logService);
export const bulkOperation = logService.bulkOperation.bind(logService);
export const archiveLogs = logService.archiveLogs.bind(logService);
export const restoreLogs = logService.restoreLogs.bind(logService);
export const getAuditTrail = logService.getAuditTrail.bind(logService);
export const analyzeLogs = logService.analyzeLogs.bind(logService);
export const getSystemHealth = logService.getSystemHealth.bind(logService);
export const generateReport = logService.generateReport.bind(logService);
export const setupAlert = logService.setupAlert.bind(logService);
export const getAlerts = logService.getAlerts.bind(logService);
export const acknowledgeAlert = logService.acknowledgeAlert.bind(logService);
