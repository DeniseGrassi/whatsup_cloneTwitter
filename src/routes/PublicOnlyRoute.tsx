// src/routes/PublicOnlyRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  return isAuthenticated ? <Navigate to="/feed" replace /> : <>{children}</>;
}
