import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api, { resolveMediaUrl } from "../services/api";
import { Link } from "react-router-dom";
import fotoAvatar from "../foto_avatar.avif";

const Page = styled.div`max-width: 720px; margin: 2rem auto; padding: 0 1rem;`;
const Card = styled.div`background:#fff; border:1px solid #e9edf5; border-radius:12px; padding:1rem;`;
const Row = styled.div`display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.6rem 0; border-bottom:1px solid #f2f4fa; &:last-child{border-bottom:0}`;
const Left = styled.div`display:flex; align-items:center; gap:.75rem;`;
const Avatar = styled.img`  width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;`;
const Btn = styled.button`background:#5865f2; color:#fff; border:none; border-radius:8px; padding:.45rem .8rem; cursor:pointer;`;

type Mini = { username: string; photo: string | null };

const SUGGESTED_PATH = "/profile/suggested/";

export default function Explore() {
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
        await api.post(`/profile/${u}/follow/`);
        setUsers(prev => prev.filter(x => x.username !== u)); // remove da lista
    };

    return (
        <Page>
            <h2>Explorar pessoas</h2>
            <Card>
                {loading && <p>Carregando…</p>}
                {err && <p style={{ color: "crimson" }}>{err}</p>}
                {!loading && !err && users.length === 0 && <p>Nenhuma sugestão no momento.</p>}

                {users.map(u => (
                    <Row key={u.username}>
                        <Left>
                            <Avatar
                                loading="lazy"
                                src={u.photo ? resolveMediaUrl(u.photo)! : fotoAvatar}
                                alt=""
                                onError={(ev) => {
                                    const img = ev.currentTarget;
                                    // evita loop de onError: seta uma vez e remove o handler
                                    if (img.src !== fotoAvatar) {
                                        img.onerror = null;
                                        img.src = fotoAvatar;
                                    }
                                }}
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
