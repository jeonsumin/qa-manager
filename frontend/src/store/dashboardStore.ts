import {create} from 'zustand';
import {dashboardApi} from '../api/dashboardApi';

interface DashboardStore {
    overallData: unknown;
    projectData: unknown;
    loading: boolean;
    fetchOverall: () => Promise<void>;
    fetchProject: (projectId: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
    overallData: null,
    projectData: null,
    loading: false,

    fetchOverall: async () => {
        set({loading: true});
        try {
            const res = await dashboardApi.overall();
            set({overallData: res.data.data, loading: false});
        } catch {
            set({loading: false});
        }
    },

    fetchProject: async (projectId) => {
        set({loading: true});
        try {
            const res = await dashboardApi.project(projectId);
            set({projectData: res.data.data, loading: false});
        } catch {
            set({loading: false});
        }
    },
}));
