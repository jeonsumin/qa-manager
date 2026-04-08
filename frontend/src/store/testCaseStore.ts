import { create } from 'zustand';
import { testCaseApi } from '../api/testCaseApi';
import type { TestCase } from '../types/testCase';

interface TestCaseStore {
  cases: TestCase[];
  categories: string[];
  loading: boolean;
  error: string | null;
  fetchCases: (projectId: number, params?: Record<string, unknown>) => Promise<void>;
  fetchCategories: (projectId: number) => Promise<void>;
  createCase: (projectId: number, data: Partial<TestCase>) => Promise<TestCase>;
  updateCase: (projectId: number, id: number, data: Partial<TestCase>) => Promise<TestCase>;
  deleteCase: (projectId: number, id: number) => Promise<void>;
}

export const useTestCaseStore = create<TestCaseStore>((set) => ({
  cases: [],
  categories: [],
  loading: false,
  error: null,

  fetchCases: async (projectId, params) => {
    set({ loading: true, error: null });
    try {
      const res = await testCaseApi.list(projectId, params);
      set({ cases: res.data.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchCategories: async (projectId) => {
    try {
      const res = await testCaseApi.categories(projectId);
      set({ categories: res.data.data });
    } catch { /* ignore */ }
  },

  createCase: async (projectId, data) => {
    const res = await testCaseApi.create(projectId, data);
    const tc = res.data.data;
    set(s => ({ cases: [tc, ...s.cases] }));
    return tc;
  },

  updateCase: async (projectId, id, data) => {
    const res = await testCaseApi.update(projectId, id, data);
    const updated = res.data.data;
    set(s => ({ cases: s.cases.map(c => c.id === id ? updated : c) }));
    return updated;
  },

  deleteCase: async (projectId, id) => {
    await testCaseApi.delete(projectId, id);
    set(s => ({ cases: s.cases.filter(c => c.id !== id) }));
  },
}));
