import { create } from 'zustand';
import { issueApi } from '../api/issueApi';
import type { Issue } from '../types/issue';

interface IssueStore {
  issues: Issue[];
  loading: boolean;
  error: string | null;
  fetchIssues: (projectId: number, params?: Record<string, unknown>) => Promise<void>;
  createIssue: (projectId: number, data: Partial<Issue>) => Promise<Issue>;
  updateIssue: (projectId: number, id: number, data: Partial<Issue>) => Promise<Issue>;
  deleteIssue: (projectId: number, id: number) => Promise<void>;
}

export const useIssueStore = create<IssueStore>((set) => ({
  issues: [],
  loading: false,
  error: null,

  fetchIssues: async (projectId, params) => {
    set({ loading: true, error: null });
    try {
      const res = await issueApi.list(projectId, params);
      set({ issues: res.data.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createIssue: async (projectId, data) => {
    const res = await issueApi.create(projectId, data);
    const issue = res.data.data;
    set(s => ({ issues: [issue, ...s.issues] }));
    return issue;
  },

  updateIssue: async (projectId, id, data) => {
    const res = await issueApi.update(projectId, id, data);
    const updated = res.data.data;
    set(s => ({ issues: s.issues.map(i => i.id === id ? updated : i) }));
    return updated;
  },

  deleteIssue: async (projectId, id) => {
    await issueApi.delete(projectId, id);
    set(s => ({ issues: s.issues.filter(i => i.id !== id) }));
  },
}));
