# CalorieTracker - AI-Powered Nutrition Tracker

Aplikacija za personalizirano praćenje prehrane koja koristi Flask backend, Supabase za bazu podataka i autentifikaciju, te OpenAI za pametnu analizu obroka.

## Preduvjeti

* **Python** (v3.9+)
* **pip** (Python package manager)
* **Supabase račun** (URL i Anon Key)
* **OpenAI API ključ** (za analizu unosa hrane)

## Tehnologije

### Backend
* **Flask**: Web framework za API rute.
* **Supabase**: Relacijska baza podataka i User Management.
* **OpenAI SDK**: Za automatsku procjenu kalorija iz prirodnog jezika.
* **Werkzeug**: Sigurnosno hashiranje lozinki.

### Frontend
* **HTML5 / CSS3 / JavaScript** (Vanilla JS).
* **Chart.js**: Vizualni prikaz dnevnog i tjednog napretka (grafovi).
* **Fetch API**: Komunikacija s Flask backendom.

## Pokretanje projekta

### 1. Backend postavljanje

Pozicioniraj se u backend direktorij:
cd backend_api

Instaliraj potrebne biblioteke: 
pip install -r requirements.txt

Kreiraj .env datoteku u backend_api folderu i dodaj svoje ključeve:
supabase_url="TVOJ_SUPABASE_URL"
supabase_key="TVOJ_SUPABASE_ANON_KEY"
api_key_os="TVOJ_OPENAI_API_KEY"

Pokreni server:
python app.py

### 2. Frontend postavljanje

Pozicioniraj se u frontend direktorij

Otvori fronted_web/index.html pomoću Live Server ekstenzije u VS Code-u.


