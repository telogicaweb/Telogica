import api from '../api';

export interface LogParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  adminId?: string;
  action?: string;
  entity?: string;
}

export const getLogs = async (params: LogParams) => {
  const response = await api.get('/api/logs', { params });
  return response.data;
};

export const exportLogs = async (params: LogParams & { format: string }) => {
  const response = await api.get('/api/logs/export', { 
    params,
    responseType: 'blob'
  });
  return response;
};
