import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (email: string, password: string, role: string = 'analyst') => {
    const response = await api.post('/auth/register', { email, password, role });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data.transaction;
  },

  create: async (transaction: any) => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/transactions/${id}`, { status });
    return response.data.transaction;
  },

  getStats: async () => {
    const response = await api.get('/transactions/stats');
    return response.data;
  },
};

// Alerts API
export const alertsAPI = {
  getAll: async (params?: any) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/alerts/${id}`, data);
    return response.data.alert;
  },

  getStats: async () => {
    const response = await api.get('/alerts/stats');
    return response.data;
  },
};

export default api;