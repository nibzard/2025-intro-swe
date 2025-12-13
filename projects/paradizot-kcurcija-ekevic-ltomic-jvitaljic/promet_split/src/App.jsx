import React from 'react'
import Header from './components/Header'
import HeroNews from './components/HeroNews'
import NewsList from './components/NewsList'
import Footer from './components/Footer'
import './App.css'

export default function App(){
  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="content">
          <div className="main-section">
            <HeroNews />
            <NewsList />
          </div>
          <aside className="sidebar">
            <div className="card">
              <h3>Vozni red</h3>
              <p>Brzi prikaz linija i voznih redova (placeholder)</p>
            </div>
            <div className="card">
              <h3>Servisne informacije</h3>
              <ul>
                <li>PUTNE KARTE</li>
                <li>Obavijesti</li>
                <li>Kontakt</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}