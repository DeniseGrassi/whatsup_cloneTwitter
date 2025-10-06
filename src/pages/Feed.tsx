import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Title = styled.h1`
  color: #0077ff;
  margin-bottom: 1rem;
`;

const Composer = styled.form`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;

  textarea {
    width: 100%;
    min-height: 80px;
    resize: vertical;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 0.75rem;
    font-size: 1rem;
    outline: none;

    &:focus {
      border-color: #0077ff;
      background: #f8fbff;
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: .5rem;
    color: #999;

    button {
      background: #0077ff;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: .5rem .9rem;
      cursor: pointer;
      font-weight: 600;
      opacity: .95;
      transition: .2s;
    }
    button:disabled {
      opacity: .5;
      cursor: not-allowed;
    }
    button:hover:not(:disabled) {
      opacity: 1;
    }
  }
`;

const PostCard = styled.div`
  position: relative;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 1rem;
  background: #fff;
`;

const ActionBar = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;

  button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #0077ff;
    opacity: 0.7;
    transition: opacity 0.2s;
    &:hover { opacity: 1; }
  }
`;

const PostHeader = styled.div`
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.75rem;
`;

const PostContent = styled.p`
  font-size: 1rem;
  margin-bottom: 0.75rem;
`;

const PostFooter = styled.div`
  font-size: 0.8rem;
  color: #999;
  display: flex;
  justify-content: space-between;
`;

type Post = {
  id: number;
  user: string;
  content: string;
  created_at: string;
  parent: number | null;
  parent_detail?: { user?: string; content?: string } | null;
  likes_count: number;
  comments_count: number;
};

export default function Feed() {
  const { token, username } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // composer
  const [text, setText] = useState('');
  const [publishing, setPublishing] = useState(false);

  // para cancelar requests ao desmontar
  const abortRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!token) return; // ainda não logou
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      const { data } = await api.get<Post[]>('/posts/feed/', {
        signal: abortRef.current.signal,
      });
      setPosts(data);
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.message === 'canceled') return;
      const msg = e?.response?.status
        ? `Erro ${e.response.status} ao carregar o feed.`
        : 'Não foi possível carregar o feed.';
      setError(msg);
      console.error('GET /posts/feed/ falhou:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // quando a aba volta a ficar visível, atualiza
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        fetchPosts();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchPosts]);

  // --- ações ---

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma exclusão deste tweet?')) return;
    try {
      await api.delete(`/posts/${id}/`);
      // sincroniza com servidor (evita divergência)
      await fetchPosts();
    } catch (e: any) {
      alert(e?.response?.status ? `Erro ${e.response.status} ao excluir.` : 'Erro ao excluir o tweet.');
    }
  };

  const handleEdit = async (post: Post) => {
    const novo = window.prompt('Edite seu tweet:', post.content);
    if (novo == null) return; // cancel
    const value = novo.trim();
    if (!value || value === post.content) return;
    try {
      await api.patch(`/posts/${post.id}/`, { content: value });
      await fetchPosts(); // sincroniza
    } catch (e: any) {
      alert(e?.response?.status ? `Erro ${e.response.status} ao editar.` : 'Erro ao editar o tweet.');
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    try {
      setPublishing(true);
      await api.post('/posts/', { content });
      setText('');
      // pega do servidor para garantir persistência
      await fetchPosts();
    } catch (e: any) {
      alert(e?.response?.status ? `Erro ${e.response.status} ao publicar.` : 'Erro ao publicar.');
    } finally {
      setPublishing(false);
    }
  };

  if (!token) {
    return (
      <Container>
        <Title>Feed</Title>
        <p>Você precisa estar logado para ver o feed.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Feed</Title>

      {/* Composer */}
      <Composer onSubmit={handlePublish}>
        <textarea
          placeholder="O que está acontecendo?"
          maxLength={280}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row">
          <small>{text.length}/280</small>
          <button type="submit" disabled={publishing || !text.trim()}>
            {publishing ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </Composer>

      {loading && <p>Carregando posts…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && posts.length === 0 && <p>Nenhum post por enquanto.</p>}

      {posts.map(post => (
        <PostCard key={post.id}>
          {post.user === username && (
            <ActionBar>
              <button onClick={() => handleEdit(post)} aria-label="Editar">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(post.id)} aria-label="Excluir">
                <Trash2 size={16} />
              </button>
            </ActionBar>
          )}

          <PostHeader>
            <strong>@{post.user}</strong> · {new Date(post.created_at).toLocaleString('pt-BR')}
          </PostHeader>

          {!!post.parent_detail && (
            <PostContent style={{ fontStyle: 'italic', color: '#666' }}>
              Retweet de @{post.parent_detail.user}: “{post.parent_detail.content}”
            </PostContent>
          )}

          <PostContent>{post.content}</PostContent>

          <PostFooter>
            <span>♥ {post.likes_count}</span>
            <span>💬 {post.comments_count}</span>
          </PostFooter>
        </PostCard>
      ))}
    </Container>
  );
}
