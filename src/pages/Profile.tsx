import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import api, { resolveMediaUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import fotoAvatar from "../foto_avatar.avif";
import { Trash2 } from "lucide-react";
import EditProfileBox from "../components/EditProfileBox";

/* ----------------- Tipos ----------------- */
interface MiniUser { username: string; photo: string | null }
interface PostRaw {
  id: number;
  user?: string | number;
  user_detail?: { username?: string; photo?: string | null };
  author?: { username?: string; photo?: string | null };
  username?: string;
  content: string;
  created_at: string;
  parent?: number | null;
  parent_detail?: { id?: number; user?: string };
  likes_count: number;
  comments_count: number;
  liked?: boolean;
}
interface Post {
  id: number;
  user: string;                 // normalizado
  content: string;
  created_at: string;
  parent: number | null;
  parent_detail?: Partial<Post>;
  likes_count: number;
  comments_count: number;
  liked?: boolean;
}
interface ProfileData {
  username: string; email: string; bio: string; photo: string | null;
  following: MiniUser[]; followers: MiniUser[];
  following_count: number; followers_count: number;
}

/* ----------------- Estilos ----------------- */
const Page = styled.div`max-width: 1000px; margin: 2rem auto; padding: 0 1rem 3rem;`;
const HeaderCard = styled.div`
  background: linear-gradient(135deg, #eef3ff 0%, #f6f8ff 100%);
  border: 1px solid #e6e9f5; border-radius: 16px; padding: 1.25rem;
  display: grid; grid-template-columns: 96px 1fr; gap: 1rem; align-items: center;
`;
const Avatar = styled.img`width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 4px 20px rgba(88,101,242,.15);`;
const Title = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  h1 { margin: 0; font-size: 1.6rem; color: #1f2a44; }
`;
const Actions = styled.div`display: flex; gap: .6rem; flex-wrap: wrap;`;
const Button = styled.button<{ variant?: "primary" | "ghost" }>`
  appearance: none; border: none; cursor: pointer; font-size: .95rem; font-weight: 600;
  padding: .55rem .9rem; border-radius: 10px;
  color: ${(p) => (p.variant === "ghost" ? "#1f4cff" : "#fff")};
  background: ${(p) => (p.variant === "ghost" ? "#eef3ff" : "#5865f2")};
  &:hover { opacity: .95 } &:disabled { opacity: .6; cursor: not-allowed }
`;
const Bio = styled.p`margin: .5rem 0 0; color: #475067; line-height: 1.4;`;
const Chips = styled.div`display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap;`;
const Chip = styled.span`background: #fff; border: 1px solid #e7ebf5; color: #2b3551; border-radius: 999px; padding: .35rem .7rem; font-size: .85rem; font-weight: 600;`;
const Grid = styled.div`
  display: grid; gap: 1rem; margin-top: 1rem; grid-template-columns: 1fr;
  @media (min-width: 900px) { grid-template-columns: 1.2fr .8fr; }
`;
const Card = styled.div`background: #fff; border: 1px solid #e9edf5; border-radius: 12px; padding: 1rem;`;
const SectionTitle = styled.h2`margin: 0 0 .75rem; font-size: 1.1rem; color: #1f2a44;`;
const List = styled.ul`list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem;`;
const UserPill = styled.li`
  display: flex; align-items: center; gap: .6rem;
  a { color: #1f4cff; font-weight: 600; text-decoration: none; }
  img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
`;
const ComposerCard = styled(Card)`padding: 1rem;`;
const ComposerText = styled.textarea`
  width: 100%; box-sizing: border-box; min-height: 180px; border: 1px solid #dfe3ee; border-radius: 6px; outline: none; resize: none; font-size: 1rem; line-height: 1.5;
  &:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88,101,242,.12); }
  @media (min-width: 900px) { min-height: 220px; }
`;
const ComposerFooter = styled.div`display: flex; align-items: center; justify-content: space-between; gap: .75rem;`;
const Counter = styled.span<{ $bad?: boolean }>`font-size: .85rem; color: ${(p) => (p.$bad ? "#d32f2f" : "#5b667e")};`;
const PostCard = styled.div`position: relative; border: 1px solid #eef1f7; border-radius: 10px; padding: .8rem; &:not(:last-child) { margin-bottom: .6rem; }`;
const PostHead = styled.div`font-size: .85rem; color: #667088; margin-bottom: .4rem; display:flex; gap:.5rem; align-items:center;`;
const PostActions = styled.div`position: absolute; top: .5rem; right: .5rem; display: flex; gap: .4rem;`;
const IconBtn = styled.button`
  appearance: none; border: none; background: transparent; cursor: pointer; padding: 4px; color: #6b7280; border-radius: 8px;
  &:hover { color: #ef4444; background: #f3f4f6; } &:disabled { opacity: .5; cursor: default; }
`;
const ActionBar = styled.div`display: flex; gap: .7rem; margin-top: .5rem; font-size: .9rem;`;
const ActionBtn = styled.button<{ active?: boolean }>`
  appearance: none; border: none;
  background: ${(p) => (p.active ? "rgba(88,101,242,.12)" : "transparent")};
  color: ${(p) => (p.active ? "#5865f2" : "#5b667e")};
  padding: .35rem .55rem; border-radius: 8px; cursor: pointer;
  &:hover { background: rgba(88,101,242,.08); }
`;
const TextArea = styled.textarea`
  padding: .65rem .75rem; border-radius: 10px; border: 1px solid #dfe3ee; font-size: .95rem; min-height: 90px;
  resize: vertical; outline: none; &:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88,101,242,.12); }
`;
const ReplyItem = styled.div`border-left: 3px solid #eef1f7; padding-left: .6rem; margin-top: .5rem; color: #324158; font-size: .95rem;`;
const SideCol = styled.div`display: grid; gap: 12px; align-content: start; justify-self: end; width: 100%; max-width: 420px;`;

const MAX_LEN = 280;

/* ====== Helpers de normalização ====== */
const pickUsername = (raw: any): string | undefined => {
  // cobre vários formatos comuns do DRF
  if (typeof raw?.user === "string") return raw.user;
  if (typeof raw?.username === "string") return raw.username;
  if (typeof raw?.user_detail?.username === "string") return raw.user_detail.username;
  if (typeof raw?.author?.username === "string") return raw.author.username;
  if (typeof raw?.parent_detail?.user === "string") return raw.parent_detail.user; // fallback
  if (typeof raw?.user === "number") return String(raw.user);
  return undefined;
};

const normalizePost = (r: PostRaw): Post => ({
  id: r.id,
  user: pickUsername(r) || "",
  content: r.content,
  created_at: r.created_at,
  parent: (typeof r.parent === "number" ? r.parent : (r.parent_detail?.id ?? null)) ?? null,
  parent_detail: r.parent_detail
    ? { id: r.parent_detail.id ?? undefined, user: r.parent_detail.user as any }
    : undefined,
  likes_count: r.likes_count ?? 0,
  comments_count: r.comments_count ?? 0,
  liked: r.liked ?? false,
});

/* ====== Componente ====== */
export default function Profile() {
  const { username: loggedUser, logout } = useAuth();
  const params = useParams<{ username: string }>();
  const navigate = useNavigate();

  /** username “em exibição”: rota > logado */
  const viewUser = useMemo<string>(() => {
    const routeU = params.username && params.username !== "null" ? params.username : undefined;
    return routeU ?? (loggedUser ?? "");   // garante string
  }, [params.username, loggedUser]);

  const isMe = viewUser !== "" && viewUser === (loggedUser ?? "")
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [openThreadId, setOpenThreadId] = useState<number | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<number, Post[]>>({});
  const [loadingRepliesFor, setLoadingRepliesFor] = useState<number | null>(null);
  const [replyForId, setReplyForId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [followBusy, setFollowBusy] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement>(null);

  const avatarSrc = (p?: string | null) => resolveMediaUrl(p || undefined) || fotoAvatar;
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fotoAvatar;
  };

  const autosize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    autosize(composerRef.current);
  }, [newPost]);

  // normaliza foto e listas
  const mapMini = (u: MiniUser): MiniUser => ({
    username: u.username,
    photo: resolveMediaUrl(u.photo || undefined) ?? null,
  });
  const normalize = (d: Partial<ProfileData>): ProfileData => ({
    username: d.username ?? "",
    email: d.email ?? "",
    bio: d.bio ?? "",
    photo: resolveMediaUrl(d.photo ?? undefined) ?? null,
    following: (d.following ?? []).map(mapMini),
    followers: (d.followers ?? []).map(mapMini),
    following_count: d.following_count ?? (d.following?.length ?? 0),
    followers_count: d.followers_count ?? (d.followers?.length ?? 0),
  });

  /** ------- feed: posts de quem o DONO do perfil segue + do próprio DONO ------- */
  function buildAllowedUsernames(p: ProfileData) {
    const following = (p.following ?? []).map(u => u.username);
    return Array.from(new Set<string>([p.username, ...following]));
  }

  async function fetchPostsFromAllowed(allowedUsernames: string[]) {
    const allow = new Set<string>(allowedUsernames);
    const filterAndSort = (arr: Post[] | undefined) =>
      (arr ?? [])
        .filter(p => allow.has(p.user))         // filtra por autor normalizado
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

    try {
      // 1) tenta feed
      try {
        const r = await api.get<PostRaw[] | { results: PostRaw[] }>("/posts/feed/");
        const raw = Array.isArray(r.data) ? r.data : (r.data as any).results ?? [];
        const normalized = raw.map(normalizePost);
        const filtered = filterAndSort(normalized);
        if (filtered.length) {
          setPosts(filtered);
          return;
        }
      } catch { }

      // 2) fallback: lista completa
      try {
        const r2 = await api.get<PostRaw[] | { results: PostRaw[] }>("/posts/");
        const raw2 = Array.isArray(r2.data) ? r2.data : (r2.data as any).results ?? [];
        const normalized2 = raw2.map(normalizePost);
        setPosts(filterAndSort(normalized2));
        return;
      } catch { }

      setPosts([]);
    } catch (e) {
      console.error("Falha ao buscar posts (allowed):", e);
      setPosts([]);
    }
  }

  /** ------- (opcional) fallback para listas de seguidores/seguindo ------- */
  const maybeFetchFollowLists = async (p: ProfileData): Promise<ProfileData> => {
    const out = { ...p };
    // só tenta fallback se contagem > 0 mas lista veio vazia
    try {
      if (out.following_count > 0 && out.following.length === 0) {
        const r = await api.get<MiniUser[]>(`/profile/${encodeURIComponent(p.username)}/following/`);
        out.following = (r.data ?? []).map(mapMini);
      }
    } catch { }
    try {
      if (out.followers_count > 0 && out.followers.length === 0) {
        const r2 = await api.get<MiniUser[]>(`/profile/${encodeURIComponent(p.username)}/followers/`);
        out.followers = (r2.data ?? []).map(mapMini);
      }
    } catch { }
    return out;
  };

  /** ------- carregar perfil por USERNAME (inclusive “me”) ------- */
  const fetchProfile = async (user: string) => {
    const { data } = await api.get<Partial<ProfileData>>(`/profile/${encodeURIComponent(user)}/`);
    let p = normalize(data);
    // fallback: se a API não entregar listas no /:username/, tenta nos endpoints dedicados
    p = await maybeFetchFollowLists(p);
    setProfile(p);

    const allowed = buildAllowedUsernames(p);
    await fetchPostsFromAllowed(allowed);
  };

  /** ------- carregamento inicial / troca de rota ------- */
  useEffect(() => {
    if (!viewUser) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        await fetchProfile(viewUser);
      } catch (e: any) {
        setError(e?.response?.status ? `Erro ${e.response.status}` : e?.message || "Falha ao carregar perfil");
      } finally {
        setLoading(false);
      }
    })();
  }, [viewUser]);

  /** ------- ao voltar o foco pra aba, refaz o feed com o mesmo filtro ------- */
  useEffect(() => {
    const onFocus = () => {
      if (!profile) return;
      const allowed = buildAllowedUsernames(profile);
      void fetchPostsFromAllowed(allowed);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [profile]);

  /** ------- publicar ------- */
  const canPost = newPost.trim().length > 0 && newPost.length <= MAX_LEN && !posting;
  const handleCreatePost = async () => {
    if (!isMe || !canPost) return;
    setPosting(true);
    setError(null);
    try {
      const { data } = await api.post<PostRaw>("/posts/", { content: newPost.trim() });
      setNewPost("");
      const normalized = normalizePost(data);
      setPosts(prev =>
        [normalized, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
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

  /** ------- seguir / deixar de seguir ------- */
  const toggleFollow = async () => {
    if (isMe || !viewUser || !profile) return;
    setFollowBusy(true);
    try {
      const amFollowing = profile.followers?.some(u => u.username === loggedUser);
      if (amFollowing) {
        await api.delete(`/profile/${encodeURIComponent(viewUser)}/follow/`);
      } else {
        await api.post(
          `/profile/${encodeURIComponent(viewUser)}/follow/`,
          {},
          { headers: { "Content-Type": "application/json" } }
        );
      }
      await fetchProfile(viewUser); // garante contadores + listas
    } catch (e: any) {
      const status = e?.response?.status;
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Falha na operação.";
      alert(`Erro${status ? ` ${status}` : ""} ao seguir/deixar de seguir. ${detail}`);
    } finally {
      setFollowBusy(false);
    }
  };

  /** ------- excluir ------- */
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Apagar este post?")) return;
    try {
      setDeletingId(postId);
      await api.delete(`/posts/${postId}/`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e: any) {
      alert(e?.response?.status ? `Erro ${e.response.status} ao excluir.` : "Falha ao excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  /** ------- like ------- */
  const handleLike = async (post: Post) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id ? { ...p, liked: !p.liked, likes_count: p.likes_count + (p.liked ? -1 : 1) } : p
      )
    );
    try {
      const { data } = await api.post<{ liked?: boolean; likes_count?: number }>(`/posts/${post.id}/like/`);
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? {
              ...p,
              liked: data?.liked ?? !post.liked,
              likes_count: data?.likes_count ?? (post.likes_count + (post.liked ? -1 : 1)),
            }
            : p
        )
      );
    } catch {
      setPosts(prev =>
        prev.map(p => (p.id === post.id ? { ...p, liked: post.liked, likes_count: post.likes_count } : p))
      );
    }
  };

  /** ------- replies ------- */
  const onlyRepliesOf = (arr: Post[] | undefined, parentId: number) => {
    const pid = Number(parentId);
    if (!Array.isArray(arr)) return [];
    return (arr as Post[])
      .filter(p => {
        const parent = Number((p as any).parent ?? (p as any).parent_detail?.id ?? -1);
        return parent === pid;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const loadReplies = async (parentId: number) => {
    setLoadingRepliesFor(parentId);
    try {
      let data: Post[] = [];
      try {
        const r = await api.get<PostRaw[]>(`/posts/${parentId}/replies/`);
        data = onlyRepliesOf(r.data.map(normalizePost), parentId);
      } catch { }
      if (!data.length) {
        try {
          const r2 = await api.get<PostRaw[]>(`/posts/?parent=${parentId}`);
          data = onlyRepliesOf(r2.data.map(normalizePost), parentId);
        } catch { }
      }
      if (!data.length) {
        try {
          const r3 = await api.get<PostRaw[]>(`/posts/feed/`);
          data = onlyRepliesOf(r3.data.map(normalizePost), parentId);
        } catch (e) {
          console.error("Fallback replies/feed falhou:", e);
        }
      }
      setRepliesMap(prev => ({ ...prev, [parentId]: data }));
    } finally {
      setLoadingRepliesFor(null);
    }
  };

  const toggleThread = async (postId: number) => {
    if (openThreadId === postId) {
      setOpenThreadId(null);
      setReplyForId(null);
      setReplyText("");
      return;
    }
    setOpenThreadId(postId);
    if (!repliesMap[postId]) await loadReplies(postId);
  };

  const sendReply = async (parentId: number) => {
    const text = replyText.trim();
    if (!text) return;
    try {
      const { data } = await api.post<PostRaw>("/posts/", { content: text, parent: parentId });
      const normalized = normalizePost(data);
      setPosts(prev => prev.map(p => (p.id === parentId ? { ...p, comments_count: p.comments_count + 1 } : p)));
      setRepliesMap(prev => ({ ...prev, [parentId]: [normalized, ...(prev[parentId] ?? [])] }));
      setReplyText("");
      setReplyForId(null);
    } catch (e) {
      console.error("Falha ao enviar resposta:", e);
    }
  };

  /* ====== RENDER ====== */
  if (loading) return <Page><Card>Carregando perfil…</Card></Page>;
  if (error) return <Page><Card>Erro: {error}</Card></Page>;
  if (!profile) return <Page><Card>Não foi possível carregar o perfil.</Card></Page>;

  const amIFollowingThisUser = !isMe && profile.followers?.some(u => u.username === loggedUser);

  return (
    <Page>
      <HeaderCard>
        <Avatar src={avatarSrc(profile.photo)} loading="lazy" alt="avatar" onError={handleImgError} />
        <div>
          <Title>
            <h1>@{profile.username}</h1>
            <Actions>
              <Button as={Link} to="/feed" variant="ghost">Feed</Button>
              <Button as={Link} to="/explore" variant="ghost">Explorar</Button>
              {isMe ? (
                <Button variant="ghost" onClick={logout}>Sair</Button>
              ) : (
                <>
                  {loggedUser && (
                    <Button as={Link} to={`/profile/${loggedUser}`} variant="ghost">
                      Meu perfil
                    </Button>
                  )}
                  <Button onClick={toggleFollow} disabled={followBusy}>
                    {amIFollowingThisUser ? "Deixar de seguir" : "Seguir"}
                  </Button>
                </>
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
        {/* Esquerda */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {isMe && (
            <ComposerCard>
              <ComposerText
                ref={composerRef}
                value={newPost}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                onChange={(e) => setNewPost(e.target.value)}
                onKeyDown={handleComposerKey}
                placeholder="O que está acontecendo?"
                maxLength={MAX_LEN + 20}
              />

              <ComposerFooter>
                <Counter $bad={newPost.length > MAX_LEN}>{newPost.length}/{MAX_LEN}</Counter>
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
                {isMe && p.user === profile.username && (
                  <PostActions>
                    <IconBtn onClick={() => handleDeletePost(p.id)} title="Apagar" disabled={deletingId === p.id}>
                      <Trash2 size={16} />
                    </IconBtn>
                  </PostActions>
                )}

                <PostHead>
                  {/* AUTOR CLICÁVEL */}
                  <Link to={`/profile/${p.user}`}>@{p.user}</Link>
                  <span style={{ color: "#8d99ae" }}>
                    {" "}· {new Date(p.created_at).toLocaleString("pt-BR")}
                  </span>
                  {p.parent_detail?.user && (
                    <span style={{ color: "#8d99ae" }}>
                      {" "}— Retweet de{" "}
                      <Link to={`/profile/${p.parent_detail.user}`}>@{p.parent_detail.user}</Link>
                    </span>
                  )}
                </PostHead>

                <div style={{ fontSize: "1rem", color: "#17203c" }}>{p.content}</div>

                <ActionBar>
                  <ActionBtn active={!!p.liked} onClick={() => handleLike(p)}>♥ {p.likes_count}</ActionBtn>
                  <ActionBtn onClick={() => { toggleThread(p.id); setReplyForId(p.id); }}>💬 {p.comments_count}</ActionBtn>
                </ActionBar>

                {openThreadId === p.id && (
                  <div style={{ marginTop: ".6rem" }}>
                    {loadingRepliesFor === p.id ? (
                      <p>Carregando respostas…</p>
                    ) : (
                      <>
                        {(repliesMap[p.id] ?? []).map(r => (
                          <ReplyItem key={r.id}>
                            <strong><Link to={`/profile/${r.user}`}>@{r.user}</Link></strong>{" "}
                            <span style={{ color: "#8d99ae" }}>
                              · {new Date(r.created_at).toLocaleString("pt-BR")}
                            </span>
                            <div style={{ marginTop: ".2rem" }}>{r.content}</div>
                          </ReplyItem>
                        ))}
                        <div style={{ marginTop: ".6rem" }}>
                          <TextArea
                            placeholder="Escreva uma resposta…"
                            value={replyForId === p.id ? replyText : ""}
                            onChange={e => { setReplyForId(p.id); setReplyText(e.target.value); }}
                          />
                          <div style={{ display: "flex", gap: ".5rem", marginTop: ".4rem" }}>
                            <Button variant="ghost" onClick={() => { setOpenThreadId(null); setReplyForId(null); setReplyText(""); }}>
                              Fechar
                            </Button>
                            <Button onClick={() => sendReply(p.id)} disabled={!replyText.trim()}>
                              Responder
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </PostCard>
            ))}
          </Card>
        </div>

        {/* Direita */}
        <div style={{ display: "grid", gap: "1rem" }}>
          <SideCol>
            <Card>
              <SectionTitle>Seguindo</SectionTitle>
              {profile.following.length === 0 ? (
                <p>Não segue ninguém ainda.</p>
              ) : (
                <List>
                  {profile.following.map(u => (
                    <UserPill key={u.username}>
                      <img src={avatarSrc(u.photo)} loading="lazy" width={28} height={28} onError={handleImgError} alt="" />
                      <Link to={`/profile/${u.username}`}>@{u.username}</Link>
                    </UserPill>
                  ))}
                </List>
              )}
            </Card>

            <Card>
              <SectionTitle>Seguidores</SectionTitle>
              {profile.followers.length === 0 ? (
                <p>Sem seguidores ainda.</p>
              ) : (
                <List>
                  {profile.followers.map(u => (
                    <UserPill key={u.username}>
                      <img src={avatarSrc(u.photo)} loading="lazy" width={28} height={28} onError={handleImgError} alt="" />
                      <Link to={`/profile/${u.username}`}>@{u.username}</Link>
                    </UserPill>
                  ))}
                </List>
              )}
            </Card>

            {isMe && (
              <EditProfileBox
                onUpdated={() => { if (viewUser) fetchProfile(viewUser); }}
                onUsernameChanged={(u) => { if (u) navigate(`/profile/${u}`); }}
              />
            )}
          </SideCol>
        </div>
      </Grid>
    </Page>
  );
}

