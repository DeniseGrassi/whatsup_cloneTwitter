
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const auth: any = useAuth();                 
  const token: string | null = auth?.token ?? null;
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, reason: "unauthenticated" }}
      />
    );
  }
  return <Outlet />;
}
