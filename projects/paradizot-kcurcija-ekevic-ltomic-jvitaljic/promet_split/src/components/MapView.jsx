import React from 'react'
import './MapView.css'
import MapBasic from './MapComponents/MapBasic'

export default function MapView(){
  return (
    <div className="map-page card">
      <h2>Interaktivna karta</h2>
      <p>Prikaz stvarne karte (Leaflet).</p>
      <div className="map-box" style={{ height: '400px' }}>
        <MapBasic />
      </div>
    </div>
  )
}
