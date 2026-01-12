import React from 'react'
import './TicketNetwork.css'

const LOCATIONS = [
  { id: 1, name: 'Kiosk Jelacic', address: 'Trg Jelacic 1', desc: 'Prodaja karata i dnevnih karti' },
  { id: 2, name: 'Autobusni kolodvor', address: 'Kolodvorska 3', desc: 'Glavna prodajna mjesta' },
  { id: 3, name: 'Online', address: 'web', desc: 'Kupnja preko aplikacije (placeholder)' }
]

export default function TicketNetwork(){
  return (
    <div className="ticket-network">
      <div className="card">
        <h2>Mreža prodajnih mjesta</h2>
        <p>Popis partnera gdje možete kupiti karte.</p>
        <ul>
          {LOCATIONS.map(l => (
            <li key={l.id}>
              <strong>{l.name}</strong> — {l.address} — {l.desc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
