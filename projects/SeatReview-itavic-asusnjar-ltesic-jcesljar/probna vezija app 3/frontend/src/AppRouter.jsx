import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import Register from "./Register";
import Verification from "./Verification";
import Profile from "./Profile";
import App from "./App";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AuthFlow() {
  const [view, setView] = useState("login"); // login | register | verify
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleNeedVerification = (email, code) => {
    setVerificationEmail(email);
    setVerificationCode(code); // For testing without email
    setView("verify");
  };

  const handleVerified = () => {
    setView("login");
  };

  if (view === "verify") {
    return (
      <Verification
        email={verificationEmail}
        testCode={verificationCode}
        onVerified={handleVerified}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        onSwitchToLogin={() => setView("login")}
        onNeedVerification={handleNeedVerification}
      />
    );
  }

  return <Login onSwitchToRegister={() => setView("register")} />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthFlow />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
