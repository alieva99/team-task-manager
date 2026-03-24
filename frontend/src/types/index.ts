export interface User {
  user_id: number;
  email: string;
  user_name: string;
}

export interface Project {
  project_id: number;
  project_name: string;
  workplace_id?: number;
  tag_id?: number;
}

export interface Column {
  column_id: number;
  project_id: number;
  column_name: string;
  order_index_column: number;
}

export interface Task {
  task_id: number;
  project_id: number;
  column_id: number;
  title: string;
  description?: string;
  priority_id?: number;
  tag_id?: number;
  task_user_id?: number;
  deadline?: Date;
  estimated_time?: Date;
  created_at: Date;
  updated_at?: Date;
  order_index_task: number;
  custom_fields?: Record<string, any>;
}

export interface Note {
  noted_id: number;
  task_id: number;
  content: any; // JSONB data
  created_at: Date;
  updated_at?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, userName: string, password: string) => Promise<void>;
  logout: () => void;
}