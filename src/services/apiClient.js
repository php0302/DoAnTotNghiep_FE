import axios from 'axios';

// Base Axios instance trỏ về Spring Boot port 8080
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: đính kèm JWT token vào mọi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor: xử lý lỗi 401 (token hết hạn) và tự động làm mới
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Đưa các request bị lỗi vào hàng đợi nếu đang có 1 request refresh đang chạy
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post('http://localhost:8080/api/v1/auth/refresh', {
          refreshToken: refreshToken
        });

        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken;

        if (newAccessToken) localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default apiClient;
