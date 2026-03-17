import axios from 'axios';

const api = axios.create({
  baseURL: 'https://memory-sprint-backend.vercel.app/',
});





api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
