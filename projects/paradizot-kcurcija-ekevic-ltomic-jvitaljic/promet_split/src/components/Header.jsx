import React from 'react'
import './Header.css'

export default function Header(){
  return (
    <header>
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
            <li>Naslovna</li>
            <li>Vozni red</li>
            <li>Linije</li>
            <li>Cjenik</li>
            <li>Obavijesti</li>
            <li>Usluge</li>
            <li>Kontakt</li>
          </ul>
        </nav>
        <button className="menu-btn">Izbornik</button>
      </div>
    </header>
  )
}