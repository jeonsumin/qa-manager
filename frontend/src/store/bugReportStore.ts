import { create } from 'zustand';
import { bugReportApi } from '../api/bugReportApi';
import type { BugReport } from '../types/bugReport';

interface BugReportStore {
  bugReports: BugReport[];
  loading: boolean;
  error: string | null;
  fetchBugReports: (projectId: number, params?: Record<string, unknown>) => Promise<void>;
  updateBugReport: (projectId: number, id: number, data: Partial<BugReport>) => Promise<BugReport>;
  convertToIssue: (projectId: number, id: number) => Promise<unknown>;
  deleteBugReport: (projectId: number, id: number) => Promise<void>;
}

export const useBugReportStore = create<BugReportStore>((set) => ({
  bugReports: [],
  loading: false,
  error: null,

  fetchBugReports: async (projectId, params) => {
    set({ loading: true, error: null });
    try {
      const res = await bugReportApi.list(projectId, params);
      set({ bugReports: res.data.data, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  updateBugReport: async (projectId, id, data) => {
    const res = await bugReportApi.update(projectId, id, data);
    const updated = res.data.data;
    set(s => ({ bugReports: s.bugReports.map(r => r.id === id ? updated : r) }));
    return updated;
  },

  convertToIssue: async (projectId, id) => {
    const res = await bugReportApi.convertToIssue(projectId, id);
    set(s => ({
      bugReports: s.bugReports.map(r => r.id === id ? { ...r, status: 'converted' as const } : r),
    }));
    return res.data.data;
  },

  deleteBugReport: async (projectId, id) => {
    await bugReportApi.delete(projectId, id);
    set(s => ({ bugReports: s.bugReports.filter(r => r.id !== id) }));
  },
}));
