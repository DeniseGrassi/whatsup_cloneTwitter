import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Edit2, Trash2 } from 'lucide-react'
// import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
`

const Title = styled.h1`
  color: #0077ff;
  margin-bottom: 1rem;
`

const PostCard = styled.div`
  position: relative;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 1rem;
  background: #fff;
`

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
    &:hover {
      opacity: 1;
    }
  }
`

const PostHeader = styled.div`
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.75rem;
`

const PostContent = styled.p`
  font-size: 1rem;
  margin-bottom: 0.75rem;
`

const PostFooter = styled.div`
  font-size: 0.8rem;
  color: #999;
  display: flex;
  justify-content: space-between;
`

interface Post {
  id: number
  user: string
  content: string
  created_at: string
  parent: number | null
  parent_detail?: {
    user: string
    content: string
    created_at: string
  }
  likes_count: number
  comments_count: number
}

export default function Feed() {
  const { token, username } = useAuth();
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<Post[]>('/posts/feed/', {
        headers: { Authorization: `Token ${token}` }
      })
      setPosts(res.data)
      setError(null)
    } catch {
      setError('Não foi possível carregar o feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [token])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma exclusão deste tweet?')) return
    try {
      await api.delete(`/posts/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      })
      fetchPosts()
    } catch {
      alert('Erro ao excluir o tweet.')
    }
  }

  const handleEdit = async (post: Post) => {
    const novo = window.prompt('Edite seu tweet:', post.content)
    if (novo == null || !novo.trim()) return
    try {
      await api.put(
        `/posts/${post.id}/`,
        { content: novo },
        { headers: { Authorization: `Token ${token}` } }
      )
      fetchPosts()
    } catch {
      alert('Erro ao editar o tweet.')
    }
  }

  if (!token) {
    return (
      <Container>
        <Title>Feed</Title>
        <p>Você precisa estar logado para ver o feed.</p>
      </Container>
    )
  }

  return (
    <Container>
      <Title>Feed</Title>

      {loading && <p>Carregando posts...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && posts.length === 0 && <p>Nenhum post por enquanto.</p>}

      {posts.map(post => (
        <PostCard key={post.id}>
          {post.user === username && (
            <ActionBar>
              <button onClick={() => handleEdit(post)} title="Editar">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(post.id)} title="Excluir">
                <Trash2 size={16} />
              </button>
            </ActionBar>
          )}

          <PostHeader>
            <strong>@{post.user}</strong> •{' '}
            {new Date(post.created_at).toLocaleString('pt-BR')}
          </PostHeader>

          {post.parent_detail && (
            <PostContent style={{ fontStyle: 'italic', color: '#666' }}>
              Retweet de @{post.parent_detail.user}: “
              {post.parent_detail.content}”
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
  )
}
