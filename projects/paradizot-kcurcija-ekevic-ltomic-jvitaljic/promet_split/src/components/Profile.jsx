import React, { useState } from 'react'
import './Profile.css'

export default function Profile(){
  const [profile, setProfile] = useState({ name: 'Marko', email: 'marko@example.com', phone: '091 555 111' })
  const [editing, setEditing] = useState(false)
  function updateField(e){ setProfile({ ...profile, [e.target.name]: e.target.value }) }
  return (
    <div className="profile-card card">
      <h2>Profil</h2>
      {editing ? (
        <div className="profile-edit">
          <label>Ime</label>
          <input name="name" value={profile.name} onChange={updateField} />
          <label>Email</label>
          <input name="email" value={profile.email} onChange={updateField} />
          <label>Telefon</label>
          <input name="phone" value={profile.phone} onChange={updateField} />
          <button onClick={()=>setEditing(false)}>Spremi</button>
        </div>
      ) : (
        <div className="profile-view">
          <p><strong>Ime:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Telefon:</strong> {profile.phone}</p>
          <button onClick={()=>setEditing(true)}>Uredi</button>
        </div>
      )}
    </div>
  )
}
