import client from './client';
import type { TestRun } from '../types/testRun';

export const testRunApi = {
  list: (projectId: number, params?: Record<string, unknown>) =>
    client.get<{ success: boolean; data: TestRun[]; pagination: unknown }>(`/projects/${projectId}/test-runs`, { params }),
  get: (projectId: number, id: number) =>
    client.get<{ success: boolean; data: TestRun }>(`/projects/${projectId}/test-runs/${id}`),
  create: (projectId: number, data: { name: string; description?: string; environment?: string; testCaseIds: number[] }) =>
    client.post<{ success: boolean; data: TestRun }>(`/projects/${projectId}/test-runs`, data),
  update: (projectId: number, id: number, data: Partial<TestRun>) =>
    client.put<{ success: boolean; data: TestRun }>(`/projects/${projectId}/test-runs/${id}`, data),
  delete: (projectId: number, id: number) =>
    client.delete(`/projects/${projectId}/test-runs/${id}`),
  updateResult: (projectId: number, runId: number, resultId: number, data: { status: string; comment?: string }) =>
    client.put(`/projects/${projectId}/test-runs/${runId}/results/${resultId}`, data),
};
