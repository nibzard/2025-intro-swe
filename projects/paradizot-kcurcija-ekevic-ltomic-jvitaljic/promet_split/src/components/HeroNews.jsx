import React, { useState } from 'react'
import './HeroNews.css'
import MapModal from './MapComponents/MapModal'
import BusSelector from './BusSelector'

export default function HeroNews(){
  const [open, setOpen] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)  // stores which bus (1-10) was chosen


  return (
    <section className="hero-news">
      <h2>INTERAKTIVNA KARTA AUTOBUSA</h2>
      <p>Lokacije autobusnih stanica te pozicije autobusa u stvarnom vremenu...</p>
      <div className="hero-actions">
        <BusSelector onSelect={(n)=> setSelectedBus(n)} />

        {/* optional status - remove if you don't want this text */}
        {selectedBus && <div className="selected-bus">Prati: {selectedBus}</div>}

        <button className="btn btn-ghost" onClick={()=>setOpen(true)}>Pogledaj Kartu</button>
      </div>

      {open && <MapModal onClose={()=>setOpen(false)} />}
    </section>
  )
}