import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = { children: React.ReactElement };

export default function PublicOnlyRoute({ children }: Props) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/feed" replace /> : children;
}
