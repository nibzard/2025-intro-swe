import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import FAQPage from './pages/FAQPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import SetupWizard from './pages/SetupWizard';
import ThemeToggler from './components/ThemeToggler';

import { ToastProvider } from './context/ToastContext';

function App() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <div className={`app ${theme}`}>
          <ThemeToggler theme={theme} toggleTheme={toggleTheme} />
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage theme={theme} />} />
              <Route path="/faq" element={<FAQPage theme={theme} />} />
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
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage theme={theme} />
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
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <SetupWizard theme={theme} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage theme={theme} toggleTheme={toggleTheme} />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
