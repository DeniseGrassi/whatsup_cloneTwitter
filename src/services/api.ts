import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/"; // Ajuste se for rodar em produção/deploy

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token em todas as requests autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
});

export default api;
