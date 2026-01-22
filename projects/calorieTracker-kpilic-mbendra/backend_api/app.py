from itsdangerous import URLSafeTimedSerializer
import os
import json
import base64
import sqlite3
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash



# Učitavanje .env datoteke
load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['MAIL_SERVER'] = 'sandbox.smtp.mailtrap.io'
app.config['MAIL_PORT'] = 2525
app.config['MAIL_USERNAME'] = 'de1ce8fc1c0fa8' # Tvoj Username sa slike
app.config['MAIL_PASSWORD'] = '8c0c30167ad29d' # Tvoj Password (moraš kliknuti na zvjezdice na slici da ga vidiš cijelog)
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['SECRET_KEY'] = 'neka_jako_tajna_sifra_123'


mail = Mail(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])


# --- BAZA PODATAKA ---

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Dodajemo 'is_verified' za buduću potvrdu maila
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0,
            daily_kcal INTEGER DEFAULT 0
        )
    ''')
   
    conn.execute('''
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            name TEXT NOT NULL,
            calories INTEGER NOT NULL,
            protein INTEGER NOT NULL,
            fat INTEGER NOT NULL,
            carbs INTEGER NOT NULL,
            category TEXT NOT NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# --- RUTE ZA AUTENTIKACIJU (Login & Register) ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = generate_password_hash(data.get('password'))

        conn = get_db_connection()
        conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, password))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Registracija uspješna!"})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Korisnik već postoji!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT id, email, password, daily_kcal FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        return jsonify({
            "success": True, 
            "email": user['email'],
            "daily_kcal": user['daily_kcal']
        })
    return jsonify({"success": False, "message": "Pogrešan email ili lozinka!"})

# --- ZABORAVLJENA LOZINKA (SendGrid) ---

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user:
        token = serializer.dumps(email, salt='password-reset-salt')
        reset_url = f"http://127.0.0.1:5000/reset-password/{token}"
        
        msg = Message('Resetiranje lozinke - Kalorijski Dnevnik',
                      sender='podrska@tvoja-aplikacija.com',
                      recipients=[email])
        msg.body = f"Pozdrav,\n\nKliknite na sljedeći link kako biste postavili novu lozinku: {reset_url}\n\nLink vrijedi 30 minuta."
        
        try:
            mail.send(msg)
            return jsonify({"success": True, "message": "Link za reset je poslan! Provjeri svoj Mailtrap Inbox."})
        except Exception as e:
            print(f"Greška: {e}")
            return jsonify({"success": False, "message": "Greška pri slanju maila."})
    
    return jsonify({"success": False, "message": "Korisnik s tim e-mailom ne postoji."})

# --- RUTA KOJA SE OTVARA IZ MAILA ---

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=1800) # 30 min link
    except:
        return "<h1>Link je nevažeći ili je istekao.</h1>"

    if request.method == 'POST':
        new_password = generate_password_hash(request.form.get('password'))
        conn = get_db_connection()
        conn.execute('UPDATE users SET password = ? WHERE email = ?', (new_password, email))
        conn.commit()
        conn.close()
        return "<h1>Lozinka uspješno promijenjena! Možete se prijaviti u aplikaciji.</h1>"

    # Jednostavna HTML forma koja se prikaže u pregledniku kad klikneš na link
    return render_template_string('''
        <body style="background: #0c0c0c; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <form method="POST" style="background: #181818; padding: 30px; border-radius: 15px; border: 1px solid #7c3aed;">
                <h2>Nova lozinka</h2>
                <input type="password" name="password" placeholder="Unesite novu lozinku" required style="padding: 10px; border-radius: 5px; width: 250px;"><br><br>
                <button type="submit" style="background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%;">Spremi lozinku</button>
            </form>
        </body>
    ''')

# --- RUTE ZA ANALIZU (Originalni kôd) ---

@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    data = request.json
    prompt = f"Procijeni nutritivne vrijednosti za: {data['grams']}g '{data['meal_name']}'. Naziv na HRVATSKOM. Vrati JSON: {{'name': str, 'calories': int, 'protein': int, 'fat': int, 'carbs': int}}"
    response = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"})
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
        age, weight, height, target_w = float(d['age']), float(d['weight']), float(d['height']), float(d['target_weight'])
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        factors = {"sedentary": 1.2, "lightly_active": 1.375, "moderately_active": 1.55, "very_active": 1.725}
        tdee = bmr * factors.get(d['activity'], 1.2)
        final_kcal = tdee - 500 if target_w < weight else (tdee + 300 if target_w > weight else tdee)
        return jsonify({"success": True, "recommended_kcal": int(final_kcal), "bmr": int(bmr)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# RUTA ZA SPREMANJE OBROKA
@app.route('/api/add_meal', methods=['POST'])
def save_meal():
    data = request.json
    user_email = data.get('user_email')
    meal = data.get('meal') # Ovo je objekt koji dobijemo od AI-ja
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO meals (user_email, name, calories, protein, fat, carbs, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_email, meal['name'], meal['calories'], meal['protein'], meal['fat'], meal['carbs'], meal['category']))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# RUTA ZA DOHVAĆANJE SVIH OBROKA KORISNIKA
@app.route('/api/get_meals', methods=['GET'])
def get_meals():
    user_email = request.args.get('email')
    selected_date = request.args.get('date') # Dobivamo npr. "2024-05-20"
    if not selected_date:
        from datetime import datetime
        selected_date = datetime.now().strftime('%Y-%m-%d')

    conn = get_db_connection()
    # Filtriramo obroke koji počinju s tim datumom (YYYY-MM-DD)
    user_meals = conn.execute('''
        SELECT * FROM meals 
        WHERE user_email = ? AND date LIKE ? 
        ORDER BY date DESC
    ''', (user_email, f"{selected_date}%")).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in user_meals])
@app.route('/api/delete_meal/<int:meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM meals WHERE id = ?', (meal_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/delete_all_meals', methods=['DELETE'])
def delete_all_meals():
    user_email = request.args.get('email')
    selected_date = request.args.get('date') # Ovo je ključno!
    
    if not user_email or not selected_date:
        return jsonify({"success": False, "message": "Podaci nepotpuni"}), 400
        
    conn = get_db_connection()
    # Brišemo samo za tog korisnika i taj datum
    conn.execute('DELETE FROM meals WHERE user_email = ? AND date LIKE ?', 
                 (user_email, f"{selected_date}%"))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/save_goal', methods=['POST'])
def save_goal():
    data = request.json
    email = data.get('email')
    kcal = data.get('kcal')
    
    conn = get_db_connection()
    conn.execute('UPDATE users SET daily_kcal = ? WHERE email = ?', (kcal, email))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    init_db()
    app.run(port=5000, debug=True)