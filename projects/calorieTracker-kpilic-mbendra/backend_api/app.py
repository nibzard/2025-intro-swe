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
# Dozvoljavamo sve izvore kako bismo izbjegli CORS greške koje vidiš na slici
CORS(app, resources={r"/api/*": {"origins": "*"}})

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# --- AUTENTIKACIJA (Provjereno radi) ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = generate_password_hash(data.get('password'))
        res = supabase.table('users').select("email").eq("email", email).execute()
        if res.data: return jsonify({"success": False, "message": "Korisnik već postoji!"})
        supabase.table('users').insert({"email": email, "password": password, "daily_kcal": 2000}).execute()
        return jsonify({"success": True, "message": "Registracija uspješna!"})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        res = supabase.table('users').select("*").eq("email", data.get('email')).execute()
        user = res.data[0] if res.data else None
        if user and check_password_hash(user['password'], data.get('password')):
            return jsonify({"success": True, "email": user['email'], "daily_kcal": user.get('daily_kcal', 2000)})
        return jsonify({"success": False, "message": "Pogrešni podaci!"})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

# --- RAD S OBROCIMA (Popravljeno za sliku i ručni unos) ---

@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    try:
        file = request.files['image']
        img_b64 = base64.b64encode(file.read()).decode('utf-8')
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": [
                {"type": "text", "text": "Analiziraj sliku. Vrati JSON: {\"name\": \"naziv na HR\", \"calories\": int, \"protein\": int, \"fat\": int, \"carbs\": int}"},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}}
            ]}],
            response_format={"type": "json_object"}
        )
        # Osiguravamo da su podaci čisti
        ai_data = json.loads(response.choices[0].message.content)
        return jsonify({"success": True, **ai_data})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    try:
        data = request.json
        prompt = f"Nutritivne vrijednosti za: {data['grams']}g {data['meal_name']}. Vrati isključivo JSON: {{\"name\": str, \"calories\": int, \"protein\": int, \"fat\": int, \"carbs\": int}}"
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return jsonify({"success": True, **json.loads(response.choices[0].message.content)})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/add_meal', methods=['POST'])
def add_meal():
    try:
        d = request.json
        # Forsiramo pretvorbu u int da izbjegnemo "0 kcal" greške
        supabase.table('meals').insert({
            "user_email": d['user_email'],
            "name": d['meal']['name'],
            "calories": int(d['meal'].get('calories', 0)),
            "protein": int(d['meal'].get('protein', 0)),
            "fat": int(d['meal'].get('fat', 0)),
            "carbs": int(d['meal'].get('carbs', 0)),
            "category": d['meal']['category'],
            "date": d['date']
        }).execute()
        return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})

@app.route('/api/get_meals', methods=['GET'])
def get_meals():
    try:
        email = request.args.get('email')
        date = request.args.get('date')
        res = supabase.table('meals').select("*").eq("user_email", email).eq("date", date).execute()
        return jsonify(res.data)
    except: return jsonify([])

if __name__ == '__main__':
    app.run(port=5000, debug=True)