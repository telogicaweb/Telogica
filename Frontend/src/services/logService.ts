import api from '../api';

export interface AdminLog {
  _id: string;
  adminId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  timestamp: string;
}

export interface LogsResponse {
  logs: AdminLog[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export const getLogs = async (params: any): Promise<LogsResponse> => {
  const response = await api.get('/logs/admin-logs', { params });
  return response.data;
};

export const exportLogs = async (params: any): Promise<Blob> => {
  const response = await api.get('/logs/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

export const getLogStats = async (): Promise<any> => {
  const response = await api.get('/logs/stats');
  return response.data;
};

export const clearLogs = async (beforeDate?: string): Promise<void> => {
  await api.delete('/logs/clear', {
    data: { beforeDate }
  });
};

export default {
  getLogs,
  exportLogs,
  getLogStats,
  clearLogs
};
