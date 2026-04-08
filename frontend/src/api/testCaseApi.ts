import client from './client';
import type { TestCase } from '../types/testCase';

export const testCaseApi = {
  list: (projectId: number, params?: Record<string, unknown>) =>
    client.get<{ success: boolean; data: TestCase[]; pagination: unknown }>(`/projects/${projectId}/test-cases`, { params }),
  get: (projectId: number, id: number) =>
    client.get<{ success: boolean; data: TestCase }>(`/projects/${projectId}/test-cases/${id}`),
  create: (projectId: number, data: Partial<TestCase>) =>
    client.post<{ success: boolean; data: TestCase }>(`/projects/${projectId}/test-cases`, data),
  update: (projectId: number, id: number, data: Partial<TestCase>) =>
    client.put<{ success: boolean; data: TestCase }>(`/projects/${projectId}/test-cases/${id}`, data),
  delete: (projectId: number, id: number) =>
    client.delete(`/projects/${projectId}/test-cases/${id}`),
  categories: (projectId: number) =>
    client.get<{ success: boolean; data: string[] }>(`/projects/${projectId}/test-cases/categories`),
};
