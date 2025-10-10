import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ---------- estilos ----------
const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f3f4f8;
`;
const Card = styled.form`
  width: 100%;
  max-width: 460px;
  background: #fff;
  border: 1px solid #e7e7ef;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(20, 22, 50, 0.06);
`;
const Title = styled.h1`
  font-size: 20px;
  margin: 0 0 16px;
  text-align: center;
  color: #1f2a44;
`;
const Label = styled.label`
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #5b667e;
  margin-bottom: 10px;
`;
const Input = styled.input`
  height: 40px;
  border: 1px solid #dfe3ee;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  outline: none;
  &:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  }
`;
const Button = styled.button`
  width: 100%;
  height: 42px;
  border: 0;
  border-radius: 10px;
  background: #7c3aed;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const ErrorBox = styled.div`
  background: #fdecee;
  color: #b42318;
  border: 1px solid #f3b4b9;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  margin-bottom: 12px;
`;

// ---------- componente ----------
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname as string | undefined;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const uname = await login(username, password); // agora retorna string | null
      if (!uname) throw new Error("Credenciais inválidas");

      // se veio de rota protegida, respeita; senão, perfil do próprio usuário
      const to = (from && from !== "/login") ? from : `/profile/${uname}`;
      navigate(to, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Credenciais inválidas";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Card onSubmit={handleSubmit}>
        <Title>Entrar no WhatsUp!</Title>

        {error && <ErrorBox>{error}</ErrorBox>}

        <Label>
          Usuário
          <Input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Seu usuário ou e-mail"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </Label>

        <Label>
          Senha
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Sua senha"
          />
        </Label>

        <Button type="submit" disabled={busy || !username || !password}>
          {busy ? "Entrando..." : "Entrar"}
        </Button>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>
          Não tem conta? <Link to="/register">Crie uma agora!</Link>
        </div>
      </Card>
    </Page>
  );
}
