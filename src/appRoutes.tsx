import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// redireciona o usuário logado para o próprio perfil
function MeRedirect() {
  const { token, username } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${username}`} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* público */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* raiz -> feed */}
        <Route path="/" element={<Navigate to="/feed" replace />} />

        {/* protegido */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* meu perfil direto */}
        <Route path="/me" element={<MeRedirect />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
