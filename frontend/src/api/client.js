import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const tokenKeys = {
  access: 'pcodcare_access_token',
  refresh: 'pcodcare_refresh_token',
  user: 'pcodcare_user',
};

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKeys.access);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem(tokenKeys.refresh);

    if (error.response?.status !== 401 || original?._retry || !refreshToken) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise =
      refreshPromise ||
      axios
        .post(`${API_URL}/auth/refresh`, { refreshToken })
        .then(({ data }) => {
          localStorage.setItem(tokenKeys.access, data.accessToken);
          localStorage.setItem(tokenKeys.refresh, data.refreshToken);
          localStorage.setItem(tokenKeys.user, JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent('pcodcare-auth-refreshed', { detail: data }));
          return data.accessToken;
        })
        .finally(() => {
          refreshPromise = null;
        });

    try {
      const accessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      window.dispatchEvent(new CustomEvent('pcodcare-auth-expired'));
      return Promise.reject(refreshError);
    }
  },
);

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  return error.response?.data?.message || error.message || fallback;
}
