import axios from 'axios';

// Base Axios instance trỏ về Spring Boot port 8080
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: đính kèm JWT token vào mọi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: xử lý lỗi 401 (token hết hạn)
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect to login if it's a 401 and NOT from the auth endpoint itself
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default apiClient;
