// src/services/posts.ts
import api from '../services/api';

// Lista posts de um usuário (precisa estar logado)
export async function listUserPosts(username: string) {
  const { data } = await api.get(`/posts/user/${encodeURIComponent(username)}/`);
  return data as any[]; // Post[]
}

// Cria um post
export async function createPost(content: string) {
  const { data } = await api.post('/posts/', { content });
  return data; // post criado
}
