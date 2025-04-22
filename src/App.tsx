import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { getCurrentUser, logout } from "./services/authService";
import { Button } from "./components/ui/button";
import { Loader2 } from "lucide-react";

// Lazy load components for better performance
const CustomerPortal = lazy(() => import("./pages/CustomerPortal"));
const DocumentList = lazy(() => import("./pages/DocumentList"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));

interface UserState {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
);

function App() {
  const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    // Initialize user state from localStorage
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Listen for storage events to sync user state across tabs
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };

    // Listen for custom auth state change events
    const handleAuthChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChange", handleAuthChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChange", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gray-800 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex gap-6">
              {user ? (
                <>
                  <Link
                    to="/"
                    className="hover:text-gray-300 transition-colors"
                  >
                    Submit Document
                  </Link>
                  <Link
                    to="/documents"
                    className="hover:text-gray-300 transition-colors"
                  >
                    View Documents
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hover:text-gray-300 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="hover:text-gray-300 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm">Welcome, {user.user.username}</span>
                <Button onClick={handleLogout} variant="destructive" size="sm">
                  Logout
                </Button>
              </div>
            )}
          </div>
        </nav>

        <main className="container mx-auto py-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <CustomerPortal />
                  </PrivateRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <PrivateRoute>
                    <DocumentList />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
