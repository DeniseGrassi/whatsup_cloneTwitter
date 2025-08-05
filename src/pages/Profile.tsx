// src/pages/Profile.tsx

import React, {
  useContext,
  useEffect,
  useState,
  ChangeEvent,
  FormEvent
} from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

interface MiniUser {
  username: string
  photo: string | null
}

interface Post {
  id: number
  user: string
  content: string
  created_at: string
  parent: number | null
  parent_detail?: Partial<Post>
  likes_count: number
  comments_count: number
}

interface ProfileData {
  username: string
  email: string
  bio: string
  photo: string | null
  following: MiniUser[]
  followers: MiniUser[]
  following_count: number
  followers_count: number
  posts: Post[]
}

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
`

const Header = styled.h1`
  color: #0077ff;
  margin-bottom: 0.5rem;
`

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
`

const Bio = styled.p`
  font-style: italic;
  margin-bottom: 1.5rem;
`

const Stats = styled.div`
  margin-bottom: 2rem;
  & > span {
    margin-right: 1.5rem;
    font-weight: bold;
  }
`

const List = styled.ul`
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
`

const Item = styled.li`
  width: 48%;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`

const MiniAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
`

const Button = styled.button<{ primary?: boolean }>`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #fff;
  background: ${p => (p.primary ? '#0077ff' : '#777')};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`

const Input = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
`

const TextArea = styled.textarea`
  padding: 0.5rem;
  font-size: 1rem;
  resize: vertical;
`

const PostCard = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
`

const PostHeader = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.5rem;
`

const PostContent = styled.p`
  font-size: 1rem;
  margin-bottom: 0.5rem;
`

export default function Profile() {
  const { username: myUser, logout } = useContext(AuthContext)
  const { username: routeUsername } = useParams<{ username: string }>()
  const isMe = !routeUsername || routeUsername === myUser

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // edição (só para "meu perfil")
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const url = isMe ? '/api/profile/me/' : `/api/profile/${routeUsername}/`
    api.get<ProfileData>(url)
      .then(res => {
        setProfile(res.data)
        if (isMe) {
          setEmail(res.data.email)
          setBio(res.data.bio)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [routeUsername, isMe])

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!isMe) return

    setError(null)
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('bio', bio)
      if (photoFile) {
        formData.append('photo', photoFile)
      }
      await api.patch('/api/profile/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const res = await api.get<ProfileData>('/api/profile/me/')
      setProfile(res.data)
      alert('Perfil atualizado!')
    } catch {
      setError('Falha ao atualizar perfil.')
    }
  }

  async function toggleFollow() {
    if (isMe || !routeUsername) return
    try {
      await api.post(`/api/profile/${routeUsername}/follow/`)
      const res = await api.get<ProfileData>(`/api/profile/${routeUsername}/`)
      setProfile(res.data)
    } catch {
      alert('Não foi possível alterar follow.')
    }
  }

  if (loading) return <Container>Carregando perfil…</Container>
  if (error)   return <Container>Erro: {error}</Container>
  if (!profile) return null

  return (
    <Container>
      <Header>@{profile.username}</Header>
      <Avatar src={profile.photo || '/default-avatar.png'} alt="avatar" />

      <Stats>
        <span>Seguindo: {profile.following_count}</span>
        <span>Seguidores: {profile.followers_count}</span>
      </Stats>

      <h2>Seguindo</h2>
      {profile.following.length === 0 ? (
        <p>Não segue ninguém ainda.</p>
      ) : (
        <List>
          {profile.following.map(u => (
            <Item key={u.username}>
              <MiniAvatar src={u.photo || '/default-avatar.png'} alt="" />
              <Link to={`/profile/${u.username}`}>@{u.username}</Link>
            </Item>
          ))}
        </List>
      )}

      <h2>Seguidores</h2>
      {profile.followers.length === 0 ? (
        <p>Sem seguidores ainda.</p>
      ) : (
        <List>
          {profile.followers.map(u => (
            <Item key={u.username}>
              <MiniAvatar src={u.photo || '/default-avatar.png'} alt="" />
              <Link to={`/profile/${u.username}`}>@{u.username}</Link>
            </Item>
          ))}
        </List>
      )}

      {isMe ? (
        <>
          <Form onSubmit={handleSave}>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <label>
              E‑mail:
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
            <label>
              Bio:
              <TextArea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </label>
            <label>
              Foto de perfil:
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
            <Button primary type="submit">Salvar alterações</Button>
          </Form>
          <Button onClick={logout}>Sair</Button>
        </>
      ) : (
        <Button primary onClick={toggleFollow}>
          {profile.following.some(u => u.username === myUser)
            ? 'Deixar de seguir'
            : 'Seguir'}
        </Button>
      )}

      <h2>Postagens ({profile.posts.length})</h2>
      {profile.posts.length === 0 && <p>Sem tweets ainda.</p>}
      {profile.posts.map(p => (
        <PostCard key={p.id}>
          <PostHeader>
            {new Date(p.created_at).toLocaleString('pt-BR')}
            {p.parent_detail && <> — Retweet de {p.parent_detail.user}</>}
          </PostHeader>
          <PostContent>{p.content}</PostContent>
          <small>❤️ {p.likes_count} | 💬 {p.comments_count}</small>
        </PostCard>
      ))}
    </Container>
  )
}
