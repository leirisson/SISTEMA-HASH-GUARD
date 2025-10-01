import axios from 'axios';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userService = {
  // Listar todos os usuários (apenas ADMIN)
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  // Buscar usuário por ID
  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Criar novo usuário (apenas ADMIN)
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Atualizar usuário
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },

  // Excluir usuário (apenas ADMIN)
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Obter perfil do usuário atual
  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile/me');
    return response.data;
  },

  // Estatísticas de usuários (simulado - pode ser implementado no backend)
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: { USER: number; SUPER: number; ADMIN: number };
  }> {
    const users = await this.getUsers();
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      byRole: {
        USER: users.filter(u => u.role === 'USER').length,
        SUPER: users.filter(u => u.role === 'SUPER').length,
        ADMIN: users.filter(u => u.role === 'ADMIN').length,
      }
    };

    return stats;
  }
};