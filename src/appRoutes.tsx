import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import { useAuth } from "./context/AuthContext";


function RootRedirect() {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />;
}

// function MeRedirect() {
//   const { token, username } = useAuth();
//   if (!token) return <Navigate to="/login" replace />;
//   return <Navigate to={`/profile/${username}`} replace />;
// }

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* raiz decide pra onde ir */}
        <Route path="/" element={<RootRedirect />} />

        {/* público somente quando deslogado */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

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
          path="/profile/:username?"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}