import os
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from openai import OpenAI
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# POMOĆNE FUNKCIJE - Sprječavaju padove baze
def to_f(val):
    try: return float(val) if val else 0.0
    except: return 0.0

def to_i(val):
    try: return int(float(val)) if val else 0
    except: return 0

# --- AUTENTIKACIJA ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = generate_password_hash(data.get('password'))
        
        # 1. Spremi korisnika
        supabase.table('users').insert({"email": email, "password": password, "daily_kcal": 0}).execute()
        
        # 2. ODMAH napravi profil da tablica 'profiliKorisnika' ne bude prazna
        supabase.table('profiliKorisnika').insert({"korisnik_id": email, "cilj_kalorija": 0}).execute()
        
        return jsonify({"success": True, "message": "Registracija uspješna! Sad se prijavi."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        res = supabase.table('users').select("*").eq("email", email).execute()
        user = res.data[0] if res.data else None
        
        if user and check_password_hash(user['password'], data.get('password')):
            # Gledamo u 'profiliKorisnika' jer tamo spremamo detalje
            p_res = supabase.table('profiliKorisnika').select("cilj_kalorija").eq("korisnik_id", email).execute()
            kcal = p_res.data[0].get('cilj_kalorija', 0) if p_res.data else 0
            
            return jsonify({"success": True, "email": email, "daily_kcal": kcal})
        return jsonify({"success": False, "message": "Pogrešni podaci!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
# --- PROFIL I CILJEVI ---

@app.route('/api/calculate_tdee', methods=['POST'])
def calculate_tdee():
    try:
        d = request.json
        w, h, age = to_f(d.get('weight')), to_f(d.get('height')), to_i(d.get('age'))
        tw = to_f(d.get('target_weight'))
        bmr = (10 * w) + (6.25 * h) - (5 * age) + 5
        fa = {"sedentary": 1.2, "lightly_active": 1.375, "moderately_active": 1.55, "very_active": 1.725}
        tdee = bmr * fa.get(d.get('activity'), 1.2)
        final = tdee - 500 if tw < w else (tdee + 300 if tw > w else tdee)
        return jsonify({"success": True, "recommended_kcal": int(final)})
    except Exception as e: return jsonify({"success": False, "error": str(e)}), 500
def siguran_broj(val, tip="float"):
    """Sprječava rušenje servera ako je polje prazno ili sadrži krivi tekst."""
    if val is None or str(val).strip() == "":
        return 0.0 if tip == "float" else 0
    try:
        # Ako je val slučajno već broj ili string koji se može pretvoriti
        return float(val) if tip == "float" else int(float(val))
    except:
        return 0.0 if tip == "float" else 0
@app.route('/api/save_goal', methods=['POST'])
def save_goal():
    try:
        data = request.json
        email = data.get('email')
        
        # Pripremimo podatke
        payload = {
            "korisnik_id": email,
            "cilj_kalorija": int(float(data.get('kcal', 0))),
            "visina": float(data.get('height', 0)),
            "tezina": float(data.get('weight', 0)),
            "godine": int(float(data.get('age', 0))),
            "aktivnost": 1.2
        }

        # PRVO PROVJERI: Postoji li već taj mail?
        check = supabase.table('profiliKorisnika').select("id").eq("korisnik_id", email).execute()
        
        if check.data:
            # Ako postoji -> UPDATE
            supabase.table('profiliKorisnika').update(payload).eq("korisnik_id", email).execute()
            
        else:
            # Ako ne postoji -> INSERT
            supabase.table('profiliKorisnika').insert(payload).execute()
            print(f"DEBUG: Profil za {email} je KREIRAN.")
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"GREŠKA U SAVE_GOAL: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
# --- OBROCI I AI ANALIZA ---

@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    try:
        file = request.files['image']
        img_b64 = base64.b64encode(file.read()).decode('utf-8')
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": [
                {"type": "text", "text": "Vrati isključivo JSON: {\"name\": str, \"calories\": int, \"protein\": int, \"fat\": int, \"carbs\": int}"},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
            ]}],
            response_format={"type": "json_object"}
        )
        return jsonify({"success": True, **json.loads(response.choices[0].message.content)})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    try:
        data = request.json
        prompt = f"Nutritivne vrijednosti za: {data['grams']}g {data['meal_name']}. Vrati JSON: {{\"name\": str, \"calories\": int, \"protein\": int, \"fat\": int, \"carbs\": int}}"
        response = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"})
        return jsonify({"success": True, **json.loads(response.choices[0].message.content)})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/add_meal', methods=['POST'])
def add_meal():
    try:
        d = request.json
        supabase.table('meals').insert({
            "user_email": d['user_email'],
            "name": d['meal']['name'],
            "calories": to_i(d['meal'].get('calories')),
            "protein": to_i(d['meal'].get('protein')),
            "fat": to_i(d['meal'].get('fat')),
            "carbs": to_i(d['meal'].get('carbs')),
            "category": d['meal'].get('category'),
            "date": d['date']
        }).execute()
        return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete_meals', methods=['DELETE'])
def delete_meals():
    email = request.args.get('email')
    date = request.args.get('date')
    
    try:
       
        supabase.table('meals').delete().eq('user_email', email).eq('date', date).execute()
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"Greška kod brisanja: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/delete_single_meal', methods=['DELETE'])
def delete_single_meal():
    meal_id = request.args.get('id')
    
    try:
        # Brišemo točno taj red u bazi koji ima taj ID
        supabase.table('meals').delete().eq('id', meal_id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route('/api/get_meals', methods=['GET'])
def get_meals():
    try:
        email, date = request.args.get('email'), request.args.get('date')
        res = supabase.table('meals').select("*").eq("user_email", email).eq("date", date).execute()
        return jsonify(res.data)
    except: return jsonify([])


if __name__ == '__main__':
    app.run(port=5000, debug=True)