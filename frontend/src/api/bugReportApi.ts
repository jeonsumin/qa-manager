import client from './client';
import type { BugReport } from '../types/bugReport';

export const bugReportApi = {
  list: (projectId: number, params?: Record<string, unknown>) =>
    client.get<{ success: boolean; data: BugReport[]; pagination: unknown }>(`/projects/${projectId}/bug-reports`, { params }),
  get: (projectId: number, id: number) =>
    client.get<{ success: boolean; data: BugReport }>(`/projects/${projectId}/bug-reports/${id}`),
  update: (projectId: number, id: number, data: Partial<BugReport>) =>
    client.put<{ success: boolean; data: BugReport }>(`/projects/${projectId}/bug-reports/${id}`, data),
  convertToIssue: (projectId: number, id: number) =>
    client.post<{ success: boolean; data: unknown }>(`/projects/${projectId}/bug-reports/${id}/convert`),
  delete: (projectId: number, id: number) =>
    client.delete(`/projects/${projectId}/bug-reports/${id}`),
};
