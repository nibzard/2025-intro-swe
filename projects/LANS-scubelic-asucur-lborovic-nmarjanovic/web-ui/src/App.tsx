import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { useState } from 'react';
import ThemeToggler from './components/ThemeToggler';

function App() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`app ${theme}`}>
      <ThemeToggler theme={theme} toggleTheme={toggleTheme} />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage theme={theme} />} />
          <Route path="/app" element={<Dashboard theme={theme} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
