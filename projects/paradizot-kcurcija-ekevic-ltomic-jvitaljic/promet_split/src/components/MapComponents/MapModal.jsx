import React, { useEffect } from 'react'
import './MapModal.css'
import MapBasic from './MapBasic'

export default function MapModal({ onClose, center = [43.5081, 16.4402], zoom = 13 }){
  useEffect(() => {
    function onKey(e){
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e)=>e.stopPropagation()}>
        <button className="map-modal-close" onClick={onClose} aria-label="Zatvori">×</button>
        <div className="map-modal-content">
          <MapBasic center={center} zoom={zoom} />
        </div>
      </div>
    </div>
  )
}