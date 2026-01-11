import os
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/api/lookup_meal', methods=['POST'])
def lookup_meal():
    data = request.json
    prompt = f"Procijeni nutritivne vrijednosti za: {data['grams']}g '{data['meal_name']}'. Naziv napiši na HRVATSKOM. Vrati JSON: {{'name': str, 'calories': int, 'protein': int, 'fat': int, 'carbs': int}}"
    response = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    return jsonify({"success": True, **json.loads(response.choices[0].message.content)})

@app.route('/api/analyze_meal', methods=['POST'])
def analyze_meal():
    img = base64.b64encode(request.files['image'].read()).decode('utf-8')
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": [{"type": "text", "text": "Analiziraj sliku. Naziv na HRVATSKOM. Vrati JSON: {'name':str, 'calories':int, 'protein':int, 'fat':int, 'carbs':int}"},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}}]}],
        response_format={"type": "json_object"}
    )
    return jsonify({"success": True, **json.loads(response.choices[0].message.content)})

@app.route('/api/calculate_tdee', methods=['POST'])
def calculate_tdee():
    try:
        d = request.json
        # Pretvaranje u brojeve
        age = float(d['age'])
        weight = float(d['weight'])
        height = float(d['height'])
        target_w = float(d['target_weight'])
        activity = d['activity']

        # 1. Izračun BMR (Mifflin-St Jeor formula za muškarce - prosjek)
        # BMR = 10*weight + 6.25*height - 5*age + 5
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5

        # 2. Faktor aktivnosti
        factors = {
            "sedentary": 1.2,
            "lightly_active": 1.375,
            "moderately_active": 1.55,
            "very_active": 1.725
        }
        factor = factors.get(activity, 1.2)
        tdee = bmr * factor

        # 3. Prilagodba cilju (Deficit ili Suficit)
        # Ako je ciljana težina manja od trenutne, oduzmi 500 kcal
        if target_w < weight:
            final_kcal = tdee - 500
        elif target_w > weight:
            final_kcal = tdee + 300
        else:
            final_kcal = tdee

        # 4. AI potvrda i objašnjenje (opcionalno, ali kôd ostaje stabilan)
        prompt = (f"Korisnik želi sa {weight}kg doći na {target_w}kg. Izračunali smo {int(final_kcal)} kcal. "
                  "Potvrdi kratko na hrvatskom je li to u redu.")
        
        # Vraćamo rezultat
        return jsonify({
            "success": True, 
            "recommended_kcal": int(final_kcal),
            "bmr": int(bmr)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
if __name__ == '__main__':
    app.run(port=5000, debug=True)