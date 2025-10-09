// src/services/api.ts
import axios from "axios";

// 1) Permite forçar a URL via .env
const envUrl =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_URL ||
  "";

// 2) Detecta se estamos no localhost
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// 3) Defaults
const DEV_URL = "http://127.0.0.1:8000/api";
const PROD_URL = "https://whatsup-backend-c00eef392a0f.herokuapp.com/api";

// 4) Resolve a baseURL (precedência: .env > dev local > prod)
const RAW_BASE = (envUrl || (isLocalHost ? DEV_URL : PROD_URL)) as string;
const BASE_URL = RAW_BASE.replace(/\/+$/, ""); // remove barra final

const api = axios.create({ baseURL: BASE_URL });

// --- Auth header automático (DRF TokenAuthentication). 
// Se você estiver com JWT, troque 'Token' por 'Bearer'.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Exponha para checagem rápida no console
if (typeof window !== "undefined") {
  (window as any).__API_BASE_URL__ = BASE_URL;
  (window as any).api = api;
}

// Se 401, limpa sessão e volta pro login
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

// Resolve URLs de mídia (ex.: '/media/...')
export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}


export function normalizePhoto<T extends { photo?: string | null }>(obj: T): T {
  return { ...obj, photo: resolveMediaUrl(obj.photo) ?? null };
}


export default api;
