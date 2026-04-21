import apiClient from './apiClient';

export const authService = {
  /**
   * POST /auth/login
   * LoginRequest: { usernameOrEmail, password }
   */
  login: async (usernameOrEmail, password) => {
    const { data } = await apiClient.post('/auth/login', { usernameOrEmail, password });
    // TokenResponse trả về: { accessToken, refreshToken, tokenType }
    const token = data?.data?.accessToken;
    if (token) localStorage.setItem('token', token);
    return data;
  },

  /**
   * POST /auth/register
   * RegisterRequest: { username, email, password } — KHÔNG có fullName
   * @param {{ username: string, email: string, password: string }} payload
   */
  register: async ({ username, email, password }) => {
    const { data } = await apiClient.post('/auth/register', { username, email, password });
    return data;
  },

  logout: () => localStorage.removeItem('token'),
};
