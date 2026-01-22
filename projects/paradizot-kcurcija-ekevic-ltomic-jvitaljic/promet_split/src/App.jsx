import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Wallet from './pages/Wallet';
import Tickets from './pages/Tickets';
import MapPage from './pages/Map';
import Profile from './pages/Profile';
import { WalletProvider } from './context/WalletContext';

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Wallet />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="map" element={<MapPage />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  )
}

export default App
