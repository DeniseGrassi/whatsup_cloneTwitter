import React, { useEffect, useState, ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import api, { resolveMediaUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import fotoAvatar from "../foto_avatar.avif";

interface MiniUser { username: string; photo: string | null }
interface Post {
  id: number; user: string; content: string; created_at: string;
  parent: number | null; parent_detail?: Partial<Post>;
  likes_count: number; comments_count: number;
}
interface ProfileData {
  username: string; email: string; bio: string; photo: string | null;
  following: MiniUser[]; followers: MiniUser[];
  following_count: number; followers_count: number; posts: Post[];
}

/* ==================== STYLES ==================== */

const Page = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem 3rem;
`;

const HeaderCard = styled.div`
  background: linear-gradient(135deg, #eef3ff 0%, #f6f8ff 100%);
  border: 1px solid #e6e9f5;
  border-radius: 16px;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 1rem;
  align-items: center;
`;

const Avatar = styled.img`
  width: 96px; height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 4px 20px rgba(88,101,242,0.15);
`;

const Title = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  h1 { margin: 0; font-size: 1.6rem; color: #1f2a44; }
`;

const Chips = styled.div` display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap; `;
const Chip = styled.span` background: #fff; border: 1px solid #e7ebf5; color: #2b3551;
  border-radius: 999px; padding: .35rem .7rem; font-size: .85rem; font-weight: 600; `;
const Bio = styled.p` margin: .5rem 0 0; color: #475067; line-height: 1.4; `;

const Grid = styled.div`
  display: grid; gap: 1rem; margin-top: 1rem;
  grid-template-columns: 1fr;
  @media (min-width: 900px) { grid-template-columns: 1.2fr .8fr; }
`;

const Card = styled.div` background: #fff; border: 1px solid #e9edf5; border-radius: 12px; padding: 1rem; `;
const SectionTitle = styled.h2` margin: 0 0 .75rem; font-size: 1.1rem; color: #1f2a44; `;
const List = styled.ul` list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem; `;

const UserPill = styled.li`
  display: flex; align-items: center; gap: .6rem;
  a { color: #1f4cff; font-weight: 600; text-decoration: none; }
  img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
`;

const PostCard = styled.div` border: 1px solid #eef1f7; border-radius: 10px; padding: .8rem;
  &:not(:last-child){ margin-bottom: .6rem; } `;
const PostHead = styled.div` font-size: .85rem; color: #667088; margin-bottom: .4rem; `;
const Actions = styled.div` display: flex; gap: .6rem; flex-wrap: wrap; `;

const Button = styled.button<{ variant?: "primary" | "ghost" }>`
  appearance: none; border: none; cursor: pointer;
  font-size: .95rem; font-weight: 600;
  padding: .55rem .9rem; border-radius: 10px;
  color: ${({ variant }) => variant === "ghost" ? "#1f4cff" : "#fff"};
  background: ${({ variant }) => variant === "ghost" ? "#eef3ff" : "#5865f2"};
  &:hover { opacity: .95; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

const Form = styled.form` display: grid; gap: .8rem; `;
const Label = styled.label` display: grid; gap: .35rem; font-size: .9rem; color: #2e3856; `;
const Input = styled.input`
  padding: .65rem .75rem; border-radius: 10px; border: 1px solid #dfe3ee;
  font-size: .95rem; outline: none;
  &:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88,101,242,.12); }
`;
const TextArea = styled.textarea`
  padding: .65rem .75rem; border-radius: 10px; border: 1px solid #dfe3ee;
  font-size: .95rem; min-height: 90px; resize: vertical; outline: none;
  &:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88,101,242,.12); }
`;
const UploadRow = styled.div` display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; `;
const HiddenFile = styled.input.attrs({ type: "file" })` display: none; `;
const UploadButton = styled.label`
  background: #eef3ff; color: #1f4cff; border: 1px dashed #cbd7ff;
  padding: .55rem .9rem; border-radius: 10px; cursor: pointer; font-weight: 600;
`;

/* Composer (tweet box) */
const ComposerCard = styled(Card)` padding: 0.75rem 1rem; `;
const ComposerText = styled(TextArea)` min-height: 80px; `;
const ComposerFooter = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: .75rem;
`;
const Counter = styled.span<{ bad?: boolean }>`
  font-size: .85rem; color: ${({ bad }) => (bad ? "#d32f2f" : "#5b667e")};
`;

/* ==================== COMPONENT ==================== */

const MAX_LEN = 280;

export default function Profile() {
  const { username: loggedUser, logout } = useAuth();
  const { username: routeUsername } = useParams<{ username: string }>();
  const isMe = !routeUsername || routeUsername === loggedUser;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [bioText, setBioText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // composer
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  const normalize = (d: Partial<ProfileData>): ProfileData => {
    const following = d.following ?? [];
    const followers = d.followers ?? [];
    const posts = d.posts ?? [];
    return {
      username: d.username ?? "",
      email: d.email ?? "",
      bio: d.bio ?? "",
      photo: d.photo ?? null,
      following, followers, posts,
      following_count: d.following_count ?? following.length,
      followers_count: d.followers_count ?? followers.length,
    };
  };

  const refetchMe = async () => {
    const { data } = await api.get<Partial<ProfileData>>("/profile/me/");
    setProfile(normalize(data));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const path = isMe ? "/profile/me/" : `/profile/${routeUsername}/`;
        const { data } = await api.get<Partial<ProfileData>>(path);
        const p = normalize(data);
        setProfile(p);
        if (isMe) { setEmail(p.email); setBioText(p.bio); }
      } catch (e: any) {
        setError(e?.response?.status ? `Erro ${e.response.status}` : e?.message);
      } finally { setLoading(false); }
    };
    load();
  }, [routeUsername, isMe]);

  // foto preview
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPhotoFile(f);
    setPhotoPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isMe) return;
    setError(null);
    try {
      const form = new FormData();
      form.append("email", email);
      form.append("bio", bioText);
      if (photoFile) form.append("photo", photoFile);
      await api.patch("/profile/me/", form);
      await refetchMe();
      setPhotoPreview(null);
      alert("Perfil atualizado!");
    } catch (e: any) {
      setError(e?.response?.status ? `Erro ${e.response.status}` : "Falha ao atualizar perfil.");
    }
  };

  // criar post
  const canPost = newPost.trim().length > 0 && newPost.length <= MAX_LEN && !posting;

  const handleCreatePost = async () => {
    if (!isMe || !canPost) return;
    setPosting(true);
    setError(null);
    try {
      const { data } = await api.post("/posts/", { content: newPost.trim() });
      setNewPost("");

      // update otimista: injeta novo post no topo
      setProfile(prev =>
        prev ? { ...prev, posts: [data as Post, ...prev.posts] } : prev
      );
    } catch (e: any) {
      setError(e?.response?.status ? `Erro ${e.response.status}` : "Falha ao publicar.");
    } finally {
      setPosting(false);
    }
  };

  const handleComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleCreatePost();
    }
  };

  const toggleFollow = async () => {
    if (isMe || !routeUsername) return;
    await api.post(`/profile/${routeUsername}/follow/`);
    const { data } = await api.get<Partial<ProfileData>>(`/profile/${routeUsername}/`);
    setProfile(normalize(data));
  };

  if (loading) return <Page><Card>Carregando perfil…</Card></Page>;
  if (error)   return <Page><Card>Erro: {error}</Card></Page>;
  if (!profile) return <Page><Card>Não foi possível carregar o perfil.</Card></Page>;

  const following = profile.following ?? [];
  const followers = profile.followers ?? [];
  const posts     = profile.posts ?? [];

  return (
    <Page>
      <HeaderCard>
        <Avatar
          src={photoPreview || resolveMediaUrl(profile.photo) || fotoAvatar}
          alt="avatar"
          onError={e => { (e.currentTarget as HTMLImageElement).src = fotoAvatar; }}
        />
        <div>
          <Title>
            <h1>@{profile.username}</h1>
            <Actions>
              {isMe ? (
                <Button variant="ghost" onClick={logout}>Sair</Button>
              ) : (
                <Button onClick={toggleFollow}>
                  {following.some(u => u.username === loggedUser) ? "Deixar de seguir" : "Seguir"}
                </Button>
              )}
            </Actions>
          </Title>
          {profile.bio && <Bio>{profile.bio}</Bio>}
          <Chips>
            <Chip>Seguindo: {profile.following_count}</Chip>
            <Chip>Seguidores: {profile.followers_count}</Chip>
            <Chip>Posts: {posts.length}</Chip>
          </Chips>
        </div>
      </HeaderCard>

      <Grid>
        {/* Esquerda: composer + posts */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {isMe && (
            <ComposerCard>
              <ComposerText
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                onKeyDown={handleComposerKey}
                placeholder="O que está acontecendo?"
                maxLength={MAX_LEN + 20}
              />
              <ComposerFooter>
                <Counter bad={newPost.length > MAX_LEN}>
                  {newPost.length}/{MAX_LEN}
                </Counter>
                <Button onClick={handleCreatePost} disabled={!canPost}>
                  {posting ? "Publicando..." : "Publicar"}
                </Button>
              </ComposerFooter>
            </ComposerCard>
          )}

          <Card>
            <SectionTitle>Postagens ({posts.length})</SectionTitle>
            {posts.length === 0 && <p>Sem tweets ainda.</p>}
            {posts.map(p => (
              <PostCard key={p.id}>
                <PostHead>
                  {new Date(p.created_at).toLocaleString("pt-BR")}
                  {p.parent_detail && <> — Retweet de {p.parent_detail.user}</>}
                </PostHead>
                <div style={{ fontSize: "1rem", color: "#17203c" }}>{p.content}</div>
                <div style={{ marginTop: ".35rem", fontSize: ".9rem", color: "#5b667e" }}>
                  ❤️ {p.likes_count} · 💬 {p.comments_count}
                </div>
              </PostCard>
            ))}
          </Card>
        </div>

        {/* Direita: social + edição */}
        <div style={{ display: "grid", gap: "1rem" }}>
          <Card>
            <SectionTitle>Seguindo</SectionTitle>
            {following.length === 0 ? (
              <p>Não segue ninguém ainda.</p>
            ) : (
              <List>
                {following.map(u => (
                  <UserPill key={u.username}>
                    <img
                      src={resolveMediaUrl(u.photo) || "/default-avatar.png"}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }}
                      alt=""
                    />
                    <Link to={`/profile/${u.username}`}>@{u.username}</Link>
                  </UserPill>
                ))}
              </List>
            )}
          </Card>

          <Card>
            <SectionTitle>Seguidores</SectionTitle>
            {followers.length === 0 ? (
              <p>Sem seguidores ainda.</p>
            ) : (
              <List>
                {followers.map(u => (
                  <UserPill key={u.username}>
                    <img
                      src={resolveMediaUrl(u.photo) || "/default-avatar.png"}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }}
                      alt=""
                    />
                    <Link to={`/profile/${u.username}`}>@{u.username}</Link>
                  </UserPill>
                ))}
              </List>
            )}
          </Card>

          {isMe && (
            <Card>
              <SectionTitle>Editar perfil</SectionTitle>
              <Form onSubmit={handleSave}>
                <Label>
                  E-mail
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </Label>
                <Label>
                  Bio
                  <TextArea value={bioText} onChange={e => setBioText(e.target.value)} />
                </Label>
                <Label>
                  Foto de perfil
                  <UploadRow>
                    <HiddenFile id="photo-file" accept="image/*" onChange={handlePhotoChange} />
                    <UploadButton htmlFor="photo-file">Escolher arquivo</UploadButton>
                    {photoFile && <span>{photoFile.name}</span>}
                  </UploadRow>
                </Label>
                <Button type="submit">Salvar alterações</Button>
              </Form>
            </Card>
          )}
        </div>
      </Grid>
    </Page>
  );
}
