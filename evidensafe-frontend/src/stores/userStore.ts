import { create } from 'zustand';
import { User, CreateUserRequest, UpdateUserRequest, UserFilter, UserStats } from '@/types/user';
import { userService } from '@/services/userService';

interface UserState {
  users: User[];
  selectedUser: User | null;
  userStats: UserStats | null;
  filters: UserFilter;
  loading: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: Partial<UserFilter>) => void;
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, userData: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  clearError: () => void;
  clearSelectedUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  userStats: null,
  filters: {
    search: '',
    role: 'ALL',
    isActive: undefined,
  },
  loading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar usuários',
        loading: false 
      });
    }
  },

  fetchUserById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const user = await userService.getUserById(id);
      set({ selectedUser: user, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar usuário',
        loading: false 
      });
    }
  },

  createUser: async (userData: CreateUserRequest) => {
    set({ loading: true, error: null });
    try {
      const newUser = await userService.createUser(userData);
      set((state) => ({
        users: [...state.users, newUser],
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar usuário',
        loading: false 
      });
      throw error;
    }
  },

  updateUser: async (id: string, userData: UpdateUserRequest) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await userService.updateUser(id, userData);
      set((state) => ({
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
        loading: false 
      });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await userService.deleteUser(id);
      set((state) => ({
        users: state.users.filter(user => user.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir usuário',
        loading: false 
      });
      throw error;
    }
  },

  fetchUserStats: async () => {
    try {
      const stats = await userService.getUserStats();
      set({ userStats: stats });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  },

  clearError: () => set({ error: null }),

  clearSelectedUser: () => set({ selectedUser: null }),
}));