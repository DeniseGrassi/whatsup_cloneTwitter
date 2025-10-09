import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api"; // <- ajuste o caminho caso seu arquivo esteja em /src/pages

const Bg = styled.div`
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.form`
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 380px;
  width: 100%;
`;

const Title = styled.h2`
  margin-bottom: 10px;
  font-weight: 700;
  text-align: center;
  color: #22223b;
`;

const Label = styled.label`
  font-size: 0.98rem;
  color: #343a40;
  margin-top: 6px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #cdd0d4;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  margin-bottom: 5px;

  &:focus {
    border-color: #5b6dfa;
    background: #f0f4ff;
  }
`;

const Button = styled.button<{ $loading?: boolean }>`
  background: #5b6dfa;
  color: #fff;
  font-weight: 600;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 1.1rem;
  margin-top: 6px;
  cursor: pointer;
  transition: background 0.2s;
  opacity: ${({ $loading }) => ($loading ? 0.85 : 1)};
  pointer-events: ${({ $loading }) => ($loading ? "none" : "auto")};

  &:hover {
    background: #3f4bb8;
  }
`;

const ErrorMsg = styled.p`
  color: #d7263d;
  margin: 0;
  font-size: 0.98rem;
  text-align: center;
`;

const RegisterLink = styled.p`
  text-align: center;
  margin-top: 6px;
  font-size: 0.99rem;

  a {
    color: #5b6dfa;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

type RegisterResponse = { token: string };

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalized = username.trim().replace(/\s+/g, "_");
    const validUserRe = /^[\w.@+-]+$/;

    if (!validUserRe.test(normalized)) {
      setError(
        "Usuário inválido. Use apenas letras, números e @ . + - _ (sem espaços)."
      );
      return;
    }

    if (!email.trim()) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (!password) {
      setError("Informe a senha.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem!");
      return;
    }

    try {
      setLoading(true);

      // Enviamos password e password2 (teu backend aceita qualquer formato)
      const r = await api.post<RegisterResponse>("/register/", {
        username: normalized,
        email: email.trim(),
        password,
        password2: confirmPassword,
      });

      // sucesso: já loga
      localStorage.setItem("token", r.data.token);
      localStorage.setItem("username", normalized);
      // se tiver AuthContext com updateUsername, opcional:
      try { (window as any).dispatchEvent(new Event("auth-updated")) } catch { }
      // vai para o perfil do novo usuário:
      navigate(`/profile/${normalized}`);
    } catch (err: any) {
      const data = err?.response?.data || {};
      const pick = (v: any) =>
        Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : "";

      const msg =
        pick(data.detail) ||
        pick(data.non_field_errors) ||
        pick(data.username) ||
        pick(data.email) ||
        pick(data.password2) ||
        pick(data.password) ||
        "Erro ao criar conta. Tente novamente.";

      if (msg) setError(msg);
      else if (err?.message?.includes("Network Error"))
        setError("Falha de rede/CORS. Confira o backend e a base URL.");
      else setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Bg>
      <Card onSubmit={handleRegister} noValidate>
        <Title>Criar Conta</Title>

        <Label htmlFor="username">Usuário</Label>
        <Input
          id="username"
          type="text"
          placeholder="Seu usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />

        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Button type="submit" $loading={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </Button>

        <RegisterLink>
          Já tem conta? <Link to="/login">Entrar</Link>
        </RegisterLink>
      </Card>
    </Bg>
  );
}
