import axios from "axios";

const envUrl =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "";

const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const DEV_URL = "http://127.0.0.1:8000/api";
const PROD_URL = "https://whatsup-backend-c00eef392a0f.herokuapp.com/api";

const RAW_BASE = (envUrl || (isLocalHost ? DEV_URL : PROD_URL)) as string;
const BASE_URL = RAW_BASE.replace(/\/+$/, "");

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) config.headers.Authorization = `Token ${token}`;
  return config;
});

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
