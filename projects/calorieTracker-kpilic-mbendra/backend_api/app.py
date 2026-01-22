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