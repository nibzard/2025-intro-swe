import React from 'react'
import './Contact.css'

export default function Contact(){
  return (
    <div className="card contact-card">
      <h3>Kontakt</h3>
      <p><strong>Adresa:</strong> Ulica Bana Jelačića 5, Split</p>
      <p><strong>Telefon:</strong> 021 407 888</p>
      <p><strong>Email:</strong> promet@promet-split.hr</p>
      <h4>Radno vrijeme</h4>
      <p>Pon-Pet: 08:00 - 16:00</p>
      <p>Sub: 09:00 - 12:00</p>
      <div className="contact-desc">Opis: Ovo je kontakt sekcija s informacijama o poslovnici. Umjesto slika dodana je kratka deskripcija.</div>
    </div>
  )
}
