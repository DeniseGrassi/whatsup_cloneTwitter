

// import axios from "axios";

// const API_URL = "https://whatsup-backend-c00eef392a0f.herokuapp.com/api/"; // com barra no final

// const api = axios.create({ baseURL: API_URL });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token && config.headers) config.headers.Authorization = `Token ${token}`;
//   return config;
// });

// export default api;


import axios from "axios";

const API_URL =
  (process.env.REACT_APP_API_URL as string) ||
  "http://127.0.0.1:8000/api/"; 

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;

