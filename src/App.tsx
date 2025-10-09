import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./appRoutes";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
