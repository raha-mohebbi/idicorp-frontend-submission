import { create } from 'zustand';
import { Task, CreateTaskPayload, UpdateTaskPayload, TaskStatusFilter } from '../types';
import { tasksApi, getErrorMessage } from '../lib/api';

interface TaskState {
  tasks: Task[];
  searchQuery: string;
  statusFilter: TaskStatusFilter;
  isLoading: boolean;
  isCreating: boolean;
  savingEditId: number | null;
  updatingId: number | null;
  deletingId: number | null;
  error: string | null;
  successMessage: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: TaskStatusFilter) => void;
  clearMessages: () => void;
  fetchTasks: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<boolean>;
  updateTask: (id: number, payload: UpdateTaskPayload) => Promise<boolean>;
  toggleTaskCompletion: (task: Task) => Promise<boolean>;
  deleteTask: (id: number) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  searchQuery: '',
  statusFilter: 'all',
  isLoading: false,
  isCreating: false,
  savingEditId: null,
  updatingId: null,
  deletingId: null,
  error: null,
  successMessage: null,

  setSearchQuery: (searchQuery: string) => set({ searchQuery }),

  setStatusFilter: (statusFilter: TaskStatusFilter) => set({ statusFilter }),

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    const { searchQuery, statusFilter } = get();

    try {
      const params: { q?: string; completed?: boolean } = {};
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (statusFilter !== 'all') {
        params.completed = statusFilter === 'completed';
      }

      const tasks = await tasksApi.getTasks(params);
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), isLoading: false });
    }
  },

  createTask: async (payload: CreateTaskPayload) => {
    set({ isCreating: true, error: null, successMessage: null });
    try {
      const createdTask = await tasksApi.createTask(payload);

      // Local optimistic update: keep task in store so user sees it even though backend doesn't persist
      set((state) => {
        const matchesSearch =
          !state.searchQuery.trim() ||
          `${createdTask.title ?? ''} ${createdTask.description ?? ''}`
            .toLowerCase()
            .includes(state.searchQuery.trim().toLowerCase());

        const matchesStatus =
          state.statusFilter === 'all' ||
          Boolean(createdTask.completed) === (state.statusFilter === 'completed');

        return {
          tasks: matchesSearch && matchesStatus ? [createdTask, ...state.tasks] : state.tasks,
          isCreating: false,
          successMessage: 'تسک با موفقیت ایجاد شد.',
        };
      });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), isCreating: false });
      return false;
    }
  },

  updateTask: async (id: number, payload: UpdateTaskPayload) => {
    set({ savingEditId: id, error: null, successMessage: null });
    try {
      const updated = await tasksApi.updateTask(id, payload);

      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updated } : task)),
        savingEditId: null,
        successMessage: 'تسک با موفقیت ویرایش شد.',
      }));
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), savingEditId: null });
      return false;
    }
  },

  toggleTaskCompletion: async (task: Task) => {
    set({ updatingId: task.id, error: null, successMessage: null });
    try {
      const updated = await tasksApi.updateTask(task.id, { completed: !task.completed });

      set((state) => ({
        tasks: state.tasks.map((item) => (item.id === task.id ? { ...item, ...updated } : item)),
        updatingId: null,
        successMessage: 'وضعیت تسک با موفقیت به‌روزرسانی شد.',
      }));
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), updatingId: null });
      return false;
    }
  },

  deleteTask: async (id: number) => {
    set({ deletingId: id, error: null, successMessage: null });
    try {
      await tasksApi.deleteTask(id);

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        deletingId: null,
        successMessage: 'تسک با موفقیت حذف شد.',
      }));
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), deletingId: null });
      return false;
    }
  },
}));
