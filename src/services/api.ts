import axios from "axios";

const RAW_BASE_URL =
  (typeof import.meta !== "undefined"
    ? (import.meta as any)?.env?.VITE_API_BASE_URL
    : undefined) ||
  process.env.REACT_APP_API_URL ||
  "https://whatsup-backend-c00eef392a0f.herokuapp.com/api";


const BASE_URL = String(RAW_BASE_URL).replace(/\/+$/, "");


const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});


if (typeof window !== "undefined") {
  (window as any).__API_BASE_URL__ = BASE_URL;
  (window as any).api = api;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const API_BASE = BASE_URL;
export const API_ORIGIN = BASE_URL.replace(/\/api$/, "");

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default api;
