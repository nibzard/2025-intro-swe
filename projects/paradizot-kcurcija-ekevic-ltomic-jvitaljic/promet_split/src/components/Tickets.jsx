import React, { useState } from 'react'
import './Tickets.css'

const TICKET_TYPES = [
  { id: 'single', name: 'Pojedinačna karta', price: 10 },
  { id: 'daily', name: 'Dnevna karta', price: 25 },
  { id: 'monthly', name: 'Mjesečna karta', price: 250 }
]

export default function Tickets(){
  const [ticket, setTicket] = useState(TICKET_TYPES[0].id)
  const [qty, setQty] = useState(1)

  const selected = TICKET_TYPES.find(t => t.id === ticket)
  const total = selected.price * qty

  return (
    <div className="tickets-page">
      <div className="card">
        <h2>Naručivanje / Plaćanje karata</h2>
        <p>Ovdje možete odabrati tip karte i simulirati narudžbu.</p>
        <div className="ticket-form">
          <label>Tip karte</label>
          <select value={ticket} onChange={e=>setTicket(e.target.value)}>
            {TICKET_TYPES.map(t=> <option key={t.id} value={t.id}>{t.name} — {t.price} HRK</option>)}
          </select>
          <label>Količina</label>
          <input type="number" min="1" value={qty} onChange={e=>setQty(Number(e.target.value))} />
          <div className="total">Ukupno: <strong>{total} HRK</strong></div>
          <button onClick={()=>alert('Simulirano plaćanje: ' + total + ' HRK')}>Plati</button>
        </div>
      </div>
      <div className="card">
        <h3>Opis mjesta kupnje karata</h3>
        <p>Naši partneri: kiosci, online, automat na stajalištu (placeholder deskripcija).</p>
      </div>
    </div>
  )
}
