import client from './client';
import type {Issue} from '../types/issue';

export const issueApi = {
    list: (projectId: number, params?: Record<string, unknown>) =>
        client.get<{ success: boolean; data: Issue[]; pagination: unknown }>(`/projects/${projectId}/issues`, {params}),
    get: (projectId: number, id: number) =>
        client.get<{ success: boolean; data: Issue }>(`/projects/${projectId}/issues/${id}`),
    create: (projectId: number, data: Partial<Issue>) =>
        client.post<{ success: boolean; data: Issue }>(`/projects/${projectId}/issues`, data),
    update: (projectId: number, id: number, data: Partial<Issue>) =>
        client.put<{ success: boolean; data: Issue }>(`/projects/${projectId}/issues/${id}`, data),
    delete: (projectId: number, id: number) =>
        client.delete(`/projects/${projectId}/issues/${id}`),
};
