import api from './api';
import { UserCreate, User } from '../types';

export const authApi = {
  register: async (data: UserCreate): Promise<User> => {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },
};

