import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error?.message || err.message || '오류가 발생했습니다.';
    return Promise.reject(new Error(message));
  }
);

export default client;
