import React from 'react'
import './NewsList.css'

const sample = [
  { date: '5. prosinca 2025.', title: 'OBAVIJEST ZA PUTNIKE NA LINIJI BR.33' },
  { date: '21. studenog 2025.', title: 'OBAVIJEST ZA PUTNIKE NA AUTOBUSNOJ LINIJI BR. 26' },
  { date: '14. studenog 2025.', title: 'OBAVIJEST ZA PUTNIKE NA LINIJAMA BR.13 i BR.15' }
]

export default function NewsList(){
  return (
    <section className="news-list">
      <h3>Novosti i Obavijesti</h3>
      {sample.map((n,i)=>(
        <article key={i} className="news-item">
          <div className="news-date">{n.date}</div>
          <h4>{n.title}</h4>
          <a className="btn btn-ghost" href="#">Pročitaj više</a>
        </article>
      ))}
      <div className="more-news">
        <a className="btn" href="#">Više novosti</a>
      </div>
    </section>
  )
}