import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CheckEmailPage from "./pages/CheckEmailPage.jsx";
import SetPasswordPage from "./pages/SetPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import WalletPage from "./pages/WalletPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import "./App.css";

function PrivateRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth — sin navbar */}
        <Route path="/login"                 element={<LoginPage />} />
        <Route path="/registro"              element={<RegisterPage />} />
        <Route path="/revisa-correo"         element={<CheckEmailPage />} />
        <Route path="/establecer-contrasena" element={<SetPasswordPage />} />

        {/* App — con navbar */}
        <Route element={<Layout />}>
          <Route element={<PrivateRoute />}>
            <Route index          element={<HomePage />} />
            <Route path="recompensas" element={<WalletPage />} />
            <Route path="perfil"      element={<ProfilePage />} />
          </Route>
          <Route element={<PrivateRoute adminOnly />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
