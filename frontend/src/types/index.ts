// ============================================
// User Types
// ============================================
export type Role = 'lead' | 'dev';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: Role;
}

// ============================================
// Project Types
// ============================================
export interface Project {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  members: User[];
}

export interface ProjectCreate {
  title: string;
  description?: string;
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
}

// ============================================
// Task Types
// ============================================
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  project_id: number;
  assignee_id: number | null;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee_id?: number | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee_id?: number | null;
}

// ============================================
// Auth Types
// ============================================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
