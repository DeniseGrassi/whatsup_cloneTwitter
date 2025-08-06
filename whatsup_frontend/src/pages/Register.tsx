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


export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // novo estado
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("As senhas não conferem!");
            return;
        }

        try {
            await axios.post("https://whatsup-backend-c00eef392a0f.herokuapp.com/api/register/", {
                username,
                email,
                password,
                password2: confirmPassword,
            });
            navigate("/login");
        } catch (err: any) {
            // Mostra o erro retornado do backend (se existir), senão mensagem genérica
            if (err.response && err.response.data) {
                if (err.response.data.username) {
                    setError("Nome de usuário já existe.");
                } else if (err.response.data.email) {
                    setError("Este e-mail já está cadastrado.");
                } else if (err.response.data.password) {
                    setError(err.response.data.password.join(" "));
                } else {
                    setError("Erro ao criar conta. Tente outro nome de usuário!");
                }
            } else {
                setError("Erro ao criar conta. Tente outro nome de usuário!");
            }
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
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
