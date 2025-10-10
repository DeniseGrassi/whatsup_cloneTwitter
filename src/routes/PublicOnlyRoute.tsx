// src/routes/PublicOnlyRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  return token ? <Navigate to={username ? `/profile/${username}` : "/profile/me"} replace /> : <>{children}</>;
}
