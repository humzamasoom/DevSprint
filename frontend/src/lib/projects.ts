import api from './api';
import { Project, ProjectCreate, ProjectUpdate } from '../types';

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects/');
    return response.data;
  },

  createProject: async (project: ProjectCreate): Promise<Project> => {
    const response = await api.post<Project>('/projects/', project);
    return response.data;
  },

  getProject: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  addProjectMember: async (projectId: number, userId: number): Promise<Project> => {
    const response = await api.post<Project>(`/projects/${projectId}/members`, {
      user_id: userId,
    });
    return response.data;
  },

  removeProjectMember: async (projectId: number, userId: number): Promise<Project> => {
    const response = await api.delete<Project>(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  updateProject: async (projectId: number, update: ProjectUpdate): Promise<Project> => {
    const response = await api.patch<Project>(`/projects/${projectId}`, update);
    return response.data;
  },

  deleteProject: async (projectId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },
};

