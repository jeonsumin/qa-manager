import {create} from 'zustand';
import {projectApi} from '../api/projectApi';
import type {Project} from '../types/project';

interface ProjectStore {
    projects: Project[];
    loading: boolean;
    error: string | null;
    fetchProjects: (params?: Record<string, unknown>) => Promise<void>;
    createProject: (data: Partial<Project>) => Promise<Project>;
    updateProject: (id: number, data: Partial<Project>) => Promise<Project>;
    deleteProject: (id: number) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    loading: false,
    error: null,

    fetchProjects: async (params) => {
        set({loading: true, error: null});
        try {
            const res = await projectApi.list(params);
            set({projects: res.data.data, loading: false});
        } catch (e) {
            set({error: (e as Error).message, loading: false});
        }
    },

    createProject: async (data) => {
        const res = await projectApi.create(data);
        const project = res.data.data;
        set(s => ({projects: [project, ...s.projects]}));
        return project;
    },

    updateProject: async (id, data) => {
        const res = await projectApi.update(id, data);
        const updated = res.data.data;
        set(s => ({projects: s.projects.map(p => p.id === id ? updated : p)}));
        return updated;
    },

    deleteProject: async (id) => {
        await projectApi.delete(id);
        set(s => ({projects: s.projects.filter(p => p.id !== id)}));
    },
}));
