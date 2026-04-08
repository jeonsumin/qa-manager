import client from './client';

export const dashboardApi = {
    overall: () => client.get('/dashboard'),
    project: (projectId: number) => client.get(`/projects/${projectId}/dashboard`),
};
