export interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'SUPER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  role?: 'USER' | 'SUPER' | 'ADMIN';
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
  role?: 'USER' | 'SUPER' | 'ADMIN';
  isActive?: boolean;
}

export interface UserFilter {
  search?: string;
  role?: 'USER' | 'SUPER' | 'ADMIN' | 'ALL';
  isActive?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    USER: number;
    SUPER: number;
    ADMIN: number;
  };
}