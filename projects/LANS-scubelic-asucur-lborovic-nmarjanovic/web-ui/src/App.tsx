import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ThemeToggler from './components/ThemeToggler';

function App() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthProvider>
      <div className={`app ${theme}`}>
        <ThemeToggler theme={theme} toggleTheme={toggleTheme} />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage theme={theme} />} />
            <Route path="/login" element={<LoginPage theme={theme} />} />
            <Route path="/register" element={<RegisterPage theme={theme} />} />

            {/* Protected routes */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Dashboard theme={theme} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage theme={theme} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
