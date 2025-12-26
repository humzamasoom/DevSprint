import api from './api';
import { User } from '../types';

export const usersApi = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/list');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
};

