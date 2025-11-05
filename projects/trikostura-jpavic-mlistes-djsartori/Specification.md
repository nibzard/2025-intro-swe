---
config:
  layout: dagre
---
flowchart TB
    Student(("Student")) --> UC1["Registracija"] & UC2["Prijava"] & UC3["Pregled tema"] & UC4["Kreiranje nove teme"] & UC5["Odgovaranje na teme"] & UC6["Pretraga foruma"] & UC7["Uređivanje profila"]
    Admin(("Admin")) --> UC2 & UC12["Upravljanje korisnicima"] & UC14["Upravljanje kategorijama"] & UC15["Pregled statistike"]
