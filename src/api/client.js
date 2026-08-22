import axios from 'axios';
import { getAuthToken, clearSession } from '../utils/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use(cfg => {
  const token = getAuthToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearSession();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default client;
