import React, { useState } from 'react'
import './Messages.css'

export default function Messages(){
  const [messages, setMessages] = useState([
    { id: 1, from: 'System', text: 'OIB check: This is a system message.' },
    { id: 2, from: 'Korisnik', text: 'Thanks for improving the timetables!' }
  ])
  const [value, setValue] = useState('')

  function sendMessage(e){
    e.preventDefault()
    if (!value.trim()) return
    setMessages(prev => [...prev, { id: Date.now(), from: 'Me', text: value }])
    setValue('')
  }

  return (
    <div className="messages-card card">
      <h3>Poruke</h3>
      <div className="messages-list">
        {messages.map(m => (
          <div key={m.id} className="message">
            <strong>{m.from}:</strong>
            <span>{m.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="message-form">
        <input placeholder="Napiši poruku..." value={value} onChange={e=>setValue(e.target.value)} />
        <button type="submit">Pošalji</button>
      </form>
    </div>
  )
}
