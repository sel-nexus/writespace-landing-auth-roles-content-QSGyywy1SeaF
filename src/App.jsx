import {
  useEffect,
  useState,
} from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicNavbar from './components/PublicNavbar';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ReadBlog from './pages/ReadBlog';
import RegisterPage from './pages/RegisterPage';
import UserManagement from './pages/UserManagement';
import WriteBlog from './pages/WriteBlog';
import { getSession } from './utils/auth';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

function AppShell() {
  const location = useLocation();
  const [session, setSession] = useState(() => getSession());
  const usesPublicNavigation = PUBLIC_PATHS.has(location.pathname);

  useEffect(() => {
    setSession(getSession());
  }, [location.pathname]);

  const handleLogout = () => {
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {session && !usesPublicNavigation ? (
        <Navbar onLogout={handleLogout} session={session} />
      ) : (
        <PublicNavbar session={session} />
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/blogs"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog/:id"
          element={
            <ProtectedRoute>
              <ReadBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/write"
          element={
            <ProtectedRoute>
              <WriteBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <WriteBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute role="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}