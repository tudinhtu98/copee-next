import axios from 'axios'
export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL })


api.interceptors.request.use((config)=>{
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers = { ...config.headers, Authorization: 'Bearer ' + token };
  }
  return config;
});

api.interceptors.response.use((res)=>res, (err)=>{
  if (err?.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
  }
  return Promise.reject(err);
});
