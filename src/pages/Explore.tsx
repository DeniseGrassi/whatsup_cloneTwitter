import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api, { resolveMediaUrl } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import fotoAvatar from "../foto_avatar.avif";

/* ====== UI ====== */
const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;
`;
const Title = styled.h2` margin: 0; `;
const Page = styled.div` max-width: 720px; margin: 2rem auto; padding: 0 1rem; `;
const Card = styled.div` background: #fff; border: 1px solid #e9edf5; border-radius: 12px; padding: 1rem; `;
const Row = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: .75rem;
  padding: .6rem 0; border-bottom: 1px solid #f2f4fa;
  &:last-child { border-bottom: 0; }
`;
const Left = styled.div` display: flex; align-items: center; gap: .75rem; `;
const Avatar = styled.img`
  width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
`;
const Btn = styled.button<{ variant?: "ghost" | "primary" }>`
  background: ${({ variant }) => (variant === "ghost" ? "transparent" : "#5865f2")};
  color: ${({ variant }) => (variant === "ghost" ? "#5865f2" : "#fff")};
  border: 1px solid #5865f2; border-radius: 8px;
  padding: .45rem .8rem; cursor: pointer;
`;

/* ====== Types ====== */
type Mini = { username: string; photo: string | null };

/* ====== Consts ====== */
const SUGGESTED_PATH = "/profile/suggested/";

/* ====== Component ====== */
export default function Explore() {
  const { username: me } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<Mini[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setErr(null);
      try {
        const { data } = await api.get<Mini[]>(SUGGESTED_PATH);
        setUsers(data);
      } catch (e: any) {
        setErr(e?.response?.status ? `Erro ${e.response.status}` : "Falha ao carregar sugestões");
        console.error("GET", SUGGESTED_PATH, "falhou:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

const follow = async (u: string) => {
  try {
    // body vazio + content-type ajuda em DRF
    const r = await api.post(
      `/profile/${encodeURIComponent(u)}/follow/`,
      {}, // algumas views do DRF rejeitam POST sem body
      { headers: { "Content-Type": "application/json" } }
    );

    // Sinais de sucesso
    const ok = (r.status >= 200 && r.status < 300) || r.data?.is_following === true;
    if (ok) {
      setUsers(prev => prev.filter(x => x.username !== u)); // agora sim
      return;
    }

    alert(`Não foi possível seguir agora. (${r.status})`);
    console.warn("FOLLOW unexpected response:", r);
  } catch (e: any) {
    const status = e?.response?.status;
    const detail =
      e?.response?.data?.detail ||
      e?.response?.data?.error ||
      e?.message ||
      "erro desconhecido";
    alert(`Não foi possível seguir agora. (${status}) ${detail}`);
    console.error("POST /follow falhou:", e);
  }
};


  const avatarSrc = (p?: string | null) => resolveMediaUrl(p) || fotoAvatar;

  return (
    <Page>
      <Header>
        <Title>Explorar pessoas</Title>
        <Btn
          variant="ghost"
          onClick={() => (me ? navigate(`/profile/${me}`) : navigate("/feed"))}
        >
          Voltar ao perfil
        </Btn>
      </Header>

      <Card>
        {loading && <p>Carregando…</p>}
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {!loading && !err && users.length === 0 && <p>Nenhuma sugestão no momento.</p>}

        {users.map(u => (
          <Row key={u.username}>
            <Left>
              <Avatar
                src={avatarSrc(u.photo)}
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = fotoAvatar;
                }}
                alt=""
              />
              <Link to={`/profile/${u.username}`}>@{u.username}</Link>
            </Left>
            <Btn onClick={() => follow(u.username)}>Seguir</Btn>
          </Row>
        ))}
      </Card>
    </Page>
  );
}
