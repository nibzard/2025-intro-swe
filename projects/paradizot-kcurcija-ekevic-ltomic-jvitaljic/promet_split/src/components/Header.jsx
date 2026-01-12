import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

export default function Header(){
  return (
    <header className="site-header">
      <div className="top-bar">
        <div className="container bar-inner">
          <div className="contact">
            <span>021 407 888</span>
            <a href="mailto:promet@promet-split.hr">promet@promet-split.hr</a>
          </div>
          <div className="lang">
            <a>hr</a>
            <a>en</a>
          </div>
        </div>
      </div>
      <div className="main-header container">
        <div className="logo">Promet Split</div>
        <nav className="nav">
          <ul>
            <li><Link to="/">Naslovna</Link></li>
            <li><Link to="/tickets">Naruči kartu</Link></li>
            <li><Link to="/network">Mreža</Link></li>
            <li><Link to="/map">Karta</Link></li>
            <li><Link to="/profile">Profil</Link></li>
            <li><Link to="/messages">Poruke</Link></li>
            <li><Link to="/contact">Kontakt</Link></li>
          </ul>
        </nav>
        <button className="menu-btn">Izbornik</button>
      </div>
    </header>
  )
}