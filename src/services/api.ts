import axios from "axios";

const API_URL = "https://whatsup-backend-c00eef392a0f.herokuapp.com/api/";

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
