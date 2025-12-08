// Simplified types for admin logs - only tracking CRUD operations
export enum LogEventType {
  LOG_CREATED = 'LOG_CREATED',
}

export interface Log {
  _id: string;
  timestamp: string;
  adminId: {
    _id: string;
    name: string;
    email: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  entity: 'Product' | 'Order' | 'Warranty' | 'Payment';
  entityId?: string;
  details?: any;
}

export interface LogStats {
  total: number;
  byEntity: {
    Product: number;
    Order: number;
    Warranty: number;
    Payment: number;
  };
  byAction: {
    CREATE: number;
    UPDATE: number;
    DELETE: number;
    APPROVE: number;
    REJECT: number;
  };
}

export interface LogFilter {
  startDate?: string;
  endDate?: string;
  adminId?: string;
  action?: string;
  entity?: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  filters?: LogFilter;
}
