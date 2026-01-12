import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HeroNews from './components/HeroNews'
import NewsList from './components/NewsList'
import Footer from './components/Footer'
import Messages from './components/Messages'
import Contact from './components/Contact'
import Tickets from './components/Tickets'
import TicketNetwork from './components/TicketNetwork'
import Profile from './components/Profile'
import MapView from './components/MapView'
import './App.css'
import 'leaflet/dist/leaflet.css';

export default function App(){
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main">
          <div className="container">
            <div className="content">
              <div className="main-section">
                <Routes>
                  <Route path="/" element={<><HeroNews /><NewsList /></>} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/network" element={<TicketNetwork />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/messages" element={<Messages />} />
                </Routes>
              </div>
              <aside className="sidebar">
                <Messages />
                <Contact />
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}