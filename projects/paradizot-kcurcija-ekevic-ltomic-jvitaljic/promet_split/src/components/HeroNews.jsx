import React, { useState } from 'react'
import './HeroNews.css'
import MapModal from './MapComponents/MapModal'

export default function HeroNews(){
  const [open, setOpen] = useState(false)

  return (
    <section className="hero-news">
      <h2>INTERAKTIVNA KARTA AUTOBUSA</h2>
      <p>Lokacije autobusnih stanica te pozicije autobusa u stvarnom vremenu...</p>
      <div className="hero-actions">
        <a className="btn btn-primary" href="#">Prati Autobus</a>
        <button className="btn btn-ghost" onClick={()=>setOpen(true)}>Pogledaj Kartu</button>
      </div>

      {open && <MapModal onClose={()=>setOpen(false)} />}
    </section>
  )
}