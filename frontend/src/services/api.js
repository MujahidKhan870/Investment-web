import axios from 'axios';

const api = axios.create({
  baseURL: 'https://investment-web-an1w.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // send cookies automatically
});

// Request Interceptor: Attach access token if present in memory/session
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

// Response Interceptor: Handle automated JWT Token Refreshing on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token request itself fails with 401
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh-token')) {
      originalRequest._retry = true;

      try {
        // Exchange refresh token cookie for a new access token
        const response = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const { accessToken } = response.data;

        // Save new access token
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is also expired or invalid; force logout user
        localStorage.removeItem('accessToken');
        // Let AuthContext redirect to login if page is protected
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export const handleApiError = (err) => {
  return err.response?.data?.message || err.message || 'An unexpected error occurred';
};
