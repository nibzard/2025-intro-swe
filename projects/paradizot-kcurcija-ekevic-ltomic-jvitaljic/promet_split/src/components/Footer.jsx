import React from 'react'
import './Footer.css'

export default function Footer(){
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <h4>Kontakt</h4>
          <p>021 407 888</p>
          <p>promet@promet-split.hr</p>
        </div>
        <div>
          <h4>Linkovi</h4>
          <ul>
            <li>Vozni red</li>
            <li>Linije</li>
            <li>Obavijesti</li>
          </ul>
        </div>
        <div>
          <h4>Adresa</h4>
          <p>Split, Croatia</p>
        </div>
      </div>
    </footer>
  )
}