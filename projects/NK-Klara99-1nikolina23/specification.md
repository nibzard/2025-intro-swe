# Trip Planner – Aplikacija za planiranje i organiziranje putovanja

## 📝 Opis projekta
Trip Planner je interaktivna aplikacija koja korisnicima omogućuje jednostavno planiranje i organizaciju putovanja prema vlastitim željama i preferencijama. Korisnici mogu odabrati destinaciju i datume putovanja, odrediti budžet te odabrati aktivnosti, smještaj i prijevoz.

Aplikacija uključuje **chat bota / agenta** koji:  
• Daje preporuke aktivnosti i smještaja  
• Optimizira raspored i troškove putovanja  
• Predlaže popularne i zanimljive lokacije, uključujući trendove s TikToka  

Korisnik dobiva **vizualno prikazan itinerar, pregled troškova i raspored aktivnosti**, što olakšava planiranje i donošenje odluka.

---

## 🧩 Struktura aplikacije

### 🎨 Frontend
• HTML, CSS i JavaScript  
• Unos podataka: destinacije, datumi, budžet, aktivnosti  
• Prikaz itinerera, aktivnosti i troškova kroz pregledno sučelje  

### 🖥 Backend
• Python (Flask ili FastAPI)  
• Obrada korisničkih zahtjeva  
• Komunikacija s chat botom i API servisima  
• Pohrana podataka u datotekama ili bazi  

### 🤖 Chat bot / agent
• Analizira korisničke unose  
• Generira preporuke aktivnosti i smještaja  
• Predlaže optimiziran raspored putovanja  
• Preporučuje na temelju trendova (npr. popularne TikTok lokacije)  

---

## 🌐 Integracija API-ja
• Skyscanner API – prikaz cijena letova, pretraživanje dostupnih ruta  
• Google Places API – aktivnosti, muzeji, restorani, atrakcije, recenzije i radno vrijeme  
• TikTok (RapidAPI) – popularne lokacije i aktivnosti (#londonthingstodo, #traveltrends)  

---

## ⚙ Funkcionalnosti
• Registracija i prijava korisnika  
• Unos destinacija i datuma putovanja  
• Odabir aktivnosti, smještaja i prijevoza  
• Praćenje i analiza budžeta  
• Prikaz itinerara i dnevnih aktivnosti  
• Preporuke chat bota temeljem preferencija  
• Optimizacija putovanja (vrijeme, troškovi, aktivnosti)  

---

## ⭐ Ključne značajke
• Jasan prikaz cijelog plana putovanja  
• Jednostavno biranje destinacija, aktivnosti, smještaja i prijevoza  
• Interaktivna vizualizacija itinerara i troškova  
• Inteligentne preporuke chat bota koje olakšavaju planiranje  

---

## 🗺 Mermaid dijagram arhitekture
```mermaid
flowchart TD
    A[Korisnik] -->|Upit / unos preferencija| B[Chatbot UI]
    B --> C[Backend server]
    C --> D[Skyscanner API]
    C --> E[Google Places API]
    C --> F[TikTok API]
    D --> C
    E --> C
    F --> C
    C -->|Obrađeni rezultati| B
    B -->|Prikaz rezultata| A
