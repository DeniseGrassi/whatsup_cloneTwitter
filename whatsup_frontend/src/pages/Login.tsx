import React, { useContext, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 100vh;
  background: #f0f2f5;
`
const Card = styled.div`
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 400px;
`
const Title = styled.h2`
  margin: 0 0 1.5rem;
  text-align: center;
  color: #333;
`
const Field = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    color: #555;
  }
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s;
    &:focus {
      outline: none;
      border-color: #5865f2;
    }
  }
`

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #4a52c2;
  }
`

const ErrorMessage = styled.p`
  color: #d32f2f;
  text-align: center;
  margin-bottom: 1rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
`


export default function Login() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await login(username, password)
    navigate('/feed')
  } catch (err: any) {
    setError(err.message)
  }
}


  return (
    <Container>
      <Card>
          <Title>Entrar no WhatsUp!</Title>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <form onSubmit={handleSubmit}>
            <Field>
              <label>Usuário</label>
              <Input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Usuário"
                required
              />
            </Field>
            <Field>
              <label>Senha</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </Field>             
            <Button type="submit">Entrar</Button>
        </form>
      </Card>
    </Container>
  )
}