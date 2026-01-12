import React, { useState, useRef, useEffect } from 'react'
import './HeroNews.css'

export default function BusSelector({ onSelect }){
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e){
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="bus-module" ref={ref}>
      <button className="btn btn-primary bus-module-toggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>Prati Autobus</button>

      {open && (
        <div className="bus-module-list" role="menu" aria-label="Lista autobusa">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className="btn bus-module-item"
              onClick={() => { onSelect?.(n); setOpen(false) }}
              aria-label={`Autobus ${n}`}
            >{n}</button>
          ))}
        </div>
      )}
    </div>
  )
}