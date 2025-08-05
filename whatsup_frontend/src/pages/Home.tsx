// src/pages/Home.tsx
import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #0077ff 0%, #00d4ff 100%);
  color: #fff;
  text-align: center;
  padding: 2rem;
`

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 0.5rem;
`

const Subtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
`

const Button = styled(Link)`
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #fff;
  color: #0077ff;
  font-weight: bold;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #f0f0f0;
  }
`

export default function Home() {
  return (
    <Container>
      <Title>WhatsUp!</Title>
      <Subtitle>
        Conecte‑se com seus amigos e compartilhe momentos em tempo real.
      </Subtitle>
      <Button to="/login">Entrar / Criar Conta</Button>
    </Container>
  )
}
