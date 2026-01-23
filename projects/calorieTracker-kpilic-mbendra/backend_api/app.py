<<<<<<< HEAD
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app) 

# -------------------- KONFIGURACIJA --------------------
# Kreiranje foldera za slike (iako je isključen, neka ostane)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- FUNKCIJA: DOHVAT PODATAKA (SIMULACIJA ZA PRETRAŽIVANJE) ---
def _get_simulated_data(query_term):
    # Simulirani podaci (SVE VRIJEDNOSTI SU ZA 100g)
    db = {
        "piletina": {"name": "Pileća prsa", "calories": 165, "protein": 31.0, "fat": 3.6, "carbs": 0.0},
        "riza": {"name": "Kuhana riža", "calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28.2},
        "jabuka": {"name": "Jabuka", "calories": 52, "protein": 0.3, "fat": 0.2, "carbs": 13.8},
        "losos": {"name": "Filet lososa", "calories": 208, "protein": 20.4, "fat": 13.4, "carbs": 0.0}
    }
    
    normalized_query = query_term.lower()
    for key, value in db.items():
        if normalized_query in key or key in normalized_query:
            return value
    return None

# --- RUTE API-ja (FOKUS NA RUČNI UNOS) ---

# ---------------------- 1. RUTA: Analiza Slike (ISKLJUČENA) ----------------------
@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    return jsonify({'success': False, 'error': 'Analiza slike je isključena.'}), 400

# ---------------------- 2. RUTA: Barkod (ISKLJUČENA) ----------------------
@app.route('/api/lookup_barcode', methods=['POST'])
def lookup_barcode():
    return jsonify({'success': False, 'error': 'Barkod funkcionalnost je isključena.'}), 400

# ---------------------- 3. RUTA: Ručni unos / Pretraživanje Naziva (OSTAJE AKTIVNO) ----------------------
@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    if not request.json: 
        return jsonify({'success': False, 'error': 'Nema poslanih podataka.'}), 400

    data = request.json
    meal_name = data.get('meal_name', '')
    
    try:
        grams = float(data.get('grams', 100)) 
    except (ValueError, TypeError):
        grams = 100.0 
    
    if not meal_name:
        return jsonify({'success': False, 'error': 'Naziv obroka je obavezan.'}), 400

    meal_data = _get_simulated_data(meal_name) 
    
    if meal_data:
        # PRERAČUNAVANJE GRAMAŽE
        if grams > 0:
            factor = grams / 100.0
        else:
            factor = 0.0 
        
        # Skaliranje svih vrijednosti
        meal_data['name'] = f"{meal_data['name']} ({grams:.0f}g)"
        meal_data['calories'] = round(meal_data['calories'] * factor, 0)
        meal_data['protein'] = round(meal_data['protein'] * factor, 1)
        meal_data['fat'] = round(meal_data['fat'] * factor, 1)
        meal_data['carbs'] = round(meal_data['carbs'] * factor, 1)
        
        return jsonify({'success': True, **meal_data})
    else:
        return jsonify({'success': False, 'error': f'Kalorije za "{meal_name}" nisu pronađene (Pokušajte ručni unos broja)'}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)
=======
import os
import json
import base64
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Učitavanje okolišnih varijabli (.env datoteka)
load_dotenv()

app = Flask(__name__)
CORS(app)

# Inicijalizacija OpenAI klijenta
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- KONFIGURACIJA BAZE PODATAKA ---

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Pokreni inicijalizaciju baze pri pokretanju servera
init_db()

# --- RUTE ZA AUTENTIKACIJU ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"success": False, "message": "Email i lozinka su obavezni!"}), 400
            
        hashed_password = generate_password_hash(password)

        conn = get_db_connection()
        conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Registracija uspješna! Sada se možete prijaviti."})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Korisnik s ovim emailom već postoji!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        return jsonify({"success": True, "message": "Prijava uspješna!"})
    else:
        return jsonify({"success": False, "message": "Pogrešan email ili lozinka!"})

# --- RUTE ZA ANALIZU HRANE I TDEE (Tvoj originalni kod) ---

@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    data = request.json
    prompt = f"Procijeni nutritivne vrijednosti za: {data['grams']}g '{data['meal_name']}'. Naziv napiši na HRVATSKOM. Vrati JSON: {{'name': str, 'calories': int, 'protein': int, 'fat': int, 'carbs': int}}"
    response = client.chat.completions.create(
        model="gpt-4o-mini", 
        messages=[{"role": "user", "content": prompt}], 
        response_format={"type": "json_object"}
    )
    return jsonify({"success": True, **json.loads(response.choices[0].message.content)})

@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    img = base64.b64encode(request.files['image'].read()).decode('utf-8')
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": [
            {"type": "text", "text": "Analiziraj sliku. Naziv na HRVATSKOM. Vrati JSON: {'name':str, 'calories':int, 'protein':int, 'fat':int, 'carbs':int}"},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}}
        ]}],
        response_format={"type": "json_object"}
    )
    return jsonify({"success": True, **json.loads(response.choices[0].message.content)})

@app.route('/api/calculate_tdee', methods=['POST'])
def calculate_tdee():
    try:
        d = request.json
        age = float(d['age'])
        weight = float(d['weight'])
        height = float(d['height'])
        target_w = float(d['target_weight'])
        activity = d['activity']

        # Mifflin-St Jeor formula
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        factors = {
            "sedentary": 1.2,
            "lightly_active": 1.375,
            "moderately_active": 1.55,
            "very_active": 1.725
        }
        factor = factors.get(activity, 1.2)
        tdee = bmr * factor

        if target_w < weight:
            final_kcal = tdee - 500
        elif target_w > weight:
            final_kcal = tdee + 300
        else:
            final_kcal = tdee

        return jsonify({
            "success": True, 
            "recommended_kcal": int(final_kcal),
            "bmr": int(bmr)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
