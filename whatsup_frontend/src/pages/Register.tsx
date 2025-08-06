import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
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

const Button = styled.button`
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

// Componente Register
export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Limpa erro anterior

        try {
            // Altere a URL para o endpoint de registro do seu backend
            await axios.post("https://whatsup-backend-c00eef392a0f.herokuapp.com/api/register/", {
                username,
                password,
                email,
            });
            navigate("/login");
        } catch (err: any) {
            setError("Erro ao criar conta. Tente outro nome de usuário!");
        }
    };

    return (
        <Bg>
            <Card onSubmit={handleRegister}>
                <Title>Criar Conta</Title>
                <Label htmlFor="username">Usuário</Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="Seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <Label htmlFor="email">E-mail</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Label htmlFor="password">Senha</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <ErrorMsg>{error}</ErrorMsg>}
                <Button type="submit">Cadastrar</Button>
                <RegisterLink>
                    Já tem conta? <a href="/login">Entrar</a>
                </RegisterLink>
            </Card>
        </Bg>
    );
}
