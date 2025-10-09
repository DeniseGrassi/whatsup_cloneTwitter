// src/appRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Home -> força login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/explore" element={<Explore />} />

      {/* Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile/:username" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
