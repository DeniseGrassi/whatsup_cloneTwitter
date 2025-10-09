import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { token } = useAuth() as any; // tipa conforme seu contexto
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: "unauthenticated" }} />;
  }
  return <Outlet />;
}
