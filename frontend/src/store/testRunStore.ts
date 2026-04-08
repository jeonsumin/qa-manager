import { create } from 'zustand';
import { testRunApi } from '../api/testRunApi';
import type { TestRun } from '../types/testRun';

interface TestRunStore {
  runs: TestRun[];
  currentRun: TestRun | null;
  loading: boolean;
  error: string | null;
  fetchRuns: (projectId: number, params?: Record<string, unknown>) => Promise<void>;
  fetchRun: (projectId: number, id: number) => Promise<void>;
  createRun: (projectId: number, data: { name: string; description?: string; environment?: string; testCaseIds: number[] }) => Promise<TestRun>;
  updateRun: (projectId: number, id: number, data: Partial<TestRun>) => Promise<void>;
  deleteRun: (projectId: number, id: number) => Promise<void>;
  updateResult: (projectId: number, runId: number, resultId: number, status: string, comment?: string) => Promise<void>;
}

export const useTestRunStore = create<TestRunStore>((set, get) => ({
  runs: [],
  currentRun: null,
  loading: false,
  error: null,

  fetchRuns: async (projectId, params) => {
    set({ loading: true, error: null });
    try {
      const res = await testRunApi.list(projectId, params);
      set({ runs: res.data.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchRun: async (projectId, id) => {
    set({ loading: true });
    try {
      const res = await testRunApi.get(projectId, id);
      set({ currentRun: res.data.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createRun: async (projectId, data) => {
    const res = await testRunApi.create(projectId, data);
    const run = res.data.data;
    set(s => ({ runs: [run, ...s.runs] }));
    return run;
  },

  updateRun: async (projectId, id, data) => {
    const res = await testRunApi.update(projectId, id, data);
    const updated = res.data.data;
    set(s => ({
      runs: s.runs.map(r => r.id === id ? updated : r),
      currentRun: s.currentRun?.id === id ? updated : s.currentRun,
    }));
  },

  deleteRun: async (projectId, id) => {
    await testRunApi.delete(projectId, id);
    set(s => ({ runs: s.runs.filter(r => r.id !== id) }));
  },

  updateResult: async (projectId, runId, resultId, status, comment) => {
    await testRunApi.updateResult(projectId, runId, resultId, { status, comment });
    // Refresh the current run to get updated stats
    const res = await testRunApi.get(projectId, runId);
    set({ currentRun: res.data.data });
  },
}));
