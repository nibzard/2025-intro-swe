import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Wallet from './pages/Wallet';
import Tickets from './pages/Tickets';
import MapPage from './pages/Map';
import TrackingPage from './pages/Tracking';
import Profile from './pages/Profile';
import { UserProvider } from './context/UserContext';
import { WalletProvider } from './context/WalletContext';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <WalletProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Wallet />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="map" element={<MapPage />} />
              <Route path="tracking" element={<TrackingPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </WalletProvider>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
