import axios from 'axios';

const BASE_URL = 'https://investment-web-an1w.onrender.com';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        // 🔥 FIXED: absolute backend URL (VERY IMPORTANT)
        const response = await axios.post(
          `${BASE_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Error helper
export const handleApiError = (err) => {
  return err.response?.data?.message || err.message || 'An unexpected error occurred';
};