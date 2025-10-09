import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = { children: React.ReactElement };

export default function ProtectedRoute({ children }: Props) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // (ou um spinner)
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
}
