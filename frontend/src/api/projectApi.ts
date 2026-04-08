import client from './client';
import type { Project } from '../types/project';

class ProjectController {
  private static instance: ProjectController;

  private constructor() {}

  static getInstance(): ProjectController {
    if (!ProjectController.instance) {
      ProjectController.instance = new ProjectController();
    }
    return ProjectController.instance;
  }

  list(params?: Record<string, unknown>) {
    return client.get<{ success: boolean; data: Project[]; pagination: unknown }>(
      '/projects',
      { params }
    );
  }

  get(id: number) {
    return client.get<{ success: boolean; data: Project }>(`/projects/${id}`);
  }

  create(data: Partial<Project>) {
    return client.post<{ success: boolean; data: Project }>('/projects', data);
  }

  update(id: number, data: Partial<Project>) {
    return client.put<{ success: boolean; data: Project }>(`/projects/${id}`, data);
  }

  delete(id: number) {
    return client.delete(`/projects/${id}`);
  }
}

export const projectApi = ProjectController.getInstance();
