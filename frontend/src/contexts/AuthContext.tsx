import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isLead: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<User>('/users/me');
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        loading: isLoading,
        isAuthenticated: !!user,
        isLead: user?.role === 'lead',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

