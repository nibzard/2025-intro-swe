import React from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const path = window.location.pathname;

  if (path === '/login') {
    return <Login />;
  }
  
  if (path === '/dashboard') {
    return <Dashboard />;
  }

  return <Register />;
}

export default App;