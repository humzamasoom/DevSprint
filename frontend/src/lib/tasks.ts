import api from './api';
import { Task, TaskCreate, TaskUpdate } from '../types';

export const tasksApi = {
  getTasks: async (projectId: number): Promise<Task[]> => {
    const response = await api.get<Task[]>(`/projects/${projectId}/tasks/`);
    return response.data;
  },

  createTask: async (projectId: number, task: TaskCreate): Promise<Task> => {
    const response = await api.post<Task>(`/projects/${projectId}/tasks/`, task);
    return response.data;
  },

  updateTask: async (taskId: number, update: TaskUpdate): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${taskId}`, update);
    return response.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
};

