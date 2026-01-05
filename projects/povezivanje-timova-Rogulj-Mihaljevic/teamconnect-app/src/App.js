import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import CreateTeam from './pages/CreateTeam';
import MyTeams from './pages/MyTeams';
import Profile from './pages/Profile';
import ActivityFeed from './pages/ActivityFeed';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import TournamentRegister from './pages/TournamentRegister';
import RatingSystem from './pages/RatingSystem';
import TeamChat from './pages/TeamChat';
import FieldMap from './pages/FieldMap';
import MatchTracker from './pages/MatchTracker';
import Friends from './pages/Friends';
import Statistics from './pages/Statistics';
import EventTicketing from './pages/EventTicketing';
import LoyaltyRewards from './pages/LoyaltyRewards';
import VideoHighlights from './pages/VideoHighlights';
import './App.css';

function App() {
  const token = localStorage.getItem('token');
  
  const PrivateRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile-setup" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/create-team" element={<PrivateRoute><CreateTeam /></PrivateRoute>} />
          <Route path="/my-teams" element={<PrivateRoute><MyTeams /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/activity" element={<PrivateRoute><ActivityFeed /></PrivateRoute>} />
          
          {/* Turniri */}
          <Route path="/tournaments" element={<PrivateRoute><Tournaments /></PrivateRoute>} />
          <Route path="/tournament/:id" element={<PrivateRoute><TournamentDetail /></PrivateRoute>} />
          <Route path="/tournament/:id/register" element={<PrivateRoute><TournamentRegister /></PrivateRoute>} />
          
          {/* Rating System */}
          <Route path="/ratings" element={<PrivateRoute><RatingSystem /></PrivateRoute>} />
          
          {/* Team Chat */}
          <Route path="/team/:teamId/chat" element={<PrivateRoute><TeamChat /></PrivateRoute>} />
          
          {/* Field Map */}
          <Route path="/fields" element={<PrivateRoute><FieldMap /></PrivateRoute>} />
          
          {/* Match Tracker */}
          <Route path="/match/:matchId" element={<PrivateRoute><MatchTracker /></PrivateRoute>} />
          
          {/* Friends & Rivals */}
          <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
          
          {/* Statistics */}
          <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
          
          {/* Event Ticketing */}
          <Route path="/events" element={<PrivateRoute><EventTicketing /></PrivateRoute>} />
          
          {/* Loyalty Rewards */}
          <Route path="/rewards" element={<PrivateRoute><LoyaltyRewards /></PrivateRoute>} />
          
          {/* Video Highlights */}
          <Route path="/highlights" element={<PrivateRoute><VideoHighlights /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;