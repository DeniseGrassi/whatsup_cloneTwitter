import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { Edit2, Trash2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

/* ---------- styles ---------- */
const Container = styled.div`
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
`;
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const Title = styled.h1`
  color: #0077ff;
  margin: 0 0 1rem;
`;
const BackBtn = styled(Link)`
  border: 1px solid #7c4dff33;
  background: #7c4dff12;
  color: #6b4eff;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  text-decoration: none;
`;
const Composer = styled.form`
  background: #fff; border: 1px solid #e6e9f5; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;
  textarea {
    width: 100%; min-height: 140px; resize: vertical; border: 1px solid #dfe3ee; border-radius: 10px;
    padding: 0.75rem; font-size: 1rem; outline: none;
    &:focus { border-color: #5865f2; background: #f8fbff; box-shadow: 0 0 0 3px rgba(88,101,242,.12); }
  }
  .row {
    display: flex; justify-content: space-between; align-items: center; margin-top: .5rem; color: #999;
    button { background: #5865f2; color: #fff; border: none; border-radius: 10px; padding: .5rem .9rem; cursor: pointer; font-weight: 600; opacity: .95; transition: .2s; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    button:hover:not(:disabled) { opacity: 1; }
  }
`;
const PostCard = styled.div`
  position: relative; border: 1px solid #eef1f7; border-radius: 10px; padding: 1rem 1rem .6rem; margin-bottom: 1rem; background: #fff;
`;
const ActionBarIcons = styled.div`
  position: absolute; top: .5rem; right: .75rem; display: flex; gap: .5rem;
  button { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; color: #7c4dff; opacity: .7; transition: opacity .2s; &:hover { opacity: 1; } }
`;
const PostHeader = styled.div` font-size: .9rem; color: #555; margin-bottom: .5rem;`;
const AuthorLink = styled(Link)` color: #111; font-weight: 700; text-decoration: none; &:hover { text-decoration: underline; }`;
const SoftLink = styled(Link)` color: #666; text-decoration: none; &:hover { text-decoration: underline; }`;
const PostContent = styled.p` font-size: 1rem; margin: 0 0 .35rem;`;
const ActionRow = styled.div` display: flex; gap: .7rem; margin-top: .25rem; margin-bottom: .4rem; font-size: .9rem; color: #5b667e;`;
const ActionBtn = styled.button<{ active?: boolean }>`
  appearance: none; border: none;
  background: ${({ active }) => (active ? "rgba(88,101,242,.12)" : "transparent")};
  color: ${({ active }) => (active ? "#5865f2" : "#5b667e")};
  padding: .35rem .55rem; border-radius: 8px; cursor: pointer;
  &:hover { background: rgba(88,101,242,.08); }
`;
const RepliesBox = styled.div` border-top: 1px dashed #edf0f7; margin-top: .4rem; padding-top: .6rem;`;
const ReplyItem = styled.div` border-left: 3px solid #eef1f7; padding-left: .6rem; margin: .35rem 0; color: #324158; font-size: .95rem;`;
const ReplyComposer = styled.div`
  display: grid; gap: .5rem; margin-top: .5rem;
  textarea {
    width: 100%; min-height: 90px; resize: vertical; border: 1px solid #dfe3ee; border-radius: 10px; padding: .6rem .7rem; outline: none;
    &:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88,101,242,.12); }
  }
  .row { display: flex; gap: .5rem; justify-content: flex-end;
    button { border: none; border-radius: 10px; padding: .45rem .8rem; cursor: pointer; font-weight: 600; }
    .ghost { background: #eef3ff; color: #5865f2; }
    .primary { background: #5865f2; color: #fff; }
  }
`;

/* ---------- types ---------- */
type Post = {
  id: number;
  user: string;
  content: string;
  created_at: string;
  parent: number | null;
  parent_detail?: { id?: number; user?: string; content?: string } | null;
  likes_count: number;
  comments_count: number;
  liked?: boolean;
};

function mergeById(newList: Post[], prevList: Post[]) {
  const map = new Map<number, Post>();
  for (const p of [...newList, ...prevList]) map.set(p.id, p);
  // ordena por data desc para parecer feed
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/* ---------- component ---------- */
export default function Feed() {
  const { token, username: me } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [openThreadId, setOpenThreadId] = useState<number | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<number, Post[]>>({});
  const [loadingRepliesFor, setLoadingRepliesFor] = useState<number | null>(null);
  const [replyForId, setReplyForId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const onlyRepliesOf = (arr: Post[] | undefined, parentId: number) => {
    const pid = Number(parentId);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p: any) => {
        const parent = Number(p.parent ?? p.parent_detail?.id ?? -1);
        return parent === pid;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  function mergeById(newList: Post[], prevList: Post[]) {
    const map = new Map<number, Post>();
    for (const p of [...newList, ...prevList]) map.set(p.id, p);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const fetchPosts = useCallback(async () => {
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      let data: Post[] = [];

      // 1) PRIORIDADE: todos os tweets
      try {
        const r = await api.get<Post[]>("/posts/", { signal: abortRef.current.signal });
        data = Array.isArray(r.data) ? r.data : (r.data as any).results ?? [];
      } catch (e: any) {
        console.warn("Falha em /posts/ (todos). Tentando /posts/feed/…", e);
      }

      // 2) Fallback: feed personalizado (seguindo)
      if (!data.length) {
        try {
          const r2 = await api.get<Post[]>("/posts/feed/", { signal: abortRef.current.signal });
          data = Array.isArray(r2.data) ? r2.data : (r2.data as any).results ?? [];
        } catch { }
      }

      setPosts(curr => mergeById(data, curr));
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.message === "canceled") return;
      const msg = e?.response?.status
        ? `Erro ${e.response.status} ao carregar o feed.`
        : "Não foi possível carregar o feed.";
      setError(msg);
      console.error("Falha feed:", e);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchPosts();
    return () => {
      // cancela alguma requisição pendente quando desmontar
      abortRef.current?.abort();
    };
  }, [fetchPosts]);


  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") fetchPosts();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchPosts]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Confirma exclusão deste tweet?")) return;
    // otimista
    setPosts(prev => prev.filter(p => p.id !== id));
    try {
      await api.delete(`/posts/${id}/`);
    } catch (e: any) {
      // desfaz se falhar
      await fetchPosts();
      alert(e?.response?.status ? `Erro ${e.response.status} ao excluir.` : "Erro ao excluir o tweet.");
    }
  };

  const handleEdit = async (post: Post) => {
    const novo = window.prompt("Edite seu tweet:", post.content);
    if (novo == null) return;
    const value = novo.trim();
    if (!value || value === post.content) return;

    // otimista
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: value } : p));
    try {
      await api.patch(`/posts/${post.id}/`, { content: value });
    } catch (e: any) {
      await fetchPosts(); // restaura estado correto
      alert(e?.response?.status ? `Erro ${e.response.status} ao editar.` : "Erro ao editar o tweet.");
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    try {
      setPublishing(true);
      await api.post<Post>("/posts/", { content });
      setText("");
      await fetchPosts(); // garante sincronismo com a lista completa
    } catch (e: any) {
      alert(e?.response?.status ? `Erro ${e.response.status} ao publicar.` : "Erro ao publicar.");
    } finally {
      setPublishing(false);
    }
  };



  const handleLike = async (post: Post) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id ? { ...p, liked: !p.liked, likes_count: p.likes_count + (p.liked ? -1 : 1) } : p
      )
    );

    try {
      const { data } = await api.post(`/posts/${post.id}/like/`);
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? {
              ...p,
              liked: data?.liked ?? !post.liked,
              likes_count: data?.likes_count ?? post.likes_count + (post.liked ? -1 : 1),
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

  const loadReplies = async (parentId: number) => {
    setLoadingRepliesFor(parentId);
    try {
      let data: Post[] = [];

      try {
        const r = await api.get<Post[]>(`/posts/${parentId}/replies/`);
        data = onlyRepliesOf(r.data, parentId);
      } catch { }

      if (!data.length) {
        try {
          const r2 = await api.get<Post[]>(`/posts/?parent=${parentId}`);
          data = onlyRepliesOf(r2.data, parentId);
        } catch { }
      }

      if (!data.length) {
        try {
          const r3 = await api.get<Post[]>(`/posts/feed/`);
          data = onlyRepliesOf(r3.data, parentId);
        } catch { }
      }

      setRepliesMap(prev => ({ ...prev, [parentId]: data }));
    } finally {
      setLoadingRepliesFor(null);
    }
  };

  const toggleThread = (postId: number) => {
    if (openThreadId === postId) {
      setOpenThreadId(null);
      return;
    }
    setOpenThreadId(postId);
    if (!repliesMap[postId]) {
      void loadReplies(postId);
    }
  };

  const sendReply = async (parentId: number) => {
    const text = replyText.trim();
    if (!text) return;
    try {
      const { data } = await api.post<Post>("/posts/", { content: text, parent: parentId });
      setPosts(prev => prev.map(p => (p.id === parentId ? { ...p, comments_count: p.comments_count + 1 } : p)));
      setRepliesMap(prev => ({ ...prev, [parentId]: [data, ...(prev[parentId] ?? [])] }));
      setReplyText("");
      setReplyForId(null);
    } catch (e) {
      console.error("Falha ao responder:", e);
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
      <TitleRow>
        <Title>Feed</Title>
        {me && <BackBtn to={`/profile/${me}`}>Voltar ao perfil</BackBtn>}
      </TitleRow>

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
            {publishing ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </Composer>

      {loading && <p>Carregando posts…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && !error && posts.length === 0 && <p>Nenhum post por enquanto.</p>}

      {posts.map((post) => (
        <PostCard key={post.id}>
          {post.user === me && (
            <ActionBarIcons>
              <button onClick={() => handleEdit(post)} aria-label="Editar"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(post.id)} aria-label="Excluir"><Trash2 size={16} /></button>
            </ActionBarIcons>
          )}

          <PostHeader>
            <AuthorLink to={`/profile/${post.user}`}>@{post.user}</AuthorLink> · {new Date(post.created_at).toLocaleString("pt-BR")}
          </PostHeader>

          {!!post.parent_detail && (
            <PostContent style={{ fontStyle: "italic", color: "#666" }}>
              Retweet de <SoftLink to={`/profile/${post.parent_detail.user}`}>@{post.parent_detail.user}</SoftLink>: “{post.parent_detail.content}”
            </PostContent>
          )}

          <PostContent>{post.content}</PostContent>

          <ActionRow>
            <ActionBtn active={post.liked} onClick={() => handleLike(post)}>♥ {post.likes_count}</ActionBtn>
            <ActionBtn onClick={() => toggleThread(post.id)}>💬 {post.comments_count}</ActionBtn>
          </ActionRow>

          {openThreadId === post.id && (
            <RepliesBox>
              {loadingRepliesFor === post.id && <p>Carregando respostas…</p>}

              {!!repliesMap[post.id]?.length &&
                repliesMap[post.id].map((r) => (
                  <ReplyItem key={r.id}>
                    <strong>@{r.user}</strong> · {new Date(r.created_at).toLocaleString("pt-BR")}
                    <div>{r.content}</div>
                  </ReplyItem>
                ))}

              <ReplyComposer>
                <textarea
                  placeholder="Escreva uma resposta…"
                  value={replyForId === post.id ? replyText : ""}
                  onChange={(e) => {
                    setReplyForId(post.id);
                    setReplyText(e.target.value);
                  }}
                />
                <div className="row">
                  <button className="ghost" onClick={() => setOpenThreadId(null)} type="button">Fechar</button>
                  <button className="primary" type="button" onClick={() => sendReply(post.id)} disabled={!replyText.trim()}>Responder</button>
                </div>
              </ReplyComposer>
            </RepliesBox>
          )}
        </PostCard>
      ))}
    </Container>
  );
}
